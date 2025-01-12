import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

import { IFriendshipStatus, IGroupMembershipStatus } from 'model/types';
import { User, UserAuth, Chat } from './models';

import { logger } from './logging';


export async function getAllUsers(req: any, res: any) {
	try {
		logger.info("Getting all users");
		const data = await User.find();
		res.json(data);
	} catch (error: any) {
		res.status(500).json({ error: error.message });
	}
}


export async function searchUsers(req: any, res: any) {
	try {
		logger.info(`Searching users query.name=${req.query.name}`);
		const namePattern = new RegExp(`.*${req.query.name}.*`);
		const data = await User.find({ name: { $regex: namePattern } })
			.exec();
		res.json(data);
	} catch (error: any) {
		res.status(500)
			.json({ error: error.message });
	}
}


export async function getUser(req: any, res: any) {
	try {
		logger.info(`Getting user id=${req.params.id}`);
		const data = await User.find({ id: String(req.params.id) })
			.populate('groups')
			.populate('groups.id')
			.populate('groups.chat')
			.exec();
		res.json(data);
	} catch (error: any) {
		res.status(500)
			.json({ error: error.message });
	}
}


export async function updateUser(req: any, res: any) {
	try {
		logger.info(`Updating user id=${req.params.id}`);
		const retVal = await User.updateOne(
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


export async function login(req: any, res: any, secret: string) {
	logger.info("Logging in");

	const { username, password } = req.body;

	logger.info(`Fetching user (username=${username}) authentication details`);
	const userAuth = await UserAuth.find({ username: username })
		.exec();

	logger.info("Validating credentials");
	if (userAuth.length === 0 ||
		!(await bcrypt.compare(password, userAuth[0].password))) {
		const msg: string = 'Access denied. Invalid username or password!';
		logger.error(msg);
		return res.status(401)
			.send(msg);
	}

	const user = await User.findOne({ name: username })
		.exec();

	loginResponse(user, res, secret);
}


async function createIfNeeded(payload: any) {

	const username = payload.sub;
	const name = payload.name;
	const picture = payload.picture;
	const email = payload.email;

	logger.info(`Fetching user (username=${username}) authentication details`);
	const user = await User.findOne({ name: username })
		.exec();

	if (user) {
		return Promise.resolve(user);
	}

	logger.info(`User ${username} does not exist yet`);
	const latestUser = await User.findOne({}, {}, { sort: { id: -1 } })
		.exec();
	const userId = parseInt(latestUser?.id) + 1;
	return User.create({
		"id": String(userId),
		"name": username,
		"display_name": name,
		"email": email,
		"picture": picture,
		"trainings": [],
		"friends": [],
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
	secret: string) {

	logger.info("Logging in with Google token");

	logger.info("Validating token");
	const googleToken = req.body.token;
	const ticket = await googleClient.verifyIdToken({
		idToken: googleToken,
		audience: googleClientId,
	});
	const payload = ticket.getPayload();
	const user = await createIfNeeded(payload);
	loginResponse(user, res, secret);
}

export async function getFriends(req: any, res: any) {
	try {
		logger.info(`Getting user id=${req.params.id}`);
		const user = await User.findOne({ id: String(req.params.id) })
			.exec();

		logger.info(`Getting friends of user id=${req.params.id}`);
		const friendIds = user?.friendships
			.filter(friendship => friendship.status == IFriendshipStatus.ACCEPTED)
			.map(friendship => friendship.id);
		const friends = await User.find({ id: { $in: friendIds } })
			.exec();

		res.json(friends);
	} catch (error: any) {
		res.status(500)
			.json({ error: error.message });
	}
}

async function updateFriendships(requesterId: string,
	receiverId: string,
	status: IFriendshipStatus,
	chatRef: any) {

	const requester = await User.findOne({ id: String(requesterId) }).exec();
	const receiver = await User.findOne({ id: String(receiverId) }).exec();

	logger.info(`Updating requester's friendships`);
	await User.updateOne({ id: requesterId }, {
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
	await User.updateOne({ id: receiverId }, {
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

function createFriendshipChat(user_id1: string, user_id2: string): any {
	logger.info(`Creating friendship chat`);
	const timestamp = Date.now();
	return Chat.create({
		id: uuidv4(),
		display_name: "Friendship chat",
		participants: [{
			id: user_id1,
			timestamp: timestamp,
			role: "owner"
		}, {
			id: user_id2,
			timestamp: timestamp,
			role: "owner"
		}],
		messages: [],
	});
}

export async function friendshipRequest(req: any, res: any) {
	try {
		if (req.query.action == 'request') {
			logger.info(`Making friendship request by user id=${req.params.id} to id=${req.query.id}`);
			await updateFriendships(req.params.id, req.query.id, IFriendshipStatus.PENDING, null);
		} else if (req.query.action == 'accept') {
			logger.info(`Accepting friendship request by user id=${req.query.id} to id=${req.params.id}`);
			const chat = await createFriendshipChat(req.params.id, req.query.id);
			await updateFriendships(
				req.params.id,
				req.query.id,
				IFriendshipStatus.ACCEPTED,
				{ id: chat.id });
		} else if (req.query.action == 'reject') {
			logger.info(`Rejecting friendship request by user id=${req.query.id} to id=${req.params.id}`);
			await updateFriendships(req.params.id, req.query.id, IFriendshipStatus.REJECTED, null);
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

export async function getGroups(req: any, res: any) {
	logger.info(`Getting groups of user id=${req.params.id}`);
	try {
		logger.info(`Getting user id=${req.params.id}`);
		const user = await User.findOne({ id: String(req.params.id) })
			.exec();
		const groupChatIds = user?.groups.map(group => group.chat.id);
		const groupsChats = await Chat.find({ id: { $in: groupChatIds } })
			.exec();
		res.json(groupsChats);
	} catch (error: any) {
		console.log(error);
		res.status(500)
			.json({ error: error.message });
	}
}

function createGroupChat(creatorUserId: string, groupName: string): any {
	logger.info(`Creating friendship chat`);
	const timestamp = Date.now();
	return Chat.create({
		id: uuidv4(),
		display_name: groupName,
		participants: [{
			id: creatorUserId,
			timestamp: timestamp,
			role: "owner"
		}],
		messages: [],
	});
}

async function createGroup(creatorUserId: string, groupName: string, res: any) {
	logger.info(`Creating group ${groupName} for user id=${creatorUserId}`);

	// create group chat
	const groupChat = await createGroupChat(creatorUserId, groupName);

	// update creator's groups
	await User.updateOne(
		{ "id": creatorUserId },
		{
			"$push": {
				groups: {
					'id': uuidv4(),
					'status': IGroupMembershipStatus.PENDING,
					'chat': {
						id: groupChat.id
					},
				}
			},
		});

	res.json([]);
}


async function inviteUsers(userId: string, groupId: string, userIds: Array<string>, res: any) {
	logger.info(`Inviting users ${userIds} to a group ${groupId} by user id=${userId}`);

	const user = await User.findOne({ id: userId })
		.exec();

	const invitedUsers = await User.find({ id: { $in: userIds } })
		.exec();

	const groupRef = user?.groups
		.find(groupRef => groupRef.id = groupId);

	// TODO: check users exist

	for (var invitedUser of invitedUsers) {
		logger.info(`Inviting user userId=${invitedUser.id}` +
			` to a group groupId=${groupId}` +
			` with chat chatId=${groupRef?.chat?.id}` +
			` by user userId=${userId}`);
		await User.updateOne(
			{ "id": invitedUser.id, 'groups': { $not: { $elemMatch: { 'id': groupId } } } },
			{
				"$push": {
					groups: {
						'id': groupId,
						'status': IGroupMembershipStatus.PENDING,
						'chat': {
							id: String(groupRef?.chat?.id)
						},
					}
				},
			});
	}

	res.json([]);
}


async function kickUsers(userId: string, groupId: string, userIds: Array<string>, res: any) {
	logger.info(`User id=${userId} kicking users ids=${userIds} from group groupId=${groupId}`);

	// get chat id
	const user = await User.findOne({ id: userId })
		.exec();
	const groupRef = user?.groups
		.find(groupRef => groupRef.id == groupId)

	// modify user
	await User.updateOne(
		{
			"id": { $in: userIds },
			'groups': { $elemMatch: { 'id': groupId } }
		}, {
		"$set": {
			"status": IGroupMembershipStatus.KICKED,
		}
	});

	// modify chat
	await Chat.updateOne(
		{
			id: groupRef?.chat.id
		}, {
		$pull: {
			participants: { id: { $in: userIds } }
		}
	});

	res.json([]);
}


async function destroyGroup(userId: string, groupId: string, res: any) {
	logger.info(`User id=${userId} destroying group groupId=${groupId}`);

	// get chat id
	const user = await User.findOne({ id: userId })
		.exec();
	const groupRef = user?.groups
		.find(groupRef => groupRef.id == groupId)

	// get chat participants
	const chat = await Chat.findOne({ id: groupRef?.chat.id })
		.exec();
	const groupUserIds = chat?.participants
		.map(participant => participant.id);

	// remove chat group from user groups
	await User.updateOne(
		{
			"id": { $in: groupUserIds },
			'groups': { $elemMatch: { 'id': groupId } }
		}, {
		"$set": {
			"status": IGroupMembershipStatus.DESTROYED,
		}
	});

	await Chat.updateOne(
		{
			id: groupRef?.chat.id
		}, {
		"$set": {
			participants: []
		}
	});

	res.json([]);
}


async function acceptInvitation(userId: string, groupId: string, res: any) {
	logger.info(`User id=${userId} accepts invitation to group groupId=${groupId}`);

	// get chat id
	const user = await User.findOne({ id: userId })
		.exec();
	const groupRef = user?.groups
		.find(groupRef => groupRef.id == groupId)

	// modify user
	await User.updateOne(
		{
			"id": userId,
			'groups': { $elemMatch: { 'id': groupId } }
		}, {
		"$set": {
			"status": IGroupMembershipStatus.ACCEPTED,
		}
	});

	// modify chat
	await Chat.updateOne(
		{
			id: groupRef?.chat.id
		}, {
		"$push": {
			participants: {
				id: userId,
				timestamp: Date.now(),
				role: "user"
			}
		}
	});

	res.json([]);
}


async function rejectInvitation(userId: string, groupId: string, res: any) {
	logger.info(`User id=${userId} rejects invitation to group groupId=${groupId}`);

	// modify user
	await User.updateOne(
		{
			"id": userId,
			'groups': { $elemMatch: { 'id': groupId } }
		}, {
		"$set": {
			"status": IGroupMembershipStatus.REJECTED,
		}
	});

	res.json([]);
}


export async function groupRequest(req: any, res: any) {
	logger.info(`Modifying groups of user id=${req.params.id}`);
	try {
		if (req.query.action == 'create') {
			await createGroup(req.params.id, req.query.name, res);
		} else if (req.query.action == 'invite') {
			await inviteUsers(req.params.id, req.query.groupId, [req.query.userId], res);
		} else if (req.query.action == 'kick') {
			await kickUsers(req.params.id, req.query.groupId, [req.query.userId], res);
		} else if (req.query.action == 'destroy') {
			await destroyGroup(req.params.id, req.query.groupId, res);
		} else if (req.query.action == 'accept') {
			await acceptInvitation(req.params.id, req.query.groupId, res);
		} else if (req.query.action == 'reject') {
			await rejectInvitation(req.params.id, req.query.groupId, res);
		}
	} catch (error: any) {
		console.log(error);
		res.status(500)
			.json({ error: error.message });
	}
}


export async function getChat(req: any, res: any) {
	logger.info(`Getting chat chatId=${req.params.chatId} of user id=${req.params.id}`);
	try {
		const user = await User.findOne({ id: req.params.id })
			.exec();
		const chat = await Chat.findOne({ id: req.params.chatId })
			.exec();

		const isFriendChat = user?.friendships
			.map(friendship => friendship.chat.id)
			.includes(req.params.chatId);
		const isGroupChat = user?.groups
			.map(groupRef => groupRef.chat.id)
			.includes(req.params.chatId);

		// TODO: update message delivery

		if (!isFriendChat && !isGroupChat) {
			res.json([]); // TODO: error messages
		} else {
			res.json(chat);
		}
	} catch (error: any) {
		console.log(error);
		res.status(500)
			.json({ error: error.message });
	}
}


export async function sendMessage(req: any, res: any) {
	logger.info(`Sending message as user id=${req.params.id} to chat chatId=${req.query.chatId}`);
	try {

		// TODO: check permissions

		await Chat.updateOne(
			{
				"id": req.query.chatId,
			}, {
			"$push": {
				"messages": {
					'id': uuidv4(),
					'author': req.params.id,
					'timestamp': Date.now(),
					'text': req.query.message,
					'delivered': []
				}
			}
		});

		res.json([]);
	} catch (error: any) {
		console.log(error);
		res.status(500)
			.json({ error: error.message });
	}
}
