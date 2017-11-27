import { IFlight } from './IFlight';

export enum LegType {
	Enter = 'Enter',
	PreLanding = 'Pre-Landing',
	Landing = 'Landing',
	Runaway = 'Runaway',
	Arrivals = 'Arrivals',
	Terminal = 'Terminal',
	Departures = 'Departures',
	Exit = 'Exit'
}

export enum LegState {
	Undefined = 'Undefined',
	Unoccupied = 'Unoccupied',
	MoveDirectionSent = 'Move Direction Sent',
	MoveConfirmed = 'Move Confirmed',
	MarkedForSave = 'Marked For Save',
	Saved = 'Saved',
	Occupied = 'Occupied'
}

export interface ILeg {
	_id: number;
	type: LegType;
	state?: LegState;
	isClosed?: boolean;
	flight?: IFlight;
}
