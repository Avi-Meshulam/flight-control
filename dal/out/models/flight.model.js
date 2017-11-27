"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const utils = require("../utils");
var FlightStatus;
(function (FlightStatus) {
    FlightStatus["OnTime"] = "OnTime";
    FlightStatus["Delay"] = "Delay";
    FlightStatus["Departed"] = "Departed";
    FlightStatus["Landed"] = "Landed";
})(FlightStatus || (FlightStatus = {}));
const flightStatus = Object.keys(FlightStatus);
exports.flightSchema = new mongoose_1.Schema({
    airline: { type: String, required: true },
    flightCode: { type: String, required: true },
    status: { type: String, enum: flightStatus, default: FlightStatus.OnTime },
    isEmergency: { type: Boolean, default: false },
    createdAt: { type: Date, default: new Date },
    updatedAt: { type: Date, default: new Date }
}, { discriminatorKey: 'direction' });
// Flight Model
const FlightModel = mongoose_1.model('flight', exports.flightSchema);
exports.FlightModel = FlightModel;
// Arriving Flight Model
const ArrivingFlightModel = FlightModel.discriminator('Arriving', new mongoose_1.Schema({
    comingFrom: { type: String, required: true }
}, { _id: false }));
// Departing Flight Model
const DepartingFlightModel = FlightModel.discriminator('Departing', new mongoose_1.Schema({
    departingTo: { type: String, required: true }
}, { _id: false }));
exports.flightSchema.statics.assignDiscriminators = function (...docs) {
    utils.getInnerArray(docs).forEach(flight => utils.assignFlightDiscriminator(flight));
};
//# sourceMappingURL=flight.model.js.map