"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bodyParser = require("body-parser");
const express = require("express");
const mongooseController_1 = require("./controllers/mongooseController");
const dbConfig = require("./db.config");
const arrival_model_1 = require("./models/arrival.model");
const departure_model_1 = require("./models/departure.model");
const flightLog_model_1 = require("./models/flightLog.model");
const leg_model_1 = require("./models/leg.model");
const log_model_1 = require("./models/log.model");
const settings_model_1 = require("./models/settings.model");
const simulatorArrival_model_1 = require("./models/simulatorArrival.model");
const simulatorDeparture_model_1 = require("./models/simulatorDeparture.model");
const routing_1 = require("./routing");
const app = express();
const port = process.env.PORT || 3000;
// Log that a rejected promise was unhandled
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at: Promise ', promise, ' reason: ', reason);
});
app.use(bodyParser.json());
app.all('/*', (req, res, next) => {
    // CORS headers
    res.header('Access-Control-Allow-Origin', '*'); // restrict it to the required domain
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
    // CORS custom headers
    res.header('Access-Control-Allow-Headers', 'Content-type, Accept');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
    }
    else {
        next();
    }
});
app.use('/arrivals', new routing_1.default(new mongooseController_1.default(arrival_model_1.ArrivalModel)).router);
app.use('/departures', new routing_1.default(new mongooseController_1.default(departure_model_1.DeparturetModel)).router);
app.use('/legs', new routing_1.default(new mongooseController_1.default(leg_model_1.LegModel)).router);
app.use('/flightLog', new routing_1.default(new mongooseController_1.default(flightLog_model_1.FlightLogModel)).router);
app.use('/log', new routing_1.default(new mongooseController_1.default(log_model_1.LogModel)).router);
app.use('/settings', new routing_1.default(new mongooseController_1.default(settings_model_1.SettingsModel)).router);
app.use('/simulatorArrivals', new routing_1.default(new mongooseController_1.default(simulatorArrival_model_1.SimulatorArrivalModel)).router);
app.use('/simulatorDepartures', new routing_1.default(new mongooseController_1.default(simulatorDeparture_model_1.SimulatorDepartureModel)).router);
app.use('/', (req, res) => {
    res.send('flight-control DAL');
});
app.use((req, res, next) => {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.json({
        error: {
            message: err.message
        }
    });
});
app.listen(port, () => {
    dbConfig.connectMongoDB()
        .then(() => console.log(`Listening on port: ${port}`));
});
//# sourceMappingURL=main.js.map