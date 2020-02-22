import { Document, Schema, model } from 'mongoose';

export interface Guild extends Document {
	id: string;
	prefix: string;
	manager: string;
	premium: boolean;
	expiresAt: Date;
}

const Guild: Schema = new Schema(
	{
		id: {
			type: String,
			required: true,
		},
		prefix: {
			type: String,
			default: process.env.PREFIX,
		},
		manager: {
			type: String,
			required: false,
		},
		premium: {
			type: Boolean,
			default: false,
		},
		expiresAt: {
			type: Date,
		},
	},
	{
		strict: false,
	},
);

export default model<Guild>('Guild', Guild);
