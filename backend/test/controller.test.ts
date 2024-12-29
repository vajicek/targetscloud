import { describe, beforeAll, it, afterAll, expect } from "@jest/globals"
import { GenericContainer, StartedTestContainer } from "testcontainers";
import { MongoClient, Db } from "mongodb";
import { stub } from 'sinon';

import { connectToMongo, disconnectFromMongo } from '../src/models';
import { getAllUsers } from '../src/controller';

import { IUser } from 'model/types';

describe('Test User Model', () => {
	let mongoContainer: StartedTestContainer;
	let mongoUri: string;
	let mongoDbUri: string;
	let client: MongoClient;
	let db: Db;

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
	});

	afterAll(async () => {
		if (client) await client.close();
		if (mongoContainer) await mongoContainer.stop();
	});

	it('should fetch all users from controller', async () => {
		// Arrange
		const record: IUser = {
			name: "user name",
			display_name: "display name",
			email: "user@email.com",
			picture: "picture_uri",
			id: "0001",
			trainings: [],
			friendships: [],
			chats: [],
			groups: []
		};
		await db.collection<IUser>("users")
			.insertOne(record);

		// Act
		const models = await connectToMongo(mongoDbUri);
		const req = { };
		const res = {
			status: stub().returnsThis(),
			json: stub(),
		};
		await getAllUsers(req, res, models.get("users"));
		await disconnectFromMongo();

		// Assert
		const normalize = (obj: any) => JSON.parse(JSON.stringify(obj));
		expect(normalize(res.json.getCall(0).args[0]))
			.toEqual(normalize([record]));
	}, 10000);
});