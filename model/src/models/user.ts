
import { ITraining } from './training';

export interface IFriend {
	id: string;
};

export interface IChatRef {
	id: string;
};

export interface IGroupRef {
	id: string;
};

export interface IUser {
	name: string;
	display_name: string;
	email: string;
	picture: string;
	id: string;
	trainings: Array<ITraining>;
	friends: Array<IFriend>;
	chats: Array<IChatRef>;
	groups: Array<IGroupRef>;
};

export interface IUserAuth {
	id: string;
	username: string;
	password: string;
};