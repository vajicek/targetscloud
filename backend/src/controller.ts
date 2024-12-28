import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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


export function getFriends(req: any, res: any, usersModel: any) {
	logger.info(`Getting friends of user id=${req.params.id}`);
}


export function getGroups(req: any, res: any, usersModel: any, groupsModel: any) {
	logger.info(`Getting groups of user id=${req.params.id}`);
}


export function getChat(req: any, res: any, usersModel: any, groupsModel: any) {
	logger.info(`Getting chat chatId=${req.params.chatId} of user id=${req.params.id}`);
}


export function sendMessage(req: any, res: any, usersModel: any, groupsModel: any) {
	logger.info(`Sending message as user id=${req.params.id}`);
}
