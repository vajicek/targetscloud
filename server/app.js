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
		console.log("Getting all users");
		const data = await usersModel.find();
		res.json(data);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}


async function getUser(req, res, usersModel) {
	try {
		console.log(`Getting user id=${req.params.id}`);
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
		console.log(`Updating user id=${req.params.id}`);
		const retVal = await usersModel.updateOne(
			{ id: String(req.params.id) },
			req.body);
		res.json(retVal);
	} catch (error) {
		console.log(error);
		res.status(500)
			.json({ error: error.message });
	}
};


function connectToMongo(args) {
	// MongoDB Connection
	mongoose.connect(args.mongodb)
		.then(() => console.log("Connected to MongoDB"))
		.catch(err => console.error("MongoDB connection error:", err));

	// MongoDB Models
	const usersModel = mongoose.model('users', userSchema);
	const userAuthsModel = mongoose.model('user_auths', userAuthSchema);

	return {
		"users": usersModel,
		"userAuths": userAuthsModel
	}
}


async function login(req, res, userAuthsModel, secret) {
	console.info("Logging in");

	const { username, password } = req.body;

	console.info(`Fetching user (username=${username}) authentication details`);
	const userAuth = await userAuthsModel.find({ username: username })
		.exec();

	console.info("Validating credentials");
	if (userAuth.length === 0 ||
		!(await bcrypt.compare(password, userAuth[0].password))) {
		msg = 'Access denied. Invalid username or password!';
		console.error(msg);
		return res.status(401)
			.send(msg);
	}

	console.info("Login successful");
	const token = jwt.sign({ username }, secret, { expiresIn: '1h' });
	res.json({ token });
}


function authenticationInterceptor(req, res, next, secret, exceptions) {
	const authHeader = req.headers.authorization;
	const token = authHeader && authHeader.split(' ')[1];

	if (exceptions.includes(req.path)) {
		next();
		return;
	}

	if (!token) {
		msg = "Access denied. No token provided.";
		console.error(msg);
		return res.status(401)
			.json({ message: msg });
	}

	try {
		const decoded = jwt.verify(token, secret);
		req.user = decoded;
		next();
	} catch (error) {
		msg = "Access denied. Invalid token."
		console.error(msg);
		res.status(403)
			.json({ message: msg });
	}
}


function serveApi(args, models) {
	// Setup router for /api
	const router = express.Router();
	router.get('/users', (req, res) =>
		getAllUsers(req, res, models["users"]));
	router.get('/users/:id', (req, res) =>
		getUser(req, res, models["users"]));
	router.put('/users/:id', (req, res) =>
		updateUser(req, res, models["users"]));
	router.post('/login', (req, res) =>
		login(req, res, models["userAuths"], args.secret));

	// Setup express
	const app = express();
	app.use(cors());

	app.use('/api', (req, res, next) =>
		authenticationInterceptor(req, res, next, args.secret, ["/login"]));
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
			console.log(`TargetsCloud backend listening on port ${args.port}!`)
		});

	// Handling shutdown
	process.on('SIGINT', () => {
		console.log('\nGracefully shutting down...');
		server.close(() => {
			console.log('Server closed');
			process.exit(0);
		});
		// Force exit if close takes too long
		setTimeout(() => {
			console.error('Forced shutdown');
			process.exit(1);
		}, 5000);
	});
}


function getArgs() {
	const parser = new ArgumentParser({
		description: 'TargetsCloud backend'
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
	parser.add_argument('-m', '--mongodb', {
		help: 'MongoDB connection string',
		default: 'mongodb://mongoadmin:secret@localhost:27017/master?authSource=admin'
	});
	return parser.parse_args();
}


function main() {
	args = getArgs();

	models = connectToMongo(args)
	serveApi(args, models);
}


main();