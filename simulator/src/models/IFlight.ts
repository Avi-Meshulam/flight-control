export enum FlightStatus {
	OnTime = 'OnTime',
	Delay = 'Delay'
}

export interface IFlight {
	readonly airline: string;
	readonly flightCode: string;
	status?: FlightStatus;
	isEmergency?: boolean;
}

export interface IArrivingFlight extends IFlight {
	readonly comingFrom: string;
}

export interface IDepartingFlight extends IFlight {
	readonly departingTo: string;
}

