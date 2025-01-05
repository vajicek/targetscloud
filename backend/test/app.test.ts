import { describe, beforeAll, it, afterAll, test, expect } from "@jest/globals"
import { GenericContainer, StartedTestContainer } from "testcontainers";
import { MongoClient, Db } from "mongodb";
import express from 'express';
import supertest from 'supertest';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import { connectToMongo, disconnectFromMongo } from '../src/models';
import { getApp } from '../src/app';

import { IUser } from 'model/types';

describe('User API', () => {
	let mongoContainer: StartedTestContainer;
	let mongoUri: string;
	let mongoDbUri: string;
	let client: MongoClient;
	let db: Db;
	let app: express.Express;
	let authToken: string;

	beforeAll(async () => {
		mongoContainer = await new GenericContainer("mongo")
			.withExposedPorts(27017)
			.start();

		const mongoPort = mongoContainer.getMappedPort(27017);
		const mongoHost = mongoContainer.getHost();
		mongoUri = `mongodb://${mongoHost}:${mongoPort}`;
		mongoDbUri = mongoUri + "/master";

		client = new MongoClient(mongoUri);
		await client.connect();
		db = client.db("master");

		const secret = crypto.randomBytes(32).toString('hex');
		//TODO: auth token function
		authToken = jwt.sign({username: "user.name", id: "user.id"},
			secret,
			{ expiresIn: '1h' });
		const models = await connectToMongo(mongoDbUri);
		app = getApp(secret, "");
	});

	afterAll(async () => {
		if (client) await client.close();
		if (mongoContainer) await mongoContainer.stop();
		await disconnectFromMongo();
	});

	let storeUser = async (name: string) => {
		const record: IUser = {
			name: name,
			display_name: "display name",
			email: "user@email.com",
			picture: "picture_uri",
			id: uuidv4(),
			trainings: [],
			friendships: [],
			groups: []
		};
		await db.collection<IUser>("users")
			.insertOne(record);
		return record;
	}

	let authRequest = (uri: string) => {
		return supertest(app)
			.get(uri)
			.set('Authorization', `Bearer ${authToken}`);
	}

	it('should fetch all users via REST', async () => {
		// Arrange
		const record = await storeUser("user name");

		// Act
		const response = await authRequest('/api/users');

		// Assert
		expect(response.status).toBe(200);
		expect(response.body).toEqual(JSON.parse(JSON.stringify([record])));
	});

	it('should search in users via REST', async () => {
		// Arrange
		const record1 = await storeUser("abcd");
		const record2 = await storeUser("xyz");
		const record3 = await storeUser("abc efgh");
		const record4 = await storeUser("user name");

		// Act
		const response = await authRequest('/api/users/search')
			.query({ name: 'abc' });

		// Assert
		expect(response.status).toBe(200);
		expect(response.body).toEqual(JSON.parse(JSON.stringify([record1, record3])));
	}, 10000);

	it('should make friend via REST', async () => {
		const user1 = await storeUser("user1");
		const user2 = await storeUser("user2");

		// No friends
		const friendList1 = await authRequest(`/api/users/${user1.id}/friends`);

		expect(friendList1.status).toBe(200);
		expect(friendList1.body).toHaveLength(0);

		const response1 = await authRequest(`/api/users/${user1.id}/friendship`)
			.query({ id: user2.id, action: 'request' });

		// Still no friends
		const friendList2 = await authRequest(`/api/users/${user1.id}/friends`);

		expect(friendList2.status).toBe(200);
		expect(friendList2.body).toHaveLength(0);

		const response2 = await authRequest(`/api/users/${user2.id}/friendship`)
			.query({ id: user1.id, action: 'accept' });

		// One friend
		const friendList3 = await authRequest(`/api/users/${user1.id}/friends`);

		expect(friendList3.status).toBe(200);
		expect(friendList3.body).toHaveLength(1);

		// Friendship is symmetric in this case
		const friendList4 = await authRequest(`/api/users/${user2.id}/friends`);

		expect(friendList4.status).toBe(200);
		expect(friendList4.body).toHaveLength(1);
	});

	it('should create group via REST', async () => {
		const user1 = await storeUser("user1");
		const user2 = await storeUser("user2");

		// No groups
		const groupList1 = await authRequest(`/api/users/${user1.id}/groups`);

		expect(groupList1.status).toBe(200);
		expect(groupList1.body).toHaveLength(0);

		await authRequest(`/api/users/${user1.id}/group`)
			.query({ name: "My group", action: 'create' });

		// One group
		const groupList2 = await authRequest(`/api/users/${user1.id}/groups`);

		expect(groupList2.status).toBe(200);
		expect(groupList2.body).toHaveLength(1);

		// user2 has no groups
		const groupList3 = await authRequest(`/api/users/${user2.id}/groups`);

		expect(groupList3.status).toBe(200);
		expect(groupList3.body).toHaveLength(0);

		// Invite user2, twice
		await authRequest(`/api/users/${user1.id}/group`)
			.query({ groupId: groupList2.body[0].id, action: 'invite', userId: user2.id });
		await authRequest(`/api/users/${user1.id}/group`)
			.query({ groupId: groupList2.body[0].id, action: 'invite', userId: user2.id });

		// user2 has one group (invitation)
		const groupList4 = await authRequest(`/api/users/${user2.id}/groups`);

		expect(groupList4.status).toBe(200);
		expect(groupList4.body).toHaveLength(1);
		expect(groupList4.body[0]["display_name"]).toBe("My group");

		// still not accepted invitation
		expect(groupList4.body[0].participants.length).toBe(1);

		// accept invitation
		await authRequest(`/api/users/${user2.id}/group`)
			.query({ groupId: groupList2.body[0].id, action: 'accept' });

		const groupList5 = await authRequest(`/api/users/${user2.id}/groups`);

		expect(groupList5.body[0].participants.length).toBe(2);
	});

});
