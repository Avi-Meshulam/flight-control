import { Schema } from 'mongoose';

export const rangeSchema = new Schema({
	min: Number,
	max: Number
}, { _id: false });
