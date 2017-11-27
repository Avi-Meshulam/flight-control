import { model, Schema } from 'mongoose';
import * as utils from '../utils';
import { flightSchema } from './flight.model';

enum LegType {
	Enter = 'Enter',
	PreLanding = 'Pre-Landing',
	Landing = 'Landing',
	Runaway = 'Runaway',
	Arrivals = 'Arrivals',
	Terminal = 'Terminal',
	Departures = 'Departures',
	Exit = 'Exit'
}

enum LegState {
	Unoccupied = 'Unoccupied',
	MoveDirectionSent = 'Move Direction Sent',
	MoveConfirmed = 'Move Confirmed',
	MarkedForSave = 'Marked For Save',
	Saved = 'Saved',
	Occupied = 'Occupied'
}

const legType = Object.keys(LegType);
const legState = Object.keys(LegState);

const legFlightSchema = new Schema(flightSchema.obj, { discriminatorKey: 'direction', _id: false });
legFlightSchema.add({ legId: { type: Number, default: null } });

// Leg schema
export const legSchema = new Schema({
	_id: Number,
	type: { type: String, enum: legType, required: true },
	state: { type: String, enum: legState, default: LegState.Unoccupied },
	isClosed: { type: Boolean, default: false },
	flight: { type: legFlightSchema }
}, { _id: false });

legSchema.path('flight').unique(true);

(<any>legSchema.path('flight')).discriminator('Arriving', new Schema({
	comingFrom: { type: String, required: true }
}, { _id: false }));

(<any>legSchema.path('flight')).discriminator('Departing', new Schema({
	departingTo: { type: String, required: true }
}, { _id: false }));

// Leg Model
export const LegModel = model('leg', legSchema);

legSchema.statics.assignDiscriminators = function (...docs: object[]): void {
	utils.getInnerArray(docs).forEach(leg => utils.assignFlightDiscriminator(leg.flight));
};
