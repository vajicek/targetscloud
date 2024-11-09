const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const { ArgumentParser } = require('argparse');

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


const SECRET_KEY = "2c224df86c6df7f7f6ad5ad233e4ac6f5c5e0ade10bbdab4f6b3a48ff0c84400";


async function login(req, res, userAuthsModel) {
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
	const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
	res.json({ token });
}


function authenticationInterceptor(req, res, next) {
	const authHeader = req.headers.authorization;
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		msg = "Access denied. No token provided.";
		console.error(msg);
		return res.status(401)
			.json({ message: msg });
	}

	try {
		const decoded = jwt.verify(token, SECRET_KEY);
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
	const app = express();
	const router = express.Router();

	// Setup router
	router.get('/api/users', (req, res) =>
		getAllUsers(req, res, models["users"]));
	router.get('/api/users/:id', (req, res) =>
		getUser(req, res, models["users"]));
	router.put('/api/users/:id', (req, res) =>
		updateUser(req, res, models["users"]));
	router.post('/login', (req, res) =>
		login(req, res, models["userAuths"]));

	// Setup express
	app.use(cors());
	app.use('/api', authenticationInterceptor);
	app.use(bodyParser.json());
	app.use('/', router);
	app.listen(args.port, function () {
		console.log(`TargetsCloud backend listening on port ${args.port}!`)
	})
}


function get_args() {
	const parser = new ArgumentParser({
		description: 'TargetsCloud backend'
	});

	parser.add_argument('-p', '--port', {
		help: 'API port',
		default: 8000
	});
	parser.add_argument('-m', '--mongodb', {
		help: 'MongoDB connection string',
		default: 'mongodb://mongoadmin:secret@localhost:27017/local?authSource=admin'
	});
	return parser.parse_args();
}


function main() {
	args = get_args();

	models = connectToMongo(args)
	serveApi(args, models);
}


main();