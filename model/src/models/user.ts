
import { ITraining } from './training';

export enum IFriendshipStatus {
	PENDING = "PENDING",
	ACCEPTED = "ACCEPTED",
	REJECTED = "REJECTED",
	CANCELED = "CANCELED"
}

export interface IFriendship {
	id: string;
	status: IFriendshipStatus;
	outgoing: boolean;
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
	friendships: Array<IFriendship>;
	chats: Array<IChatRef>;
	groups: Array<IGroupRef>;
};

export interface IUserAuth {
	id: string;
	username: string;
	password: string;
};