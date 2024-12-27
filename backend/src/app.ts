import { ArgumentParser } from 'argparse';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import bodyParser from 'body-parser';
import cors from 'cors';
import crypto from 'crypto';
import express, { Request, Response } from 'express';
import fs from 'fs';
import https from 'https';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import path from 'path';
import pino from 'pino';

import { schemas } from './schemas';


const logger = pino({
	level: process.env.PINO_LOG_LEVEL || 'info',
	timestamp: pino.stdTimeFunctions.isoTime,
	formatters: {
		level(label) {
			return { level: label };
		}
	}
});


async function getAllUsers(req: any, res: any, usersModel: any) {
	try {
		logger.info("Getting all users");
		const data = await usersModel.find();
		res.json(data);
	} catch (error: any) {
		res.status(500).json({ error: error.message });
	}
}


async function getUser(req: any, res: any, usersModel: any) {
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


async function updateUser(req: any, res: any, usersModel: any) {
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


function connectToMongo(args: any): Map<string, any> {
	// MongoDB Connection
	mongoose.connect(args.mongodb)
		.then(() => logger.info("Connected to MongoDB"))
		.catch(err => logger.error("MongoDB connection error:", err));

	// MongoDB Models
	return new Map<string, any>(Array.from(schemas,
		([schemaName, schema]) => [schemaName, mongoose.model(schemaName, schema)]));
}


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


async function login(req: any, res: any, usersModel: any, userAuthsModel: any, secret: string) {
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


async function loginWithGoogle(googleClient: any,
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


function authenticationInterceptor(req: any,
	res: any,
	next: any,
	secret: any,
	exceptions: any): any {

	const authHeader = req.headers.authorization;
	const token = authHeader && authHeader.split(' ')[1];

	if (exceptions.includes(req.path)) {
		logger.debug(`Authentication skipped, path=${req.path}`);
		next();
		return;
	}

	if (!token) {
		const msg: string = "Access denied. No token provided.";
		logger.error(msg);
		return res.status(401)
			.json({ message: msg });
	}

	try {
		const decoded = jwt.verify(token, secret);
		req.user = decoded;
		next();
	} catch (error) {
		const msg: string = "Access denied. Invalid token."
		logger.error(msg);
		res.status(403)
			.json({ message: msg });
	}
}

function getFriends(req: any, res: any, usersModel: any) {
	logger.info(`Getting friends of user id=${req.params.id}`);
}

function getGroups(req: any, res: any, usersModel: any, groupsModel: any) {
	logger.info(`Getting groups of user id=${req.params.id}`);
}

function getChat(req: any, res: any, usersModel: any, groupsModel: any) {
	logger.info(`Getting chat chatId=${req.params.chatId} of user id=${req.params.id}`);
}

function sendMessage(req: any, res: any, usersModel: any, groupsModel: any) {
	logger.info(`Sending message as user id=${req.params.id}`);
}

function serveApi(args: any, models: Map<string, any>) {
	// Setup google authentication client
	logger.info(`Setting up google authentication client, googleclientid=${args.googleclientid}`);
	const googleClient = new OAuth2Client(args.googleclientid);

	// Setup router for /api
	logger.info(`Setting up route for /api`);
	const router = express.Router();
	router.get('/users', (req, res) =>
		getAllUsers(req,
			res,
			models.get("users")));
	router.get('/users/:id', (req, res) =>
		getUser(req,
			res,
			models.get("users")));

	//TODO:
	router.get('/users/:id/friends', (req, res) =>
		getFriends(req,
			res,
			models.get("users")));
	//TODO:
	router.get('/users/:id/groups', (req, res) =>
		getGroups(req,
			res,
			models.get("users"),
			models.get("chats")));
	//TODO:
	router.get('/users/:id/chats/:chatId', (req, res) =>
		getChat(req,
			res,
			models.get("users"),
			models.get("chats")));
	//TODO:
	router.put('/users/:id/sendmessage', (req, res) =>
		sendMessage(req,
			res,
			models.get("users"),
			models.get("chats")));

	router.put('/users/:id', (req, res) =>
		updateUser(req,
			res,
			models.get("users")));
	router.post('/login', (req, res) =>
		login(req,
			res,
			models.get("users"),
			models.get("user_auths"),
			args.secret));
	router.post('/loginWithGoogle', (req, res) =>
		loginWithGoogle(googleClient,
			args.googleclientid,
			req,
			res,
			models.get("users"),
			args.secret));

	// Setup express
	logger.info(`Setting up express`);
	const app = express();
	app.use(cors());

	logger.info(`Setting up /api`);
	app.use('/api', (req, res, next) =>
		authenticationInterceptor(req,
			res,
			next,
			args.secret,
			["/login", "/loginWithGoogle"]));
	app.use(bodyParser.json());
	app.use('/api', router);

	// Logging access
	logger.info(`Setting up access log`);
	app.use((req, res, next) => {
		logger.debug(`${req.method} ${req.url} - ${req.ip}`);
		next();
	});

	// Setup hosting of Angular App
	logger.info(`Setting up static pages routing`);
	app.use(express.static(path.join(__dirname, 'browser')));
	app.get('*', (req, res) => {
		res.sendFile(path.join(__dirname, 'browser', 'index.html'));
	});

	// SSL Cert
	logger.info(`Getting SSL cert and key`);
	const options = {
		key: fs.readFileSync(args.privatekey),
		cert: fs.readFileSync(args.cert)
	};

	// Start server
	logger.info(`Starting server`);
	const server = https.createServer(options, app)
		.listen(args.port, () => {
			logger.info(`TargetsCloud backend listening on port ${args.port}!`)
		});

	// Handling shutdown
	process.on('SIGINT', () => {
		logger.info('Gracefully shutting down...');
		server.close(() => {
			logger.info('Server closed');
			process.exit(0);
		});
		// Force exit if close takes too long
		setTimeout(() => {
			logger.error('Forced shutdown');
			process.exit(1);
		}, 5000);
	});
}


function getArgs(): any {
	const parser = new ArgumentParser({
		description: 'TargetsCloud backend'
	});

	parser.add_argument('-v', '--verbose', {
		action: 'store_true',
		help: 'Enable verbose mode',
	});
	parser.add_argument('-c', '--cert', {
		help: 'SSL Certificate',
		default: 'cert.pem'
	});
	parser.add_argument('-k', '--privatekey', {
		help: 'SSL Private Key',
		default: 'key.pem'
	});
	parser.add_argument('-s', '--secret', {
		help: 'JWT Secret',
		default: crypto.randomBytes(32).toString('hex')
	});
	parser.add_argument('-p', '--port', {
		help: 'API port',
		default: 8000
	});
	parser.add_argument('-g', '--googleclientid', {
		help: 'Google Client ID',
		default: null
	});
	parser.add_argument('-m', '--mongodb', {
		help: 'MongoDB connection string',
		default: 'mongodb://mongoadmin:secret@localhost:27017/master?authSource=admin'
	});
	return parser.parse_args();
}


function main() {
	const args: any = getArgs();

	if (args.verbose) {
		logger.level = 'debug';
	}

	const models: Map<string, any> = connectToMongo(args);
	serveApi(args, models);
}


main();
