"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const flight_model_1 = require("./flight.model");
const simulatorDepartureSchema = new mongoose_1.Schema(flight_model_1.flightSchema.obj);
simulatorDepartureSchema.path('flightCode').unique(true);
simulatorDepartureSchema.add({ departingTo: { type: String, required: true } });
exports.SimulatorDepartureModel = mongoose_1.model('simulatorDeparture', simulatorDepartureSchema, 'simulatorDepartures');
//# sourceMappingURL=simulatorDeparture.model.js.map