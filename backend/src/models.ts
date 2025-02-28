import mongoose from 'mongoose';
import { logger } from './logging';
import { UserSchema, UserAuthSchema, ChatSchema } from './schemas';
import { IUser, IUserAuth, IChat } from 'model/types';


export async function connectToMongo(mongodb: string): Promise<void> {
	// MongoDB Connection
	return mongoose.connect(mongodb)
		.then(() => logger.info("Connected to MongoDB"))
		.catch(err => logger.error("MongoDB connection error:", err));
}

export async function disconnectFromMongo(): Promise<any> {
	return mongoose.disconnect();
}

export const User: mongoose.Model<IUser> = mongoose.model("users", UserSchema);
export const UserAuth: mongoose.Model<IUserAuth> = mongoose.model("user_auths", UserAuthSchema);
export const Chat: mongoose.Model<IChat> = mongoose.model("chats", ChatSchema);
