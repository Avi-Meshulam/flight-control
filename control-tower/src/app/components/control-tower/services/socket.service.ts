import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import * as socketIO from 'socket.io-client';
import { Flight } from '../../../models/flight';
import { ITransmission, ReplyCode, Transmission } from '../../../models/transmission';
import { CONTROL_TOWER } from '../../../shared/constants';

enum IncomingMessageType {
	General = 'general',
	FlightTransmission = 'flight-transmission'
}

export enum OutgoingMessageType {
	General = 'general',
	Direction = 'direction',
	LegClosed = 'leg_closed',
	Emergency = 'emergency',
	Settings = 'settings'
}

const SERVER_URL = 'http://localhost:8080';

@Injectable()
export class SocketService {
	private _socket: SocketIOClient.Socket;

	constructor() {
		this._socket = socketIO(SERVER_URL, { autoConnect: false });
	}

	public connect(): void {
		this._socket.connect();
	}

	public disconnect(): void {
		this._socket.disconnect();
	}

	public onConnect(): Observable<void> {
		return new Observable(observer => {
			this._socket.on('connect', () => observer.next());
		});
	}

	public onDisconnect(): Observable<void> {
		return new Observable(observer => {
			this._socket.on('disconnect', () => observer.next());
		});
	}

	public onFlightTransmission(): Observable<ITransmission> {
		return new Observable(observer => {
			this._socket.on(IncomingMessageType.FlightTransmission, (transmission, reply: Function) => {
				// console.log(Transmission.stringify(transmission));
				let isValid = this.isValidTransmission(transmission);
				let response = this.createResponseByTransmission(transmission, isValid);
				// console.log(Transmission.stringify(response));
				reply(response);
				if (isValid)
					observer.next(transmission);
			});
		});
	}

	public onGeneral(): Observable<any> {
		return new Observable(observer => {
			this._socket.on(IncomingMessageType.General, message => observer.next(message));
		});
	}

	public send(messageType: OutgoingMessageType, data?: any): void {
		// if (messageType === 'direction')
		// 	console.log(Transmission.stringify(data));
		this._socket.emit(messageType, data);
	}

	//#region Helper Methods
	private isValidTransmission(transmission: any): boolean {
		if (!Transmission.isTransmission(transmission))
			return false;

		if (transmission.to !== CONTROL_TOWER)
			return false;

		if (!Flight.isValidFlight(transmission.data))
			return false;

		return true;
	}

	private createResponseByTransmission(transmission: Transmission, isValidTransmission: boolean = true): Transmission {
		let message = isValidTransmission ? 'Roger' : '';
		let code = isValidTransmission ? ReplyCode.Standby : ReplyCode.SayAgain;

		return new Transmission(
			CONTROL_TOWER,
			transmission.from,
			message,
			code
		);
	}
	//#endregion Helper Methods
}
