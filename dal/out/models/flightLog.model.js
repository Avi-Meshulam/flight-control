"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const flight_model_1 = require("./flight.model");
exports.flightLogSchema = new mongoose_1.Schema(flight_model_1.flightSchema.obj);
exports.flightLogSchema.add({ legId: { type: Number, default: null } });
exports.FlightLogModel = mongoose_1.model('flightLog', exports.flightLogSchema, 'flightLog');
//# sourceMappingURL=flightLog.model.js.map