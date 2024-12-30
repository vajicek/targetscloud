import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

import { IFriendshipStatus, IUser, IChat } from 'model/types';

import { logger } from './logging';


export async function getAllUsers(req: any, res: any, usersModel: any) {
	try {
		logger.info("Getting all users");
		const data = await usersModel.find();
		res.json(data);
	} catch (error: any) {
		res.status(500).json({ error: error.message });
	}
}


export async function searchUsers(req: any, res: any, usersModel: any) {
	try {
		logger.info(`Searching users query.name=${req.query.name}`);
		const namePattern = new RegExp(`.*${req.query.name}.*`);
		const data = await usersModel.find({ name: { $regex: namePattern } })
			.exec();
		res.json(data);
	} catch (error: any) {
		res.status(500)
			.json({ error: error.message });
	}
}


export async function getUser(req: any, res: any, usersModel: any) {
	try {
		logger.info(`Getting user id=${req.params.id}`);
		const data = await usersModel.find({ id: String(req.params.id) })
			.exec();
		res.json(data);
	} catch (error: any) {
		res.status(500)
			.json({ error: error.message });
	}
}


export async function updateUser(req: any, res: any, usersModel: any) {
	try {
		logger.info(`Updating user id=${req.params.id}`);
		const retVal = await usersModel.updateOne(
			{ id: String(req.params.id) },
			req.body);
		res.json(retVal);
	} catch (error: any) {
		logger.error(error);
		res.status(500)
			.json({ error: error.message });
	}
};


function loginResponse(user: any, res: any, secret: string) {
	// return application token
	logger.info("Login successful");
	const token = jwt.sign({
		username: user.name,
		id: user.id
	},
		secret,
		{ expiresIn: '1h' });
	res.json({ token });
}


export async function login(req: any, res: any, usersModel: any, userAuthsModel: any, secret: string) {
	logger.info("Logging in");

	const { username, password } = req.body;

	logger.info(`Fetching user (username=${username}) authentication details`);
	const userAuth = await userAuthsModel.find({ username: username })
		.exec();

	logger.info("Validating credentials");
	if (userAuth.length === 0 ||
		!(await bcrypt.compare(password, userAuth[0].password))) {
		const msg: string = 'Access denied. Invalid username or password!';
		logger.error(msg);
		return res.status(401)
			.send(msg);
	}

	const user = await usersModel.findOne({ name: username })
		.exec();

	loginResponse(user, res, secret);
}


async function createIfNeeded(payload: any, usersModel: any) {

	const username = payload.sub;
	const name = payload.name;
	const picture = payload.picture;
	const email = payload.email;

	logger.info(`Fetching user (username=${username}) authentication details`);
	const user = await usersModel.findOne({ name: username })
		.exec();

	if (user) {
		return Promise.resolve(user);
	}

	logger.info(`User ${username} does not exist yet`);
	const latestUser = await usersModel.findOne({}, {}, { sort: { id: -1 } })
		.exec();
	const userId = parseInt(latestUser["id"]) + 1;
	return usersModel.create({
		"id": String(userId),
		"name": username,
		"display_name": name,
		"email": email,
		"picture": picture,
		"trainings": [],
		"friends": [],
		"chats": [],
		"groups": []
	}).then((doc: any) => {
		logger.debug(`Record inserted: ${doc}`);
		return doc;
	}).catch((err: any) => {
		logger.error(`Error inserting record: ${err}`);
	});
}


export async function loginWithGoogle(googleClient: any,
	googleClientId: any,
	req: any,
	res: any,
	usersModel: any,
	secret: string) {

	logger.info("Logging in with Google token");

	logger.info("Validating token");
	const googleToken = req.body.token;
	const ticket = await googleClient.verifyIdToken({
		idToken: googleToken,
		audience: googleClientId,
	});
	const payload = ticket.getPayload();
	const user = await createIfNeeded(payload, usersModel);
	loginResponse(user, res, secret);
}

export async function getFriends(req: any, res: any, usersModel: any) {
	try {
		logger.info(`Getting user id=${req.params.id}`);
		const user = await (usersModel as mongoose.Model<IUser>)
			.findOne({ id: String(req.params.id) })
			.exec();

		logger.info(`Getting friends of user id=${req.params.id}`);
		const friendIds = user?.friendships
			.filter(friendship => friendship.status == IFriendshipStatus.ACCEPTED)
			.map(friendship => friendship.id);
		const friends = await usersModel.find({ id: { $in: friendIds } });

		res.json(friends);
	} catch (error: any) {
		res.status(500)
			.json({ error: error.message });
	}
}

