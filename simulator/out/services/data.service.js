"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const querystring = require("querystring");
const rp = require("request-promise");
var DBCollection;
(function (DBCollection) {
    DBCollection["Arrivals"] = "simulatorArrivals";
    DBCollection["Departures"] = "simulatorDepartures";
})(DBCollection = exports.DBCollection || (exports.DBCollection = {}));
const request = rp.defaults({ baseUrl: 'http://localhost:3000', json: true });
// Unmark to get request debug info in stderr
// rd(request);
class DataService {
    static getAll(collection, conditions) {
        return request.get(`${collection}${conditions ? `?${querystring.stringify(conditions)}` : ''}`);
    }
    static getOne(collection, id) {
        return request.get(`${collection}/${id}`);
    }
    static create(collection, ...docs) {
        return request.post(collection, { body: docs });
    }
    static update(collection, conditions, data) {
        return request.put(`${collection}${conditions ? `?${querystring.stringify(conditions)}` : ''}`, data);
    }
    static delete(collection, conditions) {
        return request.delete(`${collection}${conditions ? `?${querystring.stringify(conditions)}` : ''}`);
    }
}
exports.DataService = DataService;
//# sourceMappingURL=data.service.js.map