import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { Subject } from 'rxjs/Subject';
import { SettingsComponent } from '../components/control-tower/settings/settings.component';
import { ReplyCode, Transmission } from '../models/transmission';
import { Animation, IAnimationStory } from '../shared/animation';
import { CONTROL_TOWER, LEGS } from '../shared/constants';
import { INotifyPropertyChanged, PropertyChangedObservableArgs } from '../shared/events';
import Utils from '../shared/utils';
import { FlightStatus, IArrivingFlight, IDepartingFlight, IFlight } from './IFlight';
import { Leg } from './Leg';

export abstract class Flight implements IFlight, INotifyPropertyChanged {

	private readonly _propertyChanged = new Subject<PropertyChangedObservableArgs>();
	private _isPropertyChangedEnabled: boolean = true;
	private readonly _animation: Animation = new Animation();
	private _animationTimeline: anime.AnimeTimelineInstance;
	private _isPaused: boolean = false;

	get propertyChanged(): Observable<PropertyChangedObservableArgs> {
		return this._propertyChanged.asObservable();
	}

	constructor(
		public airline: string,
		public flightCode: string,
		status: FlightStatus = FlightStatus.OnTime,
		isEmergency: boolean = false,
		legId: number = null,
		createdAt: Date = new Date(),
		updatedAt: Date = new Date()
	) {
		this._status = status;
		this._isEmergency = isEmergency;
		this._legId = legId;
		this._createdAt = createdAt;
		this._updatedAt = updatedAt;
	}

	//#region Properties
	private _status: FlightStatus;
	get status(): FlightStatus {
		return this._status;
	}
	set status(value: FlightStatus) {
		if (this._status !== value) {
			// let oldValue = this._status;
			this._status = value;
			this.onPropertyChanged('status'/* , oldValue */);
		}
	}

	private _isEmergency: boolean;
	get isEmergency(): boolean {
		return this._isEmergency;
	}
	set isEmergency(value: boolean) {
		if (this._isEmergency !== value) {
			// let oldValue = this._isEmergency;
			this._isEmergency = value;
			this.onPropertyChanged('isEmergency'/* , oldValue */);
		}
	}

	private _legId: number;
	get legId(): number {
		return this._legId;
	}
	set legId(value: number) {
		if (this._legId !== value) {
			let oldValue = this._legId;
			this._legId = value;
			this.onPropertyChanged('legId', oldValue);
		}
	}

	private _createdAt: Date;
	get createdAt(): Date {
		return this._createdAt;
	}

	private _updatedAt: Date;
	get updatedAt(): Date {
		return this._updatedAt;
	}
	//#endregion Properties

	// 1. Moves to input leg and sets legId upon completion
	// 2. Returns confirmation
	async moveTo(leg: Leg, animationStory: IAnimationStory): Promise<Transmission> {
		this.setStoryElements(animationStory);

		if (leg.isClosed)
			setTimeout(() => this.pause(), animationStory.duration / 2);

		this._animationTimeline = this._animation.animate(animationStory, !this._isPaused);

		// Promise.all([this._animationTimeline.finished, Utils.delay(animationStory.duration)])
		this._animationTimeline.finished
			.then(() => this.legId = leg._id)
			.catch(err => console.error(err));

		await Utils.delay(Math.min(SettingsComponent.radioResponseTime, animationStory.duration / 2));
		return Transmission.createConfirmation(this.flightCode, CONTROL_TOWER);
	}

	// Moves outside of legs area
	// Returns end response
	async endInteraction(animationStory: IAnimationStory): Promise<Transmission> {
		this.setStoryElements(animationStory);

		this._animationTimeline = this._animation.animate(animationStory, !this._isPaused);

		// Promise.all([this._animationTimeline.finished, Utils.delay(animationStory.duration)])
		this._animationTimeline.finished
			.then(() => {
				this.status = this.legId === LEGS.Exit ? FlightStatus.Departed : FlightStatus.Landed;
				this.legId = null;
			})
			.catch(err => console.error(err));

		await Utils.delay(Math.min(SettingsComponent.radioResponseTime, animationStory.duration / 2));
		let response = this.legId === LEGS.Exit ? 'Thank you, Goodbye :)' : 'Thank you! :)';
		return new Transmission(this.flightCode, CONTROL_TOWER, response, ReplyCode.Out);
	}

	pause(): void {
		if (!this._animationTimeline.completed) {
			this._isPaused = true;
			this._animationTimeline.pause();
		}
	}

	continue(): void {
		this._isPaused = false;
		// if (!this._animationTimeline.completed)
		this._animationTimeline.play();
	}

