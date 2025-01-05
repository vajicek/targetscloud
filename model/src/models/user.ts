
import { ITraining } from './training';

export enum IFriendshipStatus {
	PENDING = "PENDING",
	ACCEPTED = "ACCEPTED",
	REJECTED = "REJECTED",
	CANCELED = "CANCELED"
};

export enum IGroupMembershipStatus {
	PENDING = "PENDING",
	ACCEPTED = "ACCEPTED",
	REJECTED = "REJECTED",
	KICKED = "KICKED",
	DESTROYED = "DESTROYED",
};

export interface IChatRef {
	id: string;
};

export interface IFriendship {
	id: string;
	status: IFriendshipStatus;
	outgoing: boolean;
	chat: IChatRef;
};

export interface IGroupRef {
	id: string;
	status: IGroupMembershipStatus;
	chat: IChatRef;
};

export interface IUser {
	name: string;
	display_name: string;
	email: string;
	picture: string;
	id: string;
	trainings: Array<ITraining>;
	friendships: Array<IFriendship>;
	groups: Array<IGroupRef>;
};

export interface IUserAuth {
	id: string;
	username: string;
	password: string;
};