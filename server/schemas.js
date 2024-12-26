const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	name: String,
	display_name: String,
	email: String,
	picture: String,
	id: String,
	trainings: [{
		id: String,
		timestamp: Number,
		training_type: String,
		title: String,
		target_type: String,
		distance: String,
		sets_configuration: String,
		collect_arrow_numbers: Boolean,
		collect_notes: Boolean,
		score: Number,
		sets: [{
			no: Number,
			hits: [{
				x: Number,
				y: Number,
				points: Number,
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

// TODO: groups, chats

schemas = {
	"users": userSchema,
	"user_auths": userAuthSchema
};

module.exports = {
	userSchema,
	userAuthSchema
};
