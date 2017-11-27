import { model, Schema } from 'mongoose';
import * as utils from '../utils';

enum FlightStatus {
	OnTime = 'OnTime',
	Delay = 'Delay',
	Departed = 'Departed',
	Landed = 'Landed'
}

const flightStatus = Object.keys(FlightStatus);

export const flightSchema = new Schema({
	airline: { type: String, required: true },
	flightCode: { type: String, required: true },
	status: { type: String, enum: flightStatus, default: FlightStatus.OnTime },
	isEmergency: { type: Boolean, default: false },
	createdAt: { type: Date, default: new Date },
	updatedAt: { type: Date, default: new Date }
}, { discriminatorKey: 'direction' });

// Flight Model
const FlightModel = model('flight', flightSchema);

// Arriving Flight Model
const ArrivingFlightModel = FlightModel.discriminator('Arriving', new Schema({
	comingFrom: { type: String, required: true }
}, { _id: false }));

// Departing Flight Model
const DepartingFlightModel = FlightModel.discriminator('Departing', new Schema({
	departingTo: { type: String, required: true }
}, { _id: false }));

flightSchema.statics.assignDiscriminators = function (...docs: object[]): void {
	utils.getInnerArray(docs).forEach(flight => utils.assignFlightDiscriminator(flight));
};

export { FlightModel };