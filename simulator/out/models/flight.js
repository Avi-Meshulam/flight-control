"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IFlight_1 = require("./IFlight");
class Flight {
    constructor(airline, flightCode, status = IFlight_1.FlightStatus.OnTime, isEmergency = false) {
        this.airline = airline;
        this.flightCode = flightCode;
        this.status = status;
        this.isEmergency = isEmergency;
    }
    static isArrivingFlight(flight) {
        return flight.comingFrom !== undefined;
    }
    static isDepartingFlight(flight) {
        return flight.departingTo !== undefined;
    }
}
exports.Flight = Flight;
class ArrivingFlight extends Flight {
    constructor(airline, flightCode, comingFrom, status = IFlight_1.FlightStatus.OnTime, isEmergency = false) {
        super(airline, flightCode, status, isEmergency);
        this.comingFrom = comingFrom;
    }
    static createNew(obj) {
        return new ArrivingFlight(obj.airline, obj.flightCode, obj.comingFrom, obj.status, obj.isEmergency);
    }
}
exports.ArrivingFlight = ArrivingFlight;
class DepartingFlight extends Flight {
    constructor(airline, flightCode, departingTo, status = IFlight_1.FlightStatus.OnTime, isEmergency = false) {
        super(airline, flightCode, status, isEmergency);
        this.departingTo = departingTo;
    }
    static createNew(obj) {
        return new DepartingFlight(obj.airline, obj.flightCode, obj.departingTo, obj.status, obj.isEmergency);
    }
}
exports.DepartingFlight = DepartingFlight;
//# sourceMappingURL=flight.js.map