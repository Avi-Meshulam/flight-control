import { FlightStatus, IArrivingFlight, IDepartingFlight, IFlight } from './IFlight';

export abstract class Flight implements IFlight {
	constructor(
		public airline: string,
		public flightCode: string,
		public status: FlightStatus = FlightStatus.OnTime,
		public isEmergency: boolean = false
	) {
	}

	static isArrivingFlight(flight: IFlight): flight is IArrivingFlight {
		return (<IArrivingFlight>flight).comingFrom !== undefined;
	}

	static isDepartingFlight(flight: IFlight): flight is IDepartingFlight {
		return (<IDepartingFlight>flight).departingTo !== undefined;
	}
}

export class ArrivingFlight extends Flight implements IArrivingFlight {
	constructor(
		airline: string,
		flightCode: string,
		public comingFrom: string,
		status: FlightStatus = FlightStatus.OnTime,
		isEmergency: boolean = false
	) {
		super(airline, flightCode, status, isEmergency);
	}

	static createNew(obj: IArrivingFlight): ArrivingFlight {
		return new ArrivingFlight(
			obj.airline,
			obj.flightCode,
			obj.comingFrom,
			obj.status,
			obj.isEmergency
		);
	}
}

export class DepartingFlight extends Flight implements IDepartingFlight {
	constructor(
		airline: string,
		flightCode: string,
		public departingTo: string,
		status: FlightStatus = FlightStatus.OnTime,
		isEmergency: boolean = false
	) {
		super(airline, flightCode, status, isEmergency);
	}
	
	static createNew(obj: IDepartingFlight): DepartingFlight {
		return new DepartingFlight(
			obj.airline,
			obj.flightCode,
			obj.departingTo,
			obj.status,
			obj.isEmergency
		);
	}
}

