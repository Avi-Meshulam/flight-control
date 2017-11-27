import * as express from 'express';
import * as http from 'http';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/retryWhen';
import * as socketIO from 'socket.io';
import { IFlight } from './models/IFlight';
import { ReplyCode, Transmission } from './models/transmission';
import { Simulator } from './simulator';
import Utils from './utils';

enum OutgoingMessageType {
	General = 'general',
	FlightTransmission = 'flight-transmission'
}

const OBSERVABLE_RETRY_INTERVAL: number = 1000;
const SOCKET_RETRY_INTERVAL: number = 3000;

const IncomingMessageType = [
	'general',
	'direction',
	'leg-closed',
	'emergency',
	'settings'
];

const app: express.Application = express();
const server: http.Server = (http as any).createServer(app);
const port: string | number = process.env.PORT || 8080;
const io: SocketIO.Server = socketIO(server);

const simulator = new Simulator();
const transmissions = simulator.getTransmissions().retryWhen(errors => errors.delay(OBSERVABLE_RETRY_INTERVAL));

io.on('connection', (socket: SocketIO.Socket) => {
	console.log('user connected\n');

	let subscription = transmissions.subscribe(
		transmission => sendFlightTransmission(socket, transmission),
		err => console.log(`error: ${err}`),
		() => console.log('flights pool exhausted')
	);

	socket.on('disconnect', () => {
		console.log('user disconnected\n');
		subscription.unsubscribe();
	});

	IncomingMessageType.forEach(messageType =>
		socket.on(messageType, args => handleIncomingMessage(messageType, args))
	);
});

server.listen(port, () => {
	console.log(`Listening on port: ${port}\n`);
});

//#region Helper Functions
function sendFlightTransmission(socket: SocketIO.Socket, transmission: Transmission): void {
	console.log(Transmission.stringify(transmission));

	socket.emit(OutgoingMessageType.FlightTransmission, transmission,
		async response => {
			if (isValidResponse(transmission, response)) {
				console.log(Transmission.stringify(response));
			}
			else {
				// Resend transmission recursively until acknowledgment
				await Utils.delay(SOCKET_RETRY_INTERVAL);
				sendFlightTransmission(socket, createInvalidResponseTransmission(transmission, response));
			}
		});
}

function handleIncomingMessage(messageType: string, args?: any): void {
	switch (messageType) {
		case 'direction':
			console.log(Transmission.stringify(args));
			simulator.deleteTransmission(args.data as IFlight);
			break;
		case 'settings':
			simulator.applySettings(args);
			console.log(`Settings changed to: ${JSON.stringify(args)}\n`);
			break;
		default:
			console.log(`${messageType.replace('-', ' ')}${args ? `: ${JSON.stringify(args)}` : ''}`);
			break;
	}
}

function isValidResponse(transmission: Transmission, response: any): boolean {
	if (!Transmission.isTransmission(response))
		return false;

	if (response.from !== transmission.to ||
		response.to !== transmission.from ||
		(response.replyCode !== ReplyCode.Roger
			&& response.replyCode !== ReplyCode.Standby
			&& response.replyCode !== ReplyCode.Out
		))
		return false;

	return true;
}

function createInvalidResponseTransmission(orig_transmission: Transmission, response: Transmission): Transmission {
	let message: string | undefined;
	let replyCode = ReplyCode.SayAgain;

	if (response.replyCode === ReplyCode.SayAgain) {
		message = orig_transmission.message;
		replyCode = ReplyCode.Over;
	}

	return new Transmission(
		orig_transmission.from,
		orig_transmission.to,
		message,
		replyCode,
		orig_transmission.data
	);
}
//#endregion Helper Functions
