
export interface IHit {
	x: number;
	y: number;
	points: number;
	note: string;
};

export interface ISet {
	no: number,
	hits: Array<IHit>;
};

export interface ITraining {
	id: string;
	timestamp: number;
	training_type: string;
	title: string;
	target_type: string;
	distance: string;
	sets_configuration: string;
	collect_arrow_numbers: boolean;
	collect_notes: boolean;
	score: number;
	sets: Array<ISet>;
};
