import mongoose from 'mongoose';

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

const chatSchema = new mongoose.Schema({
	id: String,
	display_name: String,
	participants: [{
		id: String,
		timestamp: Number,
		role: String
	}],
	messages: [{
		id: String,
		timestamp: Number,
		text: String,
		delivered: [{
			id: String,
			timestamp: Number
		}]
	}]
});

export const schemas: Map<string, mongoose.Schema> = new Map([
	["users", userSchema],
	["user_auths", userAuthSchema],
	["chats", chatSchema],
]);
