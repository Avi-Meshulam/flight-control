"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Observable_1 = require("rxjs/Observable");
const constants_1 = require("./constants");
// import * as data from './data/flights';
const flights_1 = require("./data/flights");
const flight_1 = require("./models/flight");
const transmission_1 = require("./models/transmission");
const data_service_1 = require("./services/data.service");
const utils_1 = require("./utils");
const DEFAULT_MIN_INTERVAL = 10;
const DEFAULT_MAX_INTERVAL = 1000;
// const arrivals = data.arrivals;
// const departures = data.departures;
class Simulator {
    constructor() {
        this._arrivals = new Map();
        this._departures = new Map();
        this._intervalRange = { min: DEFAULT_MIN_INTERVAL, max: DEFAULT_MAX_INTERVAL };
    }
    get intervalRange() {
        return this._intervalRange;
    }
    set intervalRange(value) {
        if (this._intervalRange !== value) {
            this._intervalRange.min = value.min;
            this._intervalRange.max = value.max;
        }
    }
    //#endregion properties
    getTransmissions() {
        return Observable_1.Observable.create(observer => {
            this.getObservable(data_service_1.DBCollection.Arrivals).subscribe(flight => observer.next(this.createTransmission(flight_1.ArrivingFlight.createNew(flight), 'Asking permission to enter airport')), err => console.log(err), () => observer.complete());
            this.getObservable(data_service_1.DBCollection.Departures).subscribe(flight => observer.next(this.createTransmission(flight_1.DepartingFlight.createNew(flight), 'Ready to depart')), err => console.log(err), () => observer.complete());
        });
    }
    deleteTransmission(flight) {
        if (this._arrivals.has(flight.flightCode))
            data_service_1.DataService.delete(data_service_1.DBCollection.Arrivals, { flightCode: flight.flightCode })
                .then(() => {
                this._arrivals.delete(flight.flightCode);
                // console.error(`flight ${flight.flightCode} deleted. arrivals size: ${this._arrivals.size}.`);
            })
                .catch(err => console.error(err));
        else
            // if (this._departures.has(flight.flightCode))
            data_service_1.DataService.delete(data_service_1.DBCollection.Departures, { flightCode: flight.flightCode })
                .then(() => {
                this._departures.delete(flight.flightCode);
                // console.error(`flight ${flight.flightCode} deleted. departures size: ${this._departures.size}.`);
            })
                .catch(err => console.error(err));
    }
    applySettings(obj) {
        if (!obj)
            return;
        this._intervalRange.min = obj.intervalRange.min;
        this._intervalRange.max = obj.intervalRange.max;
    }
    getObservable(collection) {
        return Observable_1.Observable.create((observer) => __awaiter(this, void 0, void 0, function* () {
            yield this.initData(collection);
            let iterate = () => __awaiter(this, void 0, void 0, function* () {
                let map = collection === data_service_1.DBCollection.Arrivals ? this._arrivals : this._departures;
                for (let [key, value] of map) {
                    observer.next(value);
                    yield utils_1.default.delay(utils_1.default.getRandomInt(this._intervalRange.min, this._intervalRange.max));
                }
                // continue iterating as long as map contains entries
                if (map.size > 0) {
                    iterate();
                }
                else {
                    console.log(`Starting over ${collection}...\n`);
                    yield this.initData(collection, true);
                    iterate();
                }
                /* else {
                    observer.complete();
                } */
            });
            iterate();
        }));
    }
    // Inits this._arrivals OR this._departures from DB (upon startup) or from memory storage (and update DB)
    initData(collection, isRestart = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let setData = (DBData, isDBError = false) => __awaiter(this, void 0, void 0, function* () {
                let localData = collection === data_service_1.DBCollection.Arrivals ? flights_1.arrivals : flights_1.departures;
                if (DBData.length === 0 && !isDBError)
                    yield data_service_1.DataService.create(collection, localData)
                        .catch(err => console.error(err));
                let flights = DBData.length > 0 ? DBData : localData;
                if (collection === data_service_1.DBCollection.Arrivals)
                    flights.forEach(flight => this._arrivals.set(flight.flightCode, flight));
                else
                    flights.forEach(flight => this._departures.set(flight.flightCode, flight));
            });
            // if (isRestart)
            // 	await setData(collection);
            // else
            yield data_service_1.DataService.getAll(collection)
                .then((data) => __awaiter(this, void 0, void 0, function* () { return yield setData(data); }))
                .catch((err) => __awaiter(this, void 0, void 0, function* () {
                console.error(err);
                yield setData(null, true);
            }));
        });
    }
    createTransmission(flight, message) {
        return new transmission_1.Transmission(flight.flightCode, constants_1.CONTROL_TOWER, message, transmission_1.ReplyCode.Over, flight);
    }
    getSettingsObject() {
        return {
            intervalRange: this._intervalRange
        };
    }
}
exports.Simulator = Simulator;
//# sourceMappingURL=simulator.js.map