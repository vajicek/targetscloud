const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const { ArgumentParser } = require('argparse');
const crypto = require('crypto');
const path = require('path');
const https = require('https');
const fs = require('fs');
const pino = require('pino');
const { OAuth2Client } = require('google-auth-library');


const logger = pino({
	level: process.env.PINO_LOG_LEVEL || 'info',
	timestamp: pino.stdTimeFunctions.isoTime,
	formatters: {
		level(label) {
			return { level: label };
		}
	}
});


const userSchema = new mongoose.Schema({
	name: String,
	id: String,
	trainings: [{
		id: String,
		timestamp: Number,
		training_type: String,
		title: String,
		score: Number,
		sets: [{
			no: Number,
			hits: [{
				angle: Number,
				dist: Number,
				note: String
			}]
		}]
	}],
	friends: [{
		id: String
	}],
	chats: [{
		id: String,
		with: String,
	}],
	groups: [{
		id: String
	}]
});


const userAuthSchema = new mongoose.Schema({
	id: String,
	username: String,
	password: String
});


async function getAllUsers(req, res, usersModel) {
	try {
		logger.info("Getting all users");
		const data = await usersModel.find();
		res.json(data);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}


async function getUser(req, res, usersModel) {
	try {
		logger.info(`Getting user id=${req.params.id}`);
		const data = await usersModel.find({ id: String(req.params.id) })
			.exec();
		res.json(data);
	} catch (error) {
		res.status(500)
			.json({ error: error.message });
	}
}


async function updateUser(req, res, usersModel) {
	try {
		logger.info(`Updating user id=${req.params.id}`);
		const retVal = await usersModel.updateOne(
			{ id: String(req.params.id) },
			req.body);
		res.json(retVal);
	} catch (error) {
		logger.error(error);
		res.status(500)
			.json({ error: error.message });
	}
};


function connectToMongo(args) {
	// MongoDB Connection
	mongoose.connect(args.mongodb)
		.then(() => logger.info("Connected to MongoDB"))
		.catch(err => logger.error("MongoDB connection error:", err));

	// MongoDB Models
	const usersModel = mongoose.model('users', userSchema);
	const userAuthsModel = mongoose.model('user_auths', userAuthSchema);

	return {
		"users": usersModel,
		"userAuths": userAuthsModel
	}
}


function loginResponse(user, res, secret) {
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


async function login(req, res, usersModel, userAuthsModel, secret) {
	logger.info("Logging in");

	const { username, password } = req.body;

	logger.info(`Fetching user (username=${username}) authentication details`);
	const userAuth = await userAuthsModel.find({ username: username })
		.exec();

	logger.info("Validating credentials");
	if (userAuth.length === 0 ||
		!(await bcrypt.compare(password, userAuth[0].password))) {
		msg = 'Access denied. Invalid username or password!';
		logger.error(msg);
		return res.status(401)
			.send(msg);
	}

	const user = await usersModel.findOne({ name: username })
		.exec();

	loginResponse(user, res, secret);
}


async function createIfNeeded(username, usersModel) {
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
		"trainings": [],
		"friends": [],
		"chats": [],
		"groups": []
	}).then((doc) => {
		logger.debug(`Record inserted: ${doc}`);
		return doc;
	}).catch((err) => {
		logger.error(`Error inserting record: ${err}`);
	});
}


async function loginWithGoogle(googleClient, googleClientId, req, res, usersModel, secret) {
	logger.info("Logging in with Google token");

	logger.info("Validating token");
	const googleToken = req.body.token;
	const ticket = await googleClient.verifyIdToken({
		idToken: googleToken,
		audience: googleClientId,
	});
	const payload = ticket.getPayload();
	const username = payload.sub;

	const user = await createIfNeeded(username, usersModel);

	loginResponse(user, res, secret);
}


function authenticationInterceptor(req, res, next, secret, exceptions) {
	const authHeader = req.headers.authorization;
	const token = authHeader && authHeader.split(' ')[1];

	if (exceptions.includes(req.path)) {
		logger.debug(`Authentication skipped, path=${req.path}`);
		next();
		return;
	}

	if (!token) {
		msg = "Access denied. No token provided.";
		logger.error(msg);
		return res.status(401)
			.json({ message: msg });
	}

	try {
		const decoded = jwt.verify(token, secret);
		req.user = decoded;
		next();
	} catch (error) {
		msg = "Access denied. Invalid token."
		logger.error(msg);
		res.status(403)
			.json({ message: msg });
	}
}


function serveApi(args, models) {
	// Setup google authentication client
	const googleClient = new OAuth2Client(args.googleclientid);

	// Setup router for /api
	const router = express.Router();
	router.get('/users', (req, res) =>
		getAllUsers(req, res, models["users"]));
	router.get('/users/:id', (req, res) =>
		getUser(req, res, models["users"]));
	router.put('/users/:id', (req, res) =>
		updateUser(req, res, models["users"]));
	router.post('/login', (req, res) =>
		login(req, res, models["users"], models["userAuths"], args.secret));
	router.post('/loginWithGoogle', (req, res) =>
		loginWithGoogle(googleClient, args.googleclientid, req, res, models["users"], args.secret));

	// Setup express
	const app = express();
	app.use(cors());

	app.use('/api', (req, res, next) =>
		authenticationInterceptor(req, res, next, args.secret, ["/login", "/loginWithGoogle"]));
	app.use(bodyParser.json());
	app.use('/api', router);

	// Setup hosting of Angular App
	app.use(express.static(path.join(__dirname, 'browser')));
	app.get('*', (req, res) => {
		res.sendFile(path.join(__dirname, 'browser', 'index.html'));
	});

	// SSL Cert
	const options = {
		key: fs.readFileSync(args.privatekey),
		cert: fs.readFileSync(args.cert)
	};

	// Start server
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


function getArgs() {
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
	args = getArgs();

	if (args.verbose) {
		logger.level = 'debug';
	}

	models = connectToMongo(args)
	serveApi(args, models);
}


main();