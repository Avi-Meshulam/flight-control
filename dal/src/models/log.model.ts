import { model, Schema } from 'mongoose';
import * as utils from '../utils';
import { flightLogSchema } from './flightLog.model';
import { legSchema } from './leg.model';

// Flight Log Schema
const logFlightLogSchema = new Schema({
	flight: { type: new Schema(flightLogSchema.obj, { discriminatorKey: 'direction', _id: false }) }
}, { _id: false });

(<any>logFlightLogSchema.path('flight')).discriminator('Arriving', new Schema({
	comingFrom: { type: String, required: true }
}, { _id: false }));

(<any>logFlightLogSchema.path('flight')).discriminator('Departing', new Schema({
	departingTo: { type: String, required: true }
}, { _id: false }));

// Log schema
const logSchema = new Schema({
	createdAt: { type: Date, default: new Date }
}, { discriminatorKey: 'kind' });

// Log Model
const LogModel = model('log', logSchema, 'log');

// Flight Log Model
const LogFlightLogModel = LogModel.discriminator('Flight', new Schema({
	flight: { type: logFlightLogSchema }
}));

// Leg Log Model
const LogLegModel = LogModel.discriminator('Leg', new Schema({
	leg: { type: legSchema }
}));

logSchema.statics.assignDiscriminators = function (...docs: object[]): void {
	utils.getInnerArray(docs).forEach(doc => {
		if (doc.hasOwnProperty('flight')) {
			utils.assignFlightDiscriminator(doc.flight);
			doc = { leg: doc, kind: 'Leg' };
		}
		else {
			utils.assignFlightDiscriminator(doc);
			doc = { flight: { flight: doc }, kind: 'Flight' };
		}
	});
};

export { LogModel };