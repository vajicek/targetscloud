const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const router = express.Router();

const port = 8000;
const monogoDbUrl = 'mongodb://mongoadmin:secret@localhost:27017/local?authSource=admin'

//  MongoDB Connection
mongoose.connect(monogoDbUrl)
	.then(() => console.log("Connected to MongoDB"))
	.catch(err => console.error("MongoDB connection error:", err));

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

// MongoDB Model
const usersModel = mongoose.model('users', userModel);

// Route to Data API
router.get('/api/users', async (req, res) => {
	try {
		const data = await usersModel.find();
		res.json(data);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.use(cors());
app.use('/', router);

app.listen(port, function () {
	console.log(`TargetsCloud backend listening on port ${port}!`)
})

//TODO: Commandline interface, port, url mongodb string