async function updateFriendships(requesterId: string,
	receiverId: string,
	status: IFriendshipStatus,
	chatRef: any,
	usersModel: mongoose.Model<IUser>) {

	const requester = await usersModel.findOne({ id: String(requesterId) }).exec();
	const receiver = await usersModel.findOne({ id: String(receiverId) }).exec();

	logger.info(`Updating requester's friendships`);
	await usersModel.updateOne({ id: requesterId }, {
		friendships: requester?.friendships
			.filter(friendship => friendship.id != receiverId)
			.concat([{
				id: receiverId,
				status: status,
				outgoing: true,
				chat: chatRef
			}])
	});

	logger.info(`Updating receiver's friendships`);
	await usersModel.updateOne({ id: receiverId }, {
		friendships: receiver?.friendships
			.filter(friendship => friendship.id != requesterId)
			.concat([{
				id: requesterId,
				status: status,
				outgoing: false,
				chat: chatRef
			}])
	});
}

function createChat(chatsModel: mongoose.Model<IChat>): mongoose.Model<IChat> {
	return new chatsModel({
		id: uuidv4(),
		display_name: "xxx",
		participants: [
			new ParticipantSchema({}),
			new ParticipantSchema({})
		],
		messages: [],
	});
}

export async function friendshipRequest(req: any, res: any, usersModel: any, chatsModel: any) {
	try {
		if (req.query.action == 'request') {
			logger.info(`Making friendship request by user id=${req.params.id} to id=${req.query.id}`);
			await updateFriendships(req.params.id, req.query.id, IFriendshipStatus.PENDING, null, usersModel);
		} else if (req.query.action == 'accept') {
			logger.info(`Accepting friendship request by user id=${req.query.id} to id=${req.params.id}`);



			await updateFriendships(req.params.id, req.query.id, IFriendshipStatus.ACCEPTED, null, usersModel);

			// TODO: , and chat

		} else if (req.query.action == 'reject') {
			logger.info(`Rejecting friendship request by user id=${req.query.id} to id=${req.params.id}`);
			await updateFriendships(req.params.id, req.query.id, IFriendshipStatus.REJECTED, null, usersModel);
		} else {
			throw new Error(`Unknown action parameter = {req.query.action}`)
		}
		res.json([]);
	} catch (error: any) {
		console.log(error);
		res.status(500)
			.json({ error: error.message });
	}
}


export async function getGroups(req: any, res: any, usersModel: any, groupsModel: any) {
	logger.info(`Getting groups of user id=${req.params.id}`);
	try {
		logger.info(`Getting user id=${req.params.id}`);
		const user = await(usersModel as mongoose.Model<IUser>)
			.findOne({ id: String(req.params.id) })
			.exec();

		// TODO: get all groups for user

		// logger.info(`Getting friends of user id=${req.params.id}`);
		// const friendIds = user?.friendships
		// 	.filter(friendship => friendship.status == IFriendshipStatus.ACCEPTED)
		// 	.map(friendship => friendship.id);
		// const friends = await usersModel.find({ id: { $in: friendIds } });

		// res.json(friends);
	} catch (error: any) {
		res.status(500)
			.json({ error: error.message });
	}
}


export function groupRequest(req: any, res: any, usersModel: any/*, groupsModel: any*/) {
	logger.info(`Getting groups of user id=${req.params.id}`);
	try {

		// TODO: create group, and chat
		// TODO: invite to group
		// TODO: kick out of group
		// TODO: destroy group

//		if (req.query.action == 'request') {
		res.json([]);
	} catch (error: any) {
		console.log(error);
		res.status(500)
			.json({ error: error.message });
	}
}


export function getChat(req: any, res: any, usersModel: any, groupsModel: any) {
	logger.info(`Getting chat chatId=${req.params.chatId} of user id=${req.params.id}`);
	try {

		// TODO: get check with all messages

		res.json([]);
	} catch (error: any) {
		console.log(error);
		res.status(500)
			.json({ error: error.message });
	}
}


export function sendMessage(req: any, res: any, usersModel: any, groupsModel: any) {
	logger.info(`Sending message as user id=${req.params.id}`);
	try {

		// TODO: send message, notify members

		res.json([]);
	} catch (error: any) {
		console.log(error);
		res.status(500)
			.json({ error: error.message });
	}
}
