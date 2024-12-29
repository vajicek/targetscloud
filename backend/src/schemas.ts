import mongoose from 'mongoose';

import {
	IUser,
	IUserAuth,
	ITraining,
	ISet,
	IHit,
	IFriendship,
	IFriendshipStatus,
	IChatRef,
	IGroupRef,
	IParticipant,
	IMessageDelivery,
	IMessage,
	IChat
} from 'model/types';

const HitSchema = new mongoose.Schema<IHit>({
	x: { type: Number, required: true },
	y: { type: Number, required: true },
	points: { type: Number, required: true },
	note: { type: String, required: true }
});

const SetSchema = new mongoose.Schema<ISet>({
	no: { type: Number, required: true },
	hits: { type: [HitSchema], required: true }
});

const TrainingSchema = new mongoose.Schema<ITraining>({
	id: { type: String, required: true },
	timestamp: { type: Number, required: true },
	training_type: { type: String, required: true },
	title: { type: String, required: true },
	target_type: { type: String, required: true },
	distance: { type: String, required: true },
	sets_configuration: { type: String, required: true },
	collect_arrow_numbers: { type: Boolean, required: true },
	collect_notes: { type: Boolean, required: true },
	score: { type: Number, required: true },
	sets: { type: [SetSchema], required: true }
});

const FriendshipSchema = new mongoose.Schema<IFriendship>({
	id: { type: String, required: true },
	status: { type: String, enum: Object.values(IFriendshipStatus), required: true },
	outgoing: { type: Boolean, required: true },
});

const ChatRefSchema = new mongoose.Schema<IChatRef>({
	id: { type: String, required: true },
});

const GroupRefSchema = new mongoose.Schema<IGroupRef>({
	id: { type: String, required: true },
});

const UserSchema = new mongoose.Schema<IUser>({
	name: { type: String, required: true },
	display_name: { type: String, required: true },
	email: { type: String, required: true },
	picture: { type: String, required: true },
	id: { type: String, required: true },
	trainings: { type: [TrainingSchema], required: true },
	friendships: { type: [FriendshipSchema], required: true },
	chats: { type: [ChatRefSchema], required: true },
	groups: { type: [GroupRefSchema], required: true }
});

const ParticipantSchema = new mongoose.Schema<IParticipant>({
	id: { type: String, required: true },
	timestamp: { type: Number, required: true },
	role: { type: String, required: true },
});

const MessageDeliverySchema = new mongoose.Schema<IMessageDelivery>({
	id: { type: String, required: true },
	timestamp: { type: Number, required: true },
});

const MessageSchema = new mongoose.Schema<IMessage>({
	id: { type: String, required: true },
	author: { type: String, required: true },
	timestamp: { type: Number, required: true },
	text: { type: String, required: true },
	delivered: { type: [MessageDeliverySchema], required: true },
});

const ChatSchema = new mongoose.Schema<IChat>({
	id: { type: String, required: true },
	display_name: { type: String, required: true },
	participants: { type: [ParticipantSchema], required: true },
	messages: { type: [MessageSchema], required: true },
});

const UserAuthSchema = new mongoose.Schema<IUserAuth>({
	id: { type: String, required: true },
	username: { type: String, required: true },
	password: { type: String, required: true }
});


export const schemas: Map<string, mongoose.Schema> = new Map([
	["users", UserSchema as mongoose.Schema],
	["user_auths", UserAuthSchema as mongoose.Schema],
	["chats", ChatSchema as mongoose.Schema]
]);
