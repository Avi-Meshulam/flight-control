import { Leg } from './leg';

export enum FlightStatus {
	OnTime = 'OnTime',
	Delay = 'Delay',
	Departed = 'Departed',
	Landed = 'Landed'
}

export interface IFlight {
	readonly airline: string;
	readonly flightCode: string;
	status?: FlightStatus;
	isEmergency?: boolean;
	legId?: number;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface IArrivingFlight extends IFlight {
	readonly comingFrom: string;
}

export interface IDepartingFlight extends IFlight {
	readonly departingTo: string;
}
