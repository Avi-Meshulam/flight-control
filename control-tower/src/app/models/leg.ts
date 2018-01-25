import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { INotifyPropertyChanged, PropertyChangedEventArgs } from '../shared/events';
import { IArrivingFlight, IDepartingFlight, IFlight } from './IFlight';
import { ILeg, LegState, LegType } from './ILeg';
import { ArrivingFlight, DepartingFlight, Flight } from './flight';

export class Leg implements ILeg, INotifyPropertyChanged {

	private readonly _propertyChanged = new Subject<PropertyChangedEventArgs>();
	private _isPropertyChangedEnabled: boolean = true;

	get propertyChanged(): Observable<PropertyChangedEventArgs> {
		return this._propertyChanged.asObservable();
	}

	constructor(public readonly _id: number, public readonly type: LegType) {
	}

	//#region Properties
	private _state: LegState = LegState.Unoccupied;
	get state(): LegState {
		return this._state;
	}
	set state(value: LegState) {
		if (this._state !== value) {
			// let oldValue = this._state;
			this._state = value;
			this.onPropertyChanged('state'/* , oldValue */);
		}
	}

	private _isClosed: boolean = false;
	get isClosed(): boolean {
		return this._isClosed;
	}
	set isClosed(value: boolean) {
		if (this._isClosed !== value) {
			// let oldValue = this._isClosed;
			this._isClosed = value;
			this.onPropertyChanged('isClosed'/* , oldValue */);
		}
	}

	private _flight: Flight = null;
	get flight(): Flight {
		return this._flight;
	}
	set flight(value: Flight) {
		if (this._flight !== value) {
			// let oldValue = this._flight;
			this._flight = value;
			// this.onPropertyChanged('flight'/* , oldValue */);
		}
	}
	//#endregion Properties

	static get empty(): Leg {
		let leg = new Leg(null, null);
		leg.state = LegState.Undefined;
		return leg;
	}

	getObject(): ILeg {
		return {
			_id: this._id,
			type: this.type,
			state: this._state,
			isClosed: this._isClosed,
			flight: this._flight ? this._flight.getObject() : null
		};
	}

	restore(leg: ILeg): void {
		this._state = leg.state;
		this._isClosed = leg.isClosed;
		if (leg.flight)
			this._flight = Flight.createNew(leg.flight);
	}

	invokeStateChanged(): void {
		this.onPropertyChanged('state', this._state);
	}

	disablePropertyChanged(): void {
		this._isPropertyChangedEnabled = false;
	}

	enablePropertyChanged(): void {
		this._isPropertyChangedEnabled = true;
	}

	private onPropertyChanged(propertyName: string, oldValue?: any): void {
		// if (this._isPropertyChangedEnabled)
			this._propertyChanged.next(new PropertyChangedEventArgs(propertyName, oldValue));
	}
}
