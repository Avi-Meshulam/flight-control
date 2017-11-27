"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const flight_model_1 = require("./flight.model");
const arrivalSchema = new mongoose_1.Schema(flight_model_1.flightSchema.obj);
arrivalSchema.path('flightCode').unique(true);
arrivalSchema.add({ comingFrom: { type: String, required: true } });
exports.ArrivalModel = mongoose_1.model('arrival', arrivalSchema);
//# sourceMappingURL=arrival.model.js.map