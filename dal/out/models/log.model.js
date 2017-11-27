"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const utils = require("../utils");
const flightLog_model_1 = require("./flightLog.model");
const leg_model_1 = require("./leg.model");
// Flight Log Schema
const logFlightLogSchema = new mongoose_1.Schema({
    flight: { type: new mongoose_1.Schema(flightLog_model_1.flightLogSchema.obj, { discriminatorKey: 'direction', _id: false }) }
}, { _id: false });
logFlightLogSchema.path('flight').discriminator('Arriving', new mongoose_1.Schema({
    comingFrom: { type: String, required: true }
}, { _id: false }));
logFlightLogSchema.path('flight').discriminator('Departing', new mongoose_1.Schema({
    departingTo: { type: String, required: true }
}, { _id: false }));
// Log schema
const logSchema = new mongoose_1.Schema({
    createdAt: { type: Date, default: new Date }
}, { discriminatorKey: 'kind' });
// Log Model
const LogModel = mongoose_1.model('log', logSchema, 'log');
exports.LogModel = LogModel;
// Flight Log Model
const LogFlightLogModel = LogModel.discriminator('Flight', new mongoose_1.Schema({
    flight: { type: logFlightLogSchema }
}));
// Leg Log Model
const LogLegModel = LogModel.discriminator('Leg', new mongoose_1.Schema({
    leg: { type: leg_model_1.legSchema }
}));
logSchema.statics.assignDiscriminators = function (...docs) {
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
//# sourceMappingURL=log.model.js.map