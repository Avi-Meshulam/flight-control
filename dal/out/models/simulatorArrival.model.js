"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const flight_model_1 = require("./flight.model");
const simulatorArrivalSchema = new mongoose_1.Schema(flight_model_1.flightSchema.obj);
simulatorArrivalSchema.path('flightCode').unique(true);
simulatorArrivalSchema.add({ comingFrom: { type: String, required: true } });
exports.SimulatorArrivalModel = mongoose_1.model('simulatorArrival', simulatorArrivalSchema);
//# sourceMappingURL=simulatorArrival.model.js.map