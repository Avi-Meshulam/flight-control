import { model, Schema } from 'mongoose';
import { flightSchema } from './flight.model';

const departureSchema = new Schema(flightSchema.obj);

departureSchema.path('flightCode').unique(true);
departureSchema.add({departingTo: { type: String, required: true }});

export const DeparturetModel = model('departure', departureSchema);
