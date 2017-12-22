"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
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
// const FlightModel = model('flight', flightSchema);
// // Arriving Flight Model
// const ArrivingFlightModel = FlightModel.discriminator('Arriving', new Schema({
// 	comingFrom: { type: String, required: true }
// }, { _id: false }));
// // Departing Flight Model
// const DepartingFlightModel = FlightModel.discriminator('Departing', new Schema({
// 	departingTo: { type: String, required: true }
// }, { _id: false }));
// flightSchema.statics.assignDiscriminators = function (...docs: object[]): void {
// 	utils.getInnerArray(docs).forEach(flight => utils.assignFlightDiscriminator(flight));
// };
// export { FlightModel }; 
//# sourceMappingURL=flight.model.js.map