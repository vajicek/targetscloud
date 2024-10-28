const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const { ArgumentParser } = require('argparse');

const userModel = new mongoose.Schema({
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
	//  MongoDB Connection
	mongoose.connect(args.mongodb)
		.then(() => console.log("Connected to MongoDB"))
		.catch(err => console.error("MongoDB connection error:", err));

	// MongoDB Models
	const usersModel = mongoose.model('users', userModel);

	return {"users": usersModel}
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

	// Setup express
	app.use(cors());
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