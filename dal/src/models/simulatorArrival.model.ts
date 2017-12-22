import { model, Schema } from 'mongoose';
import { flightSchema } from './flight.model';

const simulatorArrivalSchema = new Schema(flightSchema.obj);

simulatorArrivalSchema.path('flightCode').unique(true);
simulatorArrivalSchema.add({comingFrom: { type: String, required: true }});

export const SimulatorArrivalModel = model('simulatorArrival', simulatorArrivalSchema);

