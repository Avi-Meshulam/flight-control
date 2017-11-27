import * as bodyParser from 'body-parser';
import * as express from 'express';
import MongooseController from './controllers/mongooseController';
import * as dbConfig from './db.config';
import { ArrivalModel } from './models/arrival.model';
import { DeparturetModel } from './models/departure.model';
import { FlightLogModel } from './models/flightLog.model';
import { LegModel } from './models/leg.model';
import { LogModel } from './models/log.model';
import { SettingsModel } from './models/settings.model';
import { SimulatorArrivalModel } from './models/simulatorArrival.model';
import { SimulatorDepartureModel } from './models/simulatorDeparture.model';
import Routing from './routing';

const app: express.Application = express();
const port: string | number = process.env.PORT || 3000;

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
	} else {
		next();
	}
});

app.use('/arrivals', new Routing(new MongooseController(ArrivalModel)).router);
app.use('/departures', new Routing(new MongooseController(DeparturetModel)).router);
app.use('/legs', new Routing(new MongooseController(LegModel)).router);
app.use('/flightLog', new Routing(new MongooseController(FlightLogModel)).router);
app.use('/log', new Routing(new MongooseController(LogModel)).router);
app.use('/settings', new Routing(new MongooseController(SettingsModel)).router);
app.use('/simulatorArrivals', new Routing(new MongooseController(SimulatorArrivalModel)).router);
app.use('/simulatorDepartures', new Routing(new MongooseController(SimulatorDepartureModel)).router);

app.use('/', (req, res) => {
	res.send('flight-control DAL');
});

app.use((req, res, next) => {
	let err = new Error('Not Found');
	(<any>err).status = 404;
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