	setFlightElement(element: HTMLElement): void {
		let pathId = element.id.replace('flight', '');
		element.querySelector(`#flightCode${pathId}`).innerHTML = this.flightCode;
		element.querySelector(`#airline${pathId}`).innerHTML = this.airline;
		element.querySelector(`#location${pathId}`).innerHTML = Flight.isArrivingFlight(this) ?
			this.comingFrom : Flight.isDepartingFlight(this) ? this.departingTo : '';
		$(element).find(`#warning${pathId}`)[0].style.display = this.isEmergency ? '' : 'none';
	}

	// Returns true if flight has greater priority than other flight, otherwise returns false
	compareByPriority(other: Flight): boolean {
		if (!other)
			return true;

		if (this.isEmergency && !other.isEmergency)
			return true;

		if (!this.isEmergency && other.isEmergency)
			return false;

		// if (this.updatedAt.valueOf() < other.updatedAt.valueOf())
		if (this.createdAt.valueOf() < other.createdAt.valueOf())
			return true;

		// if (this.updatedAt.valueOf() === other.updatedAt.valueOf()) {
		if (this.createdAt.valueOf() === other.createdAt.valueOf()) {
			if (this._legId === LEGS.Landing) return true;
			if (other._legId === LEGS.Landing) return false;
			if (Flight.isDepartingFlight(this)) return true;
			if (Flight.isDepartingFlight(other)) return false;
			return true;
		}

		return false;
	}

	getObject(): IFlight {
		return {
			airline: this.airline,
			flightCode: this.flightCode,
			status: this._status,
			isEmergency: this._isEmergency,
			legId: this._legId,
			createdAt: this._createdAt,
			updatedAt: this._updatedAt
		};
	}

	disablePropertyChanged(): void {
		this._isPropertyChangedEnabled = false;
	}

	enablePropertyChanged(): void {
		this._isPropertyChangedEnabled = true;
	}

	private onPropertyChanged(propertyName: string, oldValue?: any): void {
		this._updatedAt = new Date();
		// if (this._isPropertyChangedEnabled)
			this._propertyChanged.next(new PropertyChangedObservableArgs(propertyName, oldValue));
	}

	private setStoryElements(animationStory: IAnimationStory): void {
		this.setFlightElement(animationStory.startElement);
		animationStory.frames.forEach(frame => {
			if (frame.element)
				this.setFlightElement(frame.element);
		});
	}

	//#region static utilities
	static isValidFlight(obj: any): obj is IArrivingFlight | IDepartingFlight {
		return (obj && obj.airline && obj.flightCode)
			&& (Flight.isArrivingFlight(obj as IFlight) || Flight.isDepartingFlight(obj as IFlight));
	}

	static isArrivingFlight(flight: IFlight): flight is IArrivingFlight {
		return (<IArrivingFlight>flight).comingFrom !== undefined;
	}

	static isDepartingFlight(flight: IFlight): flight is IDepartingFlight {
		return (<IDepartingFlight>flight).departingTo !== undefined;
	}

	static createNew(flight: IFlight): Flight {
		if (Flight.isArrivingFlight(flight))
			return ArrivingFlight.createNew(flight as IArrivingFlight);
		else
			return DepartingFlight.createNew(flight as IDepartingFlight);
	}
	//#endregion static utilities
}

export class ArrivingFlight extends Flight implements IArrivingFlight {
	constructor(
		airline: string,
		flightCode: string,
		public comingFrom: string,
		status: FlightStatus = FlightStatus.OnTime,
		isEmergency: boolean = false,
		legId: number = null,
		createdAt: Date = new Date(),
		updatedAt: Date = new Date()
	) {
		super(airline, flightCode, status, isEmergency, legId, createdAt, updatedAt);
	}

	static createNew(obj: IArrivingFlight): ArrivingFlight {
		return new ArrivingFlight(
			obj.airline,
			obj.flightCode,
			obj.comingFrom,
			obj.status,
			obj.isEmergency,
			obj.legId,
			obj.createdAt,
			obj.updatedAt
		);
	}

	getObject(): IArrivingFlight {
		return Object.assign(super.getObject(), { comingFrom: this.comingFrom });
	}
}

export class DepartingFlight extends Flight implements IDepartingFlight {
	constructor(
		airline: string,
		flightCode: string,
		public departingTo: string,
		status: FlightStatus = FlightStatus.OnTime,
		isEmergency: boolean = false,
		legId: number = null,
		createdAt: Date = new Date(),
		updatedAt: Date = new Date()
	) {
		super(airline, flightCode, status, isEmergency, legId, createdAt, updatedAt);
	}

	static createNew(obj: IDepartingFlight): DepartingFlight {
		return new DepartingFlight(
			obj.airline,
			obj.flightCode,
			obj.departingTo,
			obj.status,
			obj.isEmergency,
			obj.legId,
			obj.createdAt,
			obj.updatedAt
		);
	}

	getObject(): IDepartingFlight {
		return Object.assign(super.getObject(), { departingTo: this.departingTo });
	}
}
