
export interface IParticipant {
	id: string;
	timestamp: number;
	role: string;
};

export interface IMessageDelivery {
	id: string;
	timestamp: number;
};

export interface IMessage {
	id: string;
	author: string;
	timestamp: number;
	text: string;
	delivered: Array<IMessageDelivery>;
};

export interface IChat {
	id: string;
	display_name: string;
	participants: Array<IParticipant>;
	messages: Array<IMessage>;
};
