"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const flight_model_1 = require("./flight.model");
const departureSchema = new mongoose_1.Schema(flight_model_1.flightSchema.obj);
departureSchema.path('flightCode').unique(true);
departureSchema.add({ departingTo: { type: String, required: true } });
exports.DeparturetModel = mongoose_1.model('departure', departureSchema);
//# sourceMappingURL=departure.model.js.map