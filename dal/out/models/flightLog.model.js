"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const utils = require("../utils");
const flight_model_1 = require("./flight.model");
const flightLogSchema = new mongoose_1.Schema(flight_model_1.flightSchema.obj, { discriminatorKey: 'direction' });
exports.flightLogSchema = flightLogSchema;
flightLogSchema.add({ legId: { type: Number, default: null } });
// Flight Log Model
const FlightLogModel = mongoose_1.model('flightLog', flightLogSchema, 'flightLog');
exports.FlightLogModel = FlightLogModel;
// Arriving Flight Log Model
const ArrivingFlightLogModel = FlightLogModel.discriminator('Arriving', new mongoose_1.Schema({
    comingFrom: { type: String, required: true }
}, { _id: false }));
// Departing Flight Log Model
const DepartingFlightLogModel = FlightLogModel.discriminator('Departing', new mongoose_1.Schema({
    departingTo: { type: String, required: true }
}, { _id: false }));
flightLogSchema.statics.assignDiscriminators = function (...docs) {
    utils.getInnerArray(docs).forEach(flight => utils.assignFlightDiscriminator(flight));
};
//# sourceMappingURL=flightLog.model.js.map