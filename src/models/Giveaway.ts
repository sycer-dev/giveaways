import { Document, Schema, model } from 'mongoose';

export interface Boosted {
	string: string;
	entries: number;
}

export interface Giveaway extends Document {
	title: string;
	emoji: string;
	guildID: string;
	channelID: string;
	messageID: string;
	winnerCount: number;
	permittedRoles?: string[];
	boosted?: Boosted[];
	fcfs: boolean;
	endsAt: Date;
	createdBy: string;
	maxEntries: number;
	complete: boolean;
}

const Giveaway: Schema = new Schema({
	title: {
		type: String,
		required: true,
	},
	emoji: {
		'type': String,
		'default': '🎉',
	},
	guildID: {
		type: String,
		required: true,
	},
	channelID: {
		type: String,
		required: true,
	},
	messageID: {
		type: String,
		required: true,
	},
	winnerCount: {
		type: Number,
		required: true,
	},
	fcfs: {
		'type': Boolean,
		'default': false,
	},
	endsAt: Date,
	createdBy: {
		type: String,
		required: true,
	},
	maxEntries: Number,
	complete: {
		'type': Boolean,
		'default': false,
	},
	boosted: Array,
}, {
	strict: false,
});

export default model<Giveaway>('Giveaway', Giveaway);
