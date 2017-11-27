import { model, Schema } from 'mongoose';
import { flightSchema } from './flight.model';

export const flightLogSchema = new Schema(flightSchema.obj);

flightLogSchema.add({legId: { type: Number, default: null }});

export const FlightLogModel = model('flightLog', flightLogSchema, 'flightLog');
