import { model, Schema } from 'mongoose';
import { flightSchema } from './flight.model';

const simulatorDepartureSchema = new Schema(flightSchema.obj);

simulatorDepartureSchema.path('flightCode').unique(true);
simulatorDepartureSchema.add({departingTo: { type: String, required: true }});

export const SimulatorDepartureModel = model('simulatorDeparture', simulatorDepartureSchema, 'simulatorDepartures');
