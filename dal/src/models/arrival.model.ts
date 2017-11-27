import { model, Schema } from 'mongoose';
import { flightSchema } from './flight.model';

const arrivalSchema = new Schema(flightSchema.obj);

arrivalSchema.path('flightCode').unique(true);
arrivalSchema.add({comingFrom: { type: String, required: true }});

export const ArrivalModel = model('arrival', arrivalSchema);

