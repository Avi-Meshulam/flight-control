"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const utils = require("../utils");
const flight_model_1 = require("./flight.model");
var LegType;
(function (LegType) {
    LegType["Enter"] = "Enter";
    LegType["PreLanding"] = "Pre-Landing";
    LegType["Landing"] = "Landing";
    LegType["Runaway"] = "Runaway";
    LegType["Arrivals"] = "Arrivals";
    LegType["Terminal"] = "Terminal";
    LegType["Departures"] = "Departures";
    LegType["Exit"] = "Exit";
})(LegType || (LegType = {}));
var LegState;
(function (LegState) {
    LegState["Unoccupied"] = "Unoccupied";
    LegState["MoveDirectionSent"] = "Move Direction Sent";
    LegState["MoveConfirmed"] = "Move Confirmed";
    LegState["MarkedForSave"] = "Marked For Save";
    LegState["Saved"] = "Saved";
    LegState["Occupied"] = "Occupied";
})(LegState || (LegState = {}));
const legType = Object.keys(LegType);
const legState = Object.keys(LegState);
const legFlightSchema = new mongoose_1.Schema(flight_model_1.flightSchema.obj, { discriminatorKey: 'direction', _id: false });
legFlightSchema.add({ legId: { type: Number, default: null } });
// Leg schema
exports.legSchema = new mongoose_1.Schema({
    _id: Number,
    type: { type: String, enum: legType, required: true },
    state: { type: String, enum: legState, default: LegState.Unoccupied },
    isClosed: { type: Boolean, default: false },
    flight: { type: legFlightSchema }
}, { _id: false });
exports.legSchema.path('flight').unique(true);
exports.legSchema.path('flight').discriminator('Arriving', new mongoose_1.Schema({
    comingFrom: { type: String, required: true }
}, { _id: false }));
exports.legSchema.path('flight').discriminator('Departing', new mongoose_1.Schema({
    departingTo: { type: String, required: true }
}, { _id: false }));
// Leg Model
exports.LegModel = mongoose_1.model('leg', exports.legSchema);
exports.legSchema.statics.assignDiscriminators = function (...docs) {
    utils.getInnerArray(docs).forEach(leg => utils.assignFlightDiscriminator(leg.flight));
};
//# sourceMappingURL=leg.model.js.map