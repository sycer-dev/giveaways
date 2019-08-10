import { Document, Schema, model } from 'mongoose';

export interface Child extends Document {
	id: string;
	token: string;
	color: number;
}

const Child: Schema = new Schema({
	id: {
		type: String,
		required: true,
	},
	token: {
		type: String,
		required: true,
	},
	color: {
		'type': Number,
		'default': process.env.COLOR,
	},
}, {
	strict: false,
});

export default model<Child>('Child', Child);
