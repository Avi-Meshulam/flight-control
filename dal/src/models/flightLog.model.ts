import { model, Schema } from 'mongoose';
import * as utils from '../utils';
import { flightSchema } from './flight.model';

const flightLogSchema = new Schema(flightSchema.obj, { discriminatorKey: 'direction' });
flightLogSchema.add({legId: { type: Number, default: null }});

// Flight Log Model
const FlightLogModel = model('flightLog', flightLogSchema, 'flightLog');

// Arriving Flight Log Model
const ArrivingFlightLogModel = FlightLogModel.discriminator('Arriving', new Schema({
	comingFrom: { type: String, required: true }
}, { _id: false }));

// Departing Flight Log Model
const DepartingFlightLogModel = FlightLogModel.discriminator('Departing', new Schema({
	departingTo: { type: String, required: true }
}, { _id: false }));

flightLogSchema.statics.assignDiscriminators = function (...docs: object[]): void {
	utils.getInnerArray(docs).forEach(flight => utils.assignFlightDiscriminator(flight));
};

export { flightLogSchema, FlightLogModel };