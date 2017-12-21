import { AfterViewInit, Component, ViewEncapsulation } from '@angular/core';
import * as $ from 'jquery';
import 'jquery-contextmenu';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/retryWhen';
import { FlightStatus, IArrivingFlight, IDepartingFlight, IFlight } from '../../models/IFlight';
import { ILeg, LegState, LegType } from '../../models/ILeg';
import { ArrivingFlight, DepartingFlight, Flight } from '../../models/flight';
import { Leg } from '../../models/leg';
import { IFormattedTransmission, ITransmission, ReplyCode, Transmission } from '../../models/transmission';
import DOMUtils, { IAttribute } from '../../shared/DOMUtils';
import { Animation, IAnimationFrame, IAnimationStory } from '../../shared/animation';
import { CONTROL_TOWER, LEGS, ONE_QUEUE_LEGS, ONE_WAY_NO_COMPETITION_LEGS } from '../../shared/constants';
import { PropertyChangedObservableArgs } from '../../shared/events';
import Utils from '../../shared/utils';
import { DataService, DBCollection } from './services/data.service';
import { OutgoingMessageType, SocketService } from './services/socket.service';
import { SafetyMode, SettingsComponent } from './settings/settings.component';

export enum QueueType {
	Arrivals = 'arrivals',
	Departures = 'departures',
	Emergencies = 'emergencies'
}

const LEGS_COUNT = 9;
const SET_EMERGENCY = 'Set Emergency';
const CANCEL_EMERGENCY = 'Cancel Emergency';

@Component({
	templateUrl: './control-tower.component.html',
	styleUrls: ['./control-tower.component.css'],
	encapsulation: ViewEncapsulation.None
})
export class ControlTowerComponent implements AfterViewInit {
	private readonly _terminalLegs: Leg[] = [];
	private readonly _terminalLegsReversed: Leg[] = [];
	private readonly _availableLegStates = [LegState.MoveConfirmed, LegState.Unoccupied];
	private readonly _allFlights: Map<string, Flight> = new Map<string, Flight>();
	private readonly _arrivalsQueue: Map<string, Flight> = new Map<string, Flight>();
	private readonly _departuresQueue: Map<string, Flight> = new Map<string, Flight>();
	private readonly _emergenciesQueue: Map<string, Flight> = new Map<string, Flight>();
	private readonly _animationStories: Map<string, IAnimationStory> = new Map<string, IAnimationStory>();
	private readonly _flightEventsSubscriptions: Map<string, Subscription[]> = new Map<string, Subscription[]>();

	private _airportMap: Document;

	constructor(
		private _dataService: DataService,
		private _socketService: SocketService
	) {
		this.init();
	}

	arrivals: Readonly<Flight[]> = [];
	departures: Readonly<Flight[]> = [];
	emergencies: Readonly<Flight[]> = [];

	//#region Properties
	private readonly _legs: Leg[] = [];
	get legs(): Readonly<Leg[]> {
		return this._legs;
	}

	private _flightTransmission: IFormattedTransmission = { body: null };
	get flightTransmission(): IFormattedTransmission {
		return this._flightTransmission;
	}

	private _towerTransmission: IFormattedTransmission = { body: null };
	get towerTransmission(): IFormattedTransmission {
		return this._towerTransmission;
	}

	private _isEmergency: boolean = false;
	get isEmergency(): boolean {
		return this._isEmergency;
	}
	//#endregion Properties

	private init(): void {
		this.initLegs();
		this.initSocket();
	}

	ngAfterViewInit(): void {
		let mapObj = document.getElementById('map');
		mapObj.addEventListener('load', async () => {
			let mapDoc = (mapObj as any).contentDocument;
			this._airportMap = mapDoc.querySelector('svg');
			this.initAnimationStories();
			this.initContextMenues();
			await this.restoreData()
				.catch(err => console.error(err));
			this.restoreMap();
			this.subscribeToLegsAndFlightsEvents();
			// if (this._legs.some(leg => leg.flight !== null))
			if (this._allFlights.size > 0)
				this.reignite(this._legs);
		}, false);
	}

	private initLegs(): void {
		this._legs[0] = Leg.empty;
		for (let index = 1; index <= LEGS_COUNT; index++) {
			let leg = new Leg(index, this.getLegTypeByLegId(index));
			this._legs[index] = leg;
			if (leg.type === LegType.Terminal) {
				this._terminalLegs.push(leg);
				this._terminalLegsReversed.unshift(leg);
			}
		}
	}

	// Restore data from backup
	private async restoreData(): Promise<void> {
		return await Promise.all([
			this._dataService.getAll(DBCollection.ArrivalsQueue),
			this._dataService.getAll(DBCollection.DeparturesQueue),
			this._dataService.getAll(DBCollection.Legs)
		])
			.then(([arrivals, departures, legs]) => {
				arrivals.forEach(flight => this.restoreQueueFlight(flight as IFlight, QueueType.Arrivals));
				departures.forEach(flight => this.restoreQueueFlight(flight as IFlight, QueueType.Departures));
				legs.forEach(leg => this.restoreLeg(leg as ILeg));
			});
	}

	// Restore previous map state
	private restoreMap(): void {
		let self = this;
		// Restore closed legs
		this._legs.filter(leg => leg.isClosed).forEach(leg =>
			$(self._airportMap).find(`#barrier${leg._id}`)[0].style.display = '');
	}

	// Invoke 'state' propertyChanged event for each leg in legs parameter,
	// which its state is included in legStates parameter
	private reignite(legs: Leg[] = this._legs, legStates: LegState[] = [...this._availableLegStates, LegState.Occupied]): void {
		legs.forEach(leg => {
			if (legStates.includes(leg.state))
				leg.invokeStateChanged();
		});
	}

	// Open 'radio' channel and set events handlers
	private initSocket(): void {
		this._socketService.onConnect().subscribe(() => {
			console.log('connected to socket\n');
		});

		this._socketService.onDisconnect().subscribe(() => {
			console.log('disconnected from socket\n');
		});

		this._socketService.onGeneral().subscribe(msg => {
			if (msg)
				console.log(Transmission.stringify(msg));
		});

		this._socketService.onFlightTransmission().retryWhen(errors => errors.delay(1000)).subscribe(
			async transmission => {
				this.setFlightTransmission(transmission);
				await Utils.delay(SettingsComponent.radioResponseTime);
				this.handleFlightTransmission(transmission);
			},
			err => console.error(err)
		);
	}

	//#region 'Event' Handlers
	private async flight_propertyChanged(flight: Flight, e: PropertyChangedObservableArgs): Promise<void> {
		this.addFlightLog(flight);

		if (e.propertyName === 'legId' && flight.legId)
			this.setFlightTransmission(new Transmission(flight.flightCode, CONTROL_TOWER, `At Leg no. ${flight.legId}`));

		await Utils.delay(SettingsComponent.radioResponseTime);

		if (e.propertyName === 'legId') {
			if (e.oldValue && !this._legs[e.oldValue].flight)
				this._legs[e.oldValue].state = LegState.Unoccupied;

			if (flight.legId)
				this._legs[flight.legId].state = LegState.Occupied;
			else {
				if (flight.status !== FlightStatus.Departed && flight.status !== FlightStatus.Landed)
					console.error(`Incohesive flight data: legId: ${flight.legId} status: ${flight.status}`);
				this.unsubscribeFromFlightEvents(flight);
				this._allFlights.delete(flight.flightCode);
			}
		}
		else if (e.propertyName === 'isEmergency') {
			this.flight_isEmergencyChanged(flight);
		}
		// else if (e.propertyName === 'status') {
		// 	console.log(`Flight ${flight.flightCode} status has been changed to: ${flight.status}\n`);
		// }
	}

	private async leg_propertyChanged(leg: Leg, e: PropertyChangedObservableArgs): Promise<void> {
		// console.log(`Leg no. ${leg._id} ${e.propertyName} property changed to: ${leg[e.propertyName]}\n`);

		// Save backup of leg's data
		await this._dataService.update(DBCollection.Legs, { _id: leg._id }, leg.getObject())
			.catch(err =>
				/* TODO: save record to a local file and sync later */
				console.error(err)
			);

		if (e.propertyName === 'isClosed') {
			this.leg_isClosedChanged(leg);
		}

		if (e.propertyName === 'state') {
			this.leg_stateChanged(leg);
		}
	}
	//#endregion 'Event' Handlers

	//#region 'Event' Handlers Helper Methods
	private flight_isEmergencyChanged(flight: Flight): void {
		this.setEmergencyStatusByFlight(flight);
		if (!flight.legId) {
			if (flight.isEmergency) {
				if (this.isLegAvailable(this._legs[LEGS.Enter]))
					this.moveFlightFromQueue(QueueType.Arrivals, this._legs[LEGS.Enter], flight);
				else
					this.addFlightToQueue(QueueType.Emergencies, flight);
			}
			else
				this.deleteFlightFromQueue(QueueType.Emergencies, flight);
		}
	}

	private leg_isClosedChanged(leg: Leg): void {
		let transmission = this.createTransmission('All Flights',
			`Leg no. ${leg._id} (${leg.type}) is ${leg.isClosed ? 'CLOSED' : 'OPEN'}. Please wait for instructions.`);
		this.sendMessage(OutgoingMessageType.LegClosed, transmission);

		if ([LegState.MarkedForSave, LegState.Saved].includes(leg.state)) {
			if (leg.isClosed)
				leg.flight.pause();
			else
				leg.flight.continue();
		}
		else if (!leg.isClosed)
			this.reignite([leg]);
	}

	private leg_stateChanged(leg: Leg): void {
		console.log(`Leg no. ${leg._id} state changed to: ${leg.state}\n`);
		switch (leg.state) {
			case LegState.Unoccupied:
			case LegState.MoveConfirmed:
				if (this.isLegAvailable(leg))
					this.leg_available(leg);
				break;
			case LegState.Occupied:
				this.leg_occupied(leg);
				break;
			default:
				break;
		}
	}

	private leg_available(leg: Leg): void {
		if (leg.type === LegType.Enter) {
			if (this._emergenciesQueue.size > 0) {
				this.moveFlightFromQueue(QueueType.Emergencies, leg);
			}
			else if (this._arrivalsQueue.size > 0) {
				this.moveFlightFromQueue(QueueType.Arrivals, leg);
			}
			return;
		}

		if (leg.type === LegType.Terminal) {
			
			// let pausedFlight = this._terminalLegs.find(leg => leg.isClosed 
			// 	&& [LegState.Saved, LegState.MarkedForSave].includes(leg.state) 
			// 	&& Flight.isArrivingFlight(leg.flight));
			
			// if (pausedFlight) {
				// TODO: Move closest paused flight to available leg
			// }

			let validTerminalLegForArrivals;
			if (this._legs[LEGS.Arrivals].state === LegState.Occupied)
				validTerminalLegForArrivals = this.findValidTerminalLegForArrivals();

			let firstWaitingFlight: Flight;

			if (this.isTerminalOpenForDepartures()) {
				// In case of an emergency, arrivals leg gets priority over departures queue in order to open a clear route
				if (this._isEmergency)
					firstWaitingFlight = validTerminalLegForArrivals ?
						this._legs[LEGS.Arrivals].flight
						: this.getFirstFlightNotInLegs(this._departuresQueue.values(), this._terminalLegs);
				else
					firstWaitingFlight = validTerminalLegForArrivals ?
						this.getMaxPriorityFlight(this._legs[LEGS.Arrivals].flight,
							this.getFirstFlightNotInLegs(this._departuresQueue.values(), this._terminalLegs))
						: this.getFirstFlightNotInLegs(this._departuresQueue.values(), this._terminalLegs);
			}
			else
				firstWaitingFlight = validTerminalLegForArrivals ? this._legs[LEGS.Arrivals].flight : undefined;

			if (firstWaitingFlight) {
				if (firstWaitingFlight === this._legs[LEGS.Arrivals].flight)
					this.moveFlight(firstWaitingFlight, validTerminalLegForArrivals);
				else {
					// try to find alternate leg, closer to exit
					leg = this._terminalLegs.find(other => other._id > leg._id && this.isLegAvailable(other)) || leg;
					this.moveFlightFromQueue(QueueType.Departures, leg, firstWaitingFlight);
				}
			}
		}
		else {
			let firstWaitingLeg = this.getFirstWaitingLeg(leg);
			if (firstWaitingLeg) {
				this.moveFlight(firstWaitingLeg.flight, leg);
			}
		}
	}

	private leg_occupied(leg: Leg): void {
		// If an emergency flight has landed => cancel its emergency
		if (leg.type === LegType.Runaway && leg.flight.isEmergency)
			leg.flight.isEmergency = false;

		// Handle the following cases:
		// 1. A flight in an arrivals leg was blocked by a flight moving from a terminal leg to a departures leg.
		// 2. A terminal leg was closed
		if (leg.type === LegType.Departures
			&& (this._legs[LEGS.Arrivals].state === LegState.Occupied
				// TODO: In case of multiple arrivals legs, replace the previous condition with the following one
				// && (this._legs.some(leg => leg.type === LegType.Arrivals && leg.state === LegState.Occupied)
				|| this._terminalLegs.some(leg => leg.isClosed))
		) {
			let availableLeg: Leg;
			if (availableLeg = this._terminalLegs.find(leg => this.isLegAvailable(leg)))
				this.leg_available(availableLeg);
		}

		if (leg.type === LegType.Terminal && Flight.isArrivingFlight(leg.flight)) {
			// If a departing flight in a terminal leg was blocked by an arriving flight => try to let it go now
			// The following if statement can be potentially deleted, leaving its true case implementation running in all scenarios
			if (this._terminalLegs.find(other => other.state === LegState.Occupied
				&& Flight.isDepartingFlight(other.flight)
				&& other._id < leg._id
				&& other === this.getMaxPriorityLeg(other, this._legs[LEGS.Arrivals])
				// TODO: In case of multiple arrivals legs, replace the previous condition with the following one
				// && other === this.getMaxPriorityLeg(other, ...this._legs.filter(leg => leg.type === LegType.Arrivals))
			)) {
				if (this.isLegAvailable(this._legs[LEGS.Departures]))
					this.leg_available(this._legs[LEGS.Departures]);
				// TODO: In case of multiple departures legs, replace the previous statement with the following one
				// let availableLeg: Leg;
				// if (availableLeg = this._legs.find(leg => leg.type === LegType.Departures && this.isLegAvailable(leg)))
				// 	this.leg_available(availableLeg);
			}

			this.endInteraction(leg.flight);
			return;
		}

		if (leg.type === LegType.Exit) {
			this.endInteraction(leg.flight);
			return;
		}

		let nextAvailableLeg = this.getNextAvailableLeg(leg);
		if (nextAvailableLeg)
			// this.moveFlight(leg.flight, nextAvailableLeg);
			this.leg_available(nextAvailableLeg);
	}
	//#region 'Event' Handlers Helper Methods

	//#region Helper Methods

	// Returns a waiting leg, order by flights priority
	private getFirstWaitingLeg(leg: Leg): Leg | undefined {

		if (ONE_QUEUE_LEGS.includes(leg._id)) {
			return this._legs[leg._id - 1].state === LegState.Occupied ? this._legs[leg._id - 1] : undefined;
		}

		if (leg.type === LegType.Runaway) {
			if (this._isEmergency) {
				if (this._legs[LEGS.Landing].state === LegState.Occupied)
					return this._legs[LEGS.Landing];
				if (this._legs[LEGS.Departures].state === LegState.Occupied)
					return this._legs[LEGS.Departures];
				return undefined;
			}
			else {
				if (this._legs[LEGS.Landing].state === LegState.Occupied
					&& this._legs[LEGS.Departures].state === LegState.Occupied)
					return this.getMaxPriorityLeg(this._legs[LEGS.Landing], this._legs[LEGS.Departures]);

				if (this._legs[LEGS.Landing].state === LegState.Occupied)
					return this._legs[LEGS.Landing];

				if (this._legs[LEGS.Departures].state === LegState.Occupied)
					return this._legs[LEGS.Departures];

				return undefined;
			}
		}

		if (leg.type === LegType.Exit) {
			if (this._legs[LEGS.Runaway].state === LegState.Occupied
				&& Flight.isDepartingFlight(this._legs[LEGS.Runaway].flight))
				return this._legs[LEGS.Runaway];
			return undefined;
		}

		if (leg.type === LegType.Arrivals) {
			if (this._legs[LEGS.Runaway].state === LegState.Occupied
				&& Flight.isArrivingFlight(this._legs[LEGS.Runaway].flight))
				return this._legs[LEGS.Runaway];
			return undefined;
		}

		if (leg.type === LegType.Departures) {
			return this.getMaxPriorityLeg(...this._terminalLegs.filter(leg =>
				leg.state === LegState.Occupied
				&& Flight.isDepartingFlight(leg.flight)
				// Prevent a case of sending a flight, while another flight is moving on the same route
				&& !this._terminalLegs.find(other => other._id > leg._id
					&& [LegState.Saved, LegState.MarkedForSave].includes(other.state)
					&& Flight.isArrivingFlight(other.flight))));
		}
	}

	// Returns the next leg in route that is open, or undefined if there's no open leg
	private getNextAvailableLeg(leg: Leg): Leg | undefined {
		if (ONE_WAY_NO_COMPETITION_LEGS.includes(leg._id))
			return this.isLegAvailable(this._legs[leg._id + 1]) ? this._legs[leg._id + 1] : undefined;

		if (leg.type === LegType.Landing) {
			return this.isLegAvailable(this._legs[LEGS.Runaway]) ?
				this._legs[LEGS.Runaway] : undefined;
		}

		if (leg.type === LegType.Runaway) {
			if (Flight.isArrivingFlight(leg.flight))
				return this.isLegAvailable(this._legs[LEGS.Arrivals]) ? this._legs[LEGS.Arrivals] : undefined;
			else
				return this.isLegAvailable(this._legs[LEGS.Exit]) ? this._legs[LEGS.Exit] : undefined;
		}

		if (leg.type === LegType.Arrivals) {
			let terminalLeg = this._terminalLegs.find(leg => this.isLegAvailable(leg));
			return terminalLeg ? terminalLeg : undefined;
		}

		if (leg.type === LegType.Terminal)
			// At this point in code, flight at terminal must be Departing
			// (arriving flights that reach terminal are called for end interaction process)
			return this.isLegAvailable(this._legs[LEGS.Departures]) ?
				this._legs[LEGS.Departures] : undefined;

		if (leg.type === LegType.Departures)
			return this.isLegAvailable(this._legs[LEGS.Runaway]) ?
				this._legs[LEGS.Runaway] : undefined;
	}

	// Returns the highest priority flight, or null if all flights are null.
	private getMaxPriorityFlight(...flights: Flight[]): Flight {
		if (!flights || flights.length === 0)
			return undefined;
		if (flights.length === 1)
			return flights[0];
		return flights.reduce((f1, f2) =>
			f1 ? (f1.compareByPriority(f2) ? f1 : f2) : f2, null);
	}

	// Returns the leg in which there's the highest priority flight, or undefined if all legs have no flights.
	private getMaxPriorityLeg(...legs: Leg[]): Leg | undefined {
		if (!legs || legs.length === 0)
			return undefined;
		if (legs.length === 1)
			return legs[0];
		let leg = legs.reduce((leg1, leg2) =>
			leg1 && leg1.flight ? (leg1.flight.compareByPriority(leg2.flight) ? leg1 : leg2) : leg2, null);
		return leg.flight ? leg : undefined;
	}

	private isTerminalOpenForDepartures(): boolean {
		let availableTerminalsCount = 0;
		this._terminalLegs.forEach(leg => {
			if (this.isLegAvailable(leg))
				availableTerminalsCount += 1;
		});
		return availableTerminalsCount > 1 || (
			availableTerminalsCount === 1 && (
				this.isLegAvailable(this._legs[LEGS.Departures])
				|| (this._arrivalsQueue.size === 0
					&& !this._legs.some(leg => leg.flight && Flight.isArrivingFlight(leg.flight)))
			)
		);
	}

	// Search for the first leg that is available, and that there isn't another plane on the way
	private findValidTerminalLegForArrivals(): Leg | undefined {
		return !this._terminalLegs.some(leg => leg.isClosed 
			&& [LegState.Saved, LegState.MarkedForSave].includes(leg.state)
			&& Flight.isArrivingFlight(leg.flight)
		) && this._terminalLegs.find(leg =>
			this.isLegAvailable(leg)
			&& !([LegState.MarkedForSave, LegState.Saved].includes(this._legs[LEGS.Departures].state)
				&& this._legs[LEGS.Departures].flight.legId < leg._id)
			// TODO: In case of multiple departure legs, replace previous condition with the following:
			// && !this._legs.some(otherLeg =>
			// 	otherLeg.type === LegType.Departures
			// 	&& [LegState.MarkedForSave, LegState.Saved].includes(otherLeg.state)
			// 	&& otherLeg.flight.legId < leg._id)
		);
	}

	private getFirstFlightNotInLegs(flights: IterableIterator<Flight>, legs: Leg[] = this._legs): Flight {
		let flight: Flight;
		do {
			flight = flights.next().value;
		} while (legs.find(leg => leg.flight === flight));
		return flight;
	}

	private handleFlightTransmission(transmission: ITransmission): void {
		let flight = transmission.data as IFlight;

		if (this._allFlights.has(flight.flightCode)) {
			// console.warn(`flight ${flight.flightCode} is already in list\n`);
			return;
		}

		let flightObj: Flight;

		if (Flight.isArrivingFlight(flight))
			flightObj = this.addArrivingFlight(flight);
		else if (Flight.isDepartingFlight(flight))
			flightObj = this.addDepartingFlight(flight);

		this._allFlights.set(flight.flightCode, flightObj);

		this.addFlightLog(flightObj);
	}

	// Creates a NEW arriving flight and starts handling it
	private addArrivingFlight(flight: IArrivingFlight): ArrivingFlight {

		let flightObj = ArrivingFlight.createNew(flight);
		this.subscribeToFlightEvents(flightObj);

		if (flightObj.isEmergency) {
			this.setEmergencyStatusByFlight(flightObj);
			if (this._emergenciesQueue.size === 0 && this.isLegAvailable(this._legs[LEGS.Enter]))
				this.moveFlight(flightObj, this._legs[LEGS.Enter]);
			else
				this.addFlightToQueue(QueueType.Emergencies, flightObj);
		}
		else {
			if (this._arrivalsQueue.size === 0 && this.isLegAvailable(this._legs[LEGS.Enter]))
				this.moveFlight(flightObj, this._legs[LEGS.Enter]);
			else
				this.addFlightToQueue(QueueType.Arrivals, flightObj);
		}

		return flightObj;
	}

	// Creates a NEW departing flight and starts handling it
	private addDepartingFlight(flight: IDepartingFlight): DepartingFlight {
		let flightObj = DepartingFlight.createNew(flight);
		this.subscribeToFlightEvents(flightObj);

		if (this._departuresQueue.size === 0 && this.isTerminalOpenForDepartures())
			// this.moveFlight(flightObj, this._terminalLegs.find(leg => this.isLegAvailable(leg)));
			this.moveFlight(flightObj, this._terminalLegsReversed.find(leg => this.isLegAvailable(leg)));
		else
			this.addFlightToQueue(QueueType.Departures, flightObj);

		return flightObj;
	}

	private async addFlightToQueue(queueType: QueueType, flight: Flight, isRestored: boolean = false): Promise<void> {
		let queue = this.getQueueByQueueType(queueType);
		let array = this.getArrayByQueueType(queueType);

		queue.set(flight.flightCode, flight);
		array.push(flight);

		if (isRestored)
			return;

		if (queueType !== QueueType.Emergencies) {
			await this._dataService.create(this.DBCollectionFromQueueType(queueType), flight.getObject())
				.catch(err => {
					/* TODO: save record to a local file and sync later */
					console.error(`Could not add flight ${flight.flightCode} to storage.\nError: ${err}\n`);
				});
		}

		let transmission = this.createTransmission(
			flight.flightCode, `You were added to ${queueType} queue`, ReplyCode.Standby, flight.getObject());
		this.sendMessage(OutgoingMessageType.Direction, transmission);
	}

	private deleteFlightFromQueue(queueType: QueueType, flight: Flight, isForeignQueue: boolean = false): void {
		let queue = this.getQueueByQueueType(queueType);
		let array = this.getArrayByQueueType(queueType);

		queue.delete(flight.flightCode);

		if (queueType !== QueueType.Emergencies) {
			this._dataService.delete(this.DBCollectionFromQueueType(queueType), { flightCode: flight.flightCode })
				.catch(err => {
					/* TODO: save deleted record to a local file and sync later */
					console.error(`Could not delete flight ${flight.flightCode} from ${queueType} collection.\nError: ${err}\n`);
				});
		}

		DOMUtils.removeContextMenu(flight.flightCode);

		// Using setTimeout in order not to wait for array processing
		setTimeout(() => {
			if (queue.size === 0)
				array.splice(0);
			else if (isForeignQueue) {
				let index = array.indexOf(flight);
				if (index > -1) {
					array.splice(index, 1);
				}
			}
			else
				array.shift();
		}, 0);
	}

	private getQueueByQueueType(queueType: QueueType): Map<string, Flight> {
		switch (queueType) {
			case QueueType.Arrivals:
				return this._arrivalsQueue;
			case QueueType.Departures:
				return this._departuresQueue;
			case QueueType.Emergencies:
				return this._emergenciesQueue;
			default:
				return undefined;
		}
	}

	private getArrayByQueueType(queueType: QueueType): Readonly<Flight[]> {
		switch (queueType) {
			case QueueType.Arrivals:
				return this.arrivals;
			case QueueType.Departures:
				return this.departures;
			case QueueType.Emergencies:
				return this.emergencies;
			default:
				return undefined;
		}
	}

	private DBCollectionFromQueueType(queueType: QueueType): DBCollection {
		switch (queueType) {
			case QueueType.Arrivals:
				return DBCollection.ArrivalsQueue;
			case QueueType.Departures:
				return DBCollection.DeparturesQueue;
			default:
				break;
		}
	}

	private isFlightInQueue(flight: Flight): boolean {
		return this._arrivalsQueue.has(flight.flightCode)
			|| this._departuresQueue.has(flight.flightCode)
			|| this._emergenciesQueue.has(flight.flightCode);
	}

	private getQueueTypeByFlight(flight: Flight): QueueType | undefined {
		if (this._arrivalsQueue.has(flight.flightCode))
			return QueueType.Arrivals;
		if (this._departuresQueue.has(flight.flightCode))
			return QueueType.Departures;
		if (this._emergenciesQueue.has(flight.flightCode))
			return QueueType.Emergencies;
	}

	private async moveFlight(flight: Flight, toLeg: Leg): Promise<void> {
		let currentLeg = flight.legId ? this._legs[flight.legId] : undefined;
		if (currentLeg)
			currentLeg.state = LegState.MoveDirectionSent;
		// this.setPropertyQuietly(toLeg, 'flight', flight);
		toLeg.flight = flight;
		toLeg.state = LegState.MarkedForSave;
		this.sendMoveDirection(flight, toLeg);
		let response = await flight.moveTo(toLeg, this.getAnimationStory(flight.legId, toLeg._id));
		this.setFlightTransmission(response);
		// Assuming affirmative response
		toLeg.state = LegState.Saved;
		if (currentLeg) {
			currentLeg.state = LegState.MoveConfirmed;
			currentLeg.flight = null;
		}
	}

	private async moveFlightFromQueue(queueType: QueueType, toLeg: Leg, flight?: Flight): Promise<void> {
		if (!flight)
			flight = this.getQueueByQueueType(queueType).values().next().value;
		await this.moveFlight(flight, toLeg);
		this.deleteFlightFromQueue(queueType, flight);
		// Emergency flights exist on both arrivals & emergency queues
		if (queueType === QueueType.Emergencies)
			this.deleteFlightFromQueue(QueueType.Arrivals, flight, true);
	}

	private async endInteraction(flight: Flight): Promise<void> {
		let legId = flight.legId;
		let msg = flight.legId === LEGS.Exit ? 'Have a good flight! :)' : 'Have a nice stay! :)';
		this.setTowerTransmission(this.createTransmission(flight.flightCode, msg));
		this._legs[flight.legId].state = LegState.MoveDirectionSent;
		let response = await flight.endInteraction(this.getAnimationStory(flight.legId, null));
		this.setFlightTransmission(response);
		this._legs[legId].state = LegState.MoveConfirmed;
		this._legs[legId].flight = null;
	}

	private sendMoveDirection(flight: Flight, toLeg: Leg): void {
		let transmission = this.createTransmission(
			flight.flightCode, this.composeFlightMoveMessage(flight, toLeg), ReplyCode.Over,
			flight.legId ? undefined : flight.getObject());
		if (flight.legId)
			this.setTowerTransmission(transmission);
		else
			this.sendMessage(OutgoingMessageType.Direction, transmission);
	}

	private composeFlightMoveMessage(flight: Flight, toLeg: Leg): string {
		if (toLeg.type === LegType.Runaway && Flight.isArrivingFlight(flight))
			return `Permission to land on runaway no. ${toLeg._id}`;
		else if (toLeg.type === LegType.Exit)
			return `Permission to takeoff from runaway no. ${flight.legId}`;
		else
			return `Move to leg no. ${toLeg._id} (${toLeg.type})`;
	}

	// Sets OR cancels emergency by flight
	private setEmergencyStatusByFlight(flight: Flight): void {
		if (flight.isEmergency) {
			this._isEmergency = true;
		}
		else if (this._emergenciesQueue.size === 0
			&& !this._legs.find(leg => leg.flight && leg.flight.isEmergency)) {
			this._isEmergency = false;
		}

		let msg = `Emergency has been ${flight.isEmergency ? 'declared' : 'canceled'} by flight ${flight.flightCode}.`;
		if (!flight.isEmergency)
			msg += ` Airport status is ${this._isEmergency ? 'still Emergency' : 'back to Normal'}`;
		this.sendMessage(OutgoingMessageType.Emergency, this.createTransmission('Attention all flights', msg));
	}

	private subscribeToLegsAndFlightsEvents(): void {
		for (let index = 1; index <= LEGS_COUNT; index++) {
			this._legs[index].propertyChanged.subscribe(args =>
				this.leg_propertyChanged(this._legs[index], args));
			if (this._legs[index].flight)
				this.subscribeToFlightEvents(this._legs[index].flight);
		}
	}

	private subscribeToFlightEvents(flight: Flight): void {
		let subscription = (<Flight>flight).propertyChanged.subscribe(
			args => this.flight_propertyChanged(flight, args)
		);

		// save subscription to allow unsubscribing later
		let flight_subscriptions = this._flightEventsSubscriptions.get(flight.flightCode);
		if (flight_subscriptions)
			flight_subscriptions.push(subscription);
		else
			this._flightEventsSubscriptions.set(flight.flightCode, [subscription]);
	}

	private unsubscribeFromFlightEvents(flight: Flight): void {
		if (this._flightEventsSubscriptions.has(flight.flightCode)) {
			this._flightEventsSubscriptions.get(flight.flightCode).forEach(
				subscription => subscription.unsubscribe()
			);
			this._flightEventsSubscriptions.delete(flight.flightCode);
		}
	}

	// Used to restore flight data when loading backup from storage
	private restoreQueueFlight(flight: IFlight, queueType: QueueType): void {
		let flightObj: Flight;

		switch (queueType) {
			case QueueType.Arrivals:
				flightObj = ArrivingFlight.createNew(flight as IArrivingFlight);
				break;
			case QueueType.Departures:
				flightObj = DepartingFlight.createNew(flight as IDepartingFlight);
				break;
			default:
				break;
		}

		this._allFlights.set(flight.flightCode, flightObj);
		this.addFlightToQueue(queueType, flightObj, true);
		this.subscribeToFlightEvents(flightObj);
	}

	// Used to restore leg data when loading backup storage.
	// The function assumes that leg events are not yet subscribed.
	private restoreLeg(leg: ILeg): void {
		let legObject = this._legs[leg._id];

		legObject.restore(leg);

		switch (legObject.state) {
			case LegState.MoveDirectionSent:
				// this.setPropertyQuietly(legObject, 'state', LegState.Occupied);
				legObject.state = LegState.Occupied;
				break;
			case LegState.MarkedForSave:
				let precedingLegId = this.getPrecedingLegId(legObject);
				if (precedingLegId || this.isFlightInQueue(legObject.flight)) {
					if (precedingLegId)
						this._legs[precedingLegId].flight = legObject.flight;
					// this.setPropertyQuietly(legObject, 'flight', null);
					// this.setPropertyQuietly(legObject, 'state', LegState.Unoccupied);
					legObject.flight = null;
					legObject.state = LegState.Unoccupied;
				}
				else {
					this.moveFlight(legObject.flight, legObject);
				}
				break;
			case LegState.Saved:
				if (!leg.isClosed) {
					// this.setPropertyQuietly(legObject.flight, 'legId', legObject._id);
					// this.setPropertyQuietly(legObject, 'state', LegState.Occupied);
					legObject.flight.legId = legObject._id;
					legObject.state = LegState.Occupied;
				}
				else {
					this.moveFlight(legObject.flight, legObject);
				}
				break;
		}
	}

	// The function assumes that leg accompanies a flight
	private getPrecedingLegId(leg: Leg/* , legState: LegState */): number {
		if (leg.type === LegType.Enter
			|| (leg.type === LegType.Terminal && Flight.isDepartingFlight(leg.flight)))
			return null;

		if (leg.type === LegType.Runaway && Flight.isDepartingFlight(leg.flight))
			return LEGS.Departures;

		if (leg.type === LegType.Terminal /* => Flight.isArrivingFlight(leg.flight) */)
			return LEGS.Arrivals;

		if (leg.type === LegType.Departures) {
			/* if (legState === LegState.Occupied)
				return this._terminalLegsReversed.find(tleg =>
					[LegState.Unoccupied, LegState.MoveConfirmed].includes(tleg.state))._id;
			else { */
			let precedingLeg: Leg;
			if (precedingLeg = this._terminalLegsReversed.find(tleg => tleg.flight === leg.flight))
				return precedingLeg._id;
			else if (precedingLeg = this._terminalLegsReversed.find(tleg =>
				tleg.flight && Flight.isDepartingFlight(tleg.flight)
				&& [LegState.MarkedForSave, LegState.Saved].includes(tleg.state)))
				return precedingLeg._id;
			else if (precedingLeg = this._terminalLegsReversed.find(tleg => tleg.state === LegState.Unoccupied))
				return precedingLeg._id;
			else if (precedingLeg = this._terminalLegsReversed.find(tleg =>
				tleg.flight && Flight.isDepartingFlight(tleg.flight)))
				return precedingLeg._id;
			else if (precedingLeg = this._terminalLegsReversed.find(tleg =>
				[LegState.MarkedForSave, LegState.Saved].includes(tleg.state)))
				return precedingLeg._id;
			else if (precedingLeg = this._terminalLegsReversed.find(tleg => tleg.flight === null))
				return precedingLeg._id;
			else
				return this._terminalLegsReversed[0]._id;
			// }
		}

		if (leg.type === LegType.Exit)
			return LEGS.Runaway;

		return leg._id - 1;
	}

	// WARNING: Property is accessed by a string
	private setPropertyQuietly(object: Flight | Leg, propName: string, value: any): void {
		object.disablePropertyChanged();
		object[propName] = value;
		object.enablePropertyChanged();
	}

	private isLegAvailable(leg: ILeg): boolean {
		if (leg.isClosed)
			return false;

		switch (SettingsComponent.safetyMode) {
			case SafetyMode.Pessimistic:
				return leg.state === LegState.Unoccupied;
			case SafetyMode.Optimistic:
				return leg.state === LegState.Unoccupied
					|| (leg.state === LegState.MoveConfirmed && leg.type !== LegType.Runaway || this._isEmergency);
			case SafetyMode.Risky:
				// return leg.state === LegState.Unoccupied || leg.state === LegState.MoveConfirmed;
				return this._availableLegStates.includes(leg.state);
			default:
				return leg.state === LegState.Unoccupied;
		}
	}

	private sendMessage(message: OutgoingMessageType, transmission?: ITransmission): void {
		if (transmission)
			this.setTowerTransmission(transmission);
		this._socketService.send(message, transmission);
	}

	// Creates a transmission from control tower
	private createTransmission(to: string, message: string, replyCode: ReplyCode = ReplyCode.Out, data?: IFlight): Transmission {
		return new Transmission(CONTROL_TOWER, to, message, replyCode, data);
	}

	private setFlightTransmission(transmission: Transmission): void {
		this._flightTransmission = Transmission.format(transmission);
		console.log(`${this._flightTransmission.header} ${this._flightTransmission.body}\n`);
	}

	private setTowerTransmission(transmission: Transmission): void {
		this._towerTransmission = Transmission.format(transmission);
		console.log(`${this._towerTransmission.header} ${this._towerTransmission.body}\n`);
	}

	private getAnimationStory(fromLeg: number, toLeg: number): IAnimationStory {
		let animationStory: IAnimationStory;

		if (!fromLeg)
			animationStory = this._animationStories.get(`leg${toLeg}start`);
		else if (!toLeg)
			animationStory = this._animationStories.get(`leg${fromLeg}end`);
		else
			animationStory = this._animationStories.get(`leg${fromLeg}to${toLeg}`);

		let storyDurationRange = SettingsComponent.getStoryDurationRange(animationStory.title);
		animationStory.duration = Utils.getRandomInt(storyDurationRange.min, storyDurationRange.max);

		return animationStory;
	}

	private getLegTypeByLegId(id: number): LegType {
		if (LEGS.Terminal.includes(id))
			return LegType.Terminal;

		switch (id) {
			case LEGS.Enter:
				return LegType.Enter;
			case LEGS.PreLanding:
				return LegType.PreLanding;
			case LEGS.Landing:
				return LegType.Landing;
			case LEGS.Runaway:
				return LegType.Runaway;
			case LEGS.Arrivals:
				return LegType.Arrivals;
			case LEGS.Departures:
				return LegType.Departures;
			case LEGS.Exit:
				return LegType.Exit;
			default:
				break;
		}
	}

	private addLog(obj: Flight | Leg): void {
		this._dataService.create(DBCollection.Log, obj.getObject())
			.catch(err => console.error(`Cannot add log data for:\n${JSON.stringify(obj.getObject())}.\nError: ${err}.\nData will be saved to a local file.\n`));
	}

	private addFlightLog(flight: Flight): void {
		this._dataService.create(DBCollection.FlightLog, flight.getObject())
			.catch(err => console.error(`Cannot add log data for:\n${JSON.stringify(flight.getObject())}.\nError: ${err}.\nData will be saved to a local file.\n`));
	}

	private initAnimationStories(): void {

		let storyTitle: string;
		let frames: IAnimationFrame[];

		//#region Helper Functions
		let attr = (name: string, value: any): IAttribute => {
			return { name: name, value: value };
		};

		let flight = (pathId: string | number) => {
			return this._airportMap.getElementById(`flight${pathId}`);
		};

		let path = (pathId: string) => this._airportMap.getElementById(`path${pathId}`);

		let story = (pathId: string) => `leg${pathId}`;

		let duration = (storyTitle: string) => SettingsComponent.getStoryDurationRange(storyTitle).min;

		let fadeIn = (element: HTMLElement): IAttribute[] => [
			attr('begin', anim => { element.style.opacity = '0'; element.style.display = ''; }),
			attr('update', anim => element.style.opacity = (anim.progress / 100).toString())
		];

		let fadeOut = (element: HTMLElement): IAttribute[] => [
			attr('opacity', '0'),
			attr('complete', anim => { element.style.display = 'none'; element.style.opacity = '1'; })
		];
		//#endregion Helper Functions

		// Leg 1 start
		storyTitle = story('1start');
		let flight1start = flight('1start');
		frames = [{ path: path('1start'), attributes: fadeIn(flight1start) }];
		this._animationStories.set(storyTitle, { title: storyTitle, startElement: flight1start, frames: frames, duration: duration(storyTitle) });

		// Leg 1 to Leg 2
		storyTitle = story('1to2');
		let flight1to2 = flight('1to2');
		frames = [{ path: path('1to2'), element: flight1to2 }];
		this._animationStories.set(storyTitle, { title: storyTitle, startElement: flight1start, frames: frames, duration: duration(storyTitle) });

		// Leg 2 to Leg 3
		storyTitle = story('2to3');
		let flight2to3 = flight('2to3');
		frames = [{ path: path('2to3'), element: flight2to3 }];
		this._animationStories.set(storyTitle, { title: storyTitle, startElement: flight1to2, frames: frames, duration: duration(storyTitle) });

		// Leg 3 to Leg 4
		storyTitle = story('3to4');
		let flight3to4 = flight('3to4');
		frames = [{ path: path('3to4'), element: flight3to4, attributes: [attr('easing', 'easeOutSine')] }];
		this._animationStories.set(storyTitle, { title: storyTitle, startElement: flight2to3, frames: frames, duration: duration(storyTitle) });

		// Leg 4 to Leg 5
		storyTitle = story('4to5');
		let flight4to4A = flight('4to4A');
		let flight4Ato5 = flight('4Ato5');
		frames = [
			{ path: path('4to4A'), element: flight4to4A },
			{ element: flight4Ato5 },
			{ path: path('4Ato5') }
		];
		this._animationStories.set(storyTitle, { title: storyTitle, startElement: flight3to4, frames: frames, duration: duration(storyTitle) });

		// Leg 5 to Leg 6
		storyTitle = story('5to6');
		let flight5to5A = flight('5to5A');
		let flight5Ato6A = flight('5Ato6A');
		let flight6Ato6 = flight('6Ato6');
		frames = [
			{ path: path('5to5A'), element: flight5to5A },
			{ element: flight5Ato6A },
			{ path: path('5Ato6A') },
			{ element: flight6Ato6 },
			{ path: path('6Ato6') }
		];
		this._animationStories.set(storyTitle, { title: storyTitle, startElement: flight4Ato5, frames: frames, duration: duration(storyTitle) });

		// Leg 6 end
		storyTitle = story('6end');
		let flight6end = flight('6end');
		frames = [{ path: path('6end'), element: flight6end, attributes: fadeOut(flight6end) }];
		this._animationStories.set(storyTitle, { title: storyTitle, startElement: flight6Ato6, frames: frames, duration: duration(storyTitle) });

		// Leg 5 to Leg 7
		storyTitle = story('5to7');
		let flight5Ato7A = flight('5Ato7A');
		let flight7Ato7 = flight('7Ato7');
		frames = [
			{ path: path('5to5A'), element: flight5to5A },
			{ element: flight5Ato7A },
			{ path: path('5Ato7A'), durationPercent: 50 },
			{ element: flight7Ato7 },
			{ path: path('7Ato7') }
		];
		this._animationStories.set(storyTitle, { title: storyTitle, startElement: flight4Ato5, frames: frames, duration: duration(storyTitle) });

		// Leg 7 end
		storyTitle = story('7end');
		let flight7end = flight('7end');
		frames = [{ path: path('7end'), element: flight7end, attributes: fadeOut(flight7end) }];
		this._animationStories.set(storyTitle, { title: storyTitle, startElement: flight7Ato7, frames: frames, duration: duration(storyTitle) });

		// Leg 6 start
		storyTitle = story('6start');
		let flight6start = flight('6start');
		frames = [{ path: path('6start'), attributes: fadeIn(flight6start) }];
		this._animationStories.set(storyTitle, { title: storyTitle, startElement: flight6start, frames: frames, duration: duration(storyTitle) });

		// Leg 6 to Leg 8
		storyTitle = story('6to8');
		let flight6to6A = flight('6to6A');
		let flight6Ato7B = flight('6Ato7B');
		let flight7Bto8 = flight('7Bto8');
		frames = [
			{ path: path('6to6A'), element: flight6to6A },
			{ element: flight6Ato7B },
			{ path: path('6Ato7B'), durationPercent: 40 },
			{ element: flight7Bto8 },
			{ path: path('7Bto8') }
		];
		this._animationStories.set(storyTitle, { title: storyTitle, startElement: flight6start, frames: frames, duration: duration(storyTitle) });

		// Leg 7 start
		storyTitle = story('7start');
		let flight7start = flight('7start');
		frames = [{ path: path('7start'), attributes: fadeIn(flight7start) }];
		this._animationStories.set(storyTitle, { title: storyTitle, startElement: flight7start, frames: frames, duration: duration(storyTitle) });

		// Leg 7 to Leg 8
		storyTitle = story('7to8');
		let flight7to7A = flight('7to7A');
		let flight7Ato7B = flight('7Ato7B');
		frames = [
			{ path: path('7to7A'), element: flight7to7A },
			{ element: flight7Ato7B },
			{ path: path('7Ato7B') },
			{ element: flight7Bto8 },
			{ path: path('7Bto8') }
		];
		this._animationStories.set(storyTitle, { title: storyTitle, startElement: flight7start, frames: frames, duration: duration(storyTitle) });

		// Leg 8 to Leg 4
		storyTitle = story('8to4');
		let flight8to8A = flight('8to8A');
		let flight8Ato4 = flight('8Ato4');
		frames = [
			{ path: path('8to8A'), element: flight8to8A },
			{ element: flight8Ato4 },
			{ path: path('8Ato4') }
		];
		this._animationStories.set(storyTitle, { title: storyTitle, startElement: flight7Bto8, frames: frames, duration: duration(storyTitle) });

		// Leg 4 to Leg 9
		storyTitle = story('4to9');
		let flight4to9 = flight('4to9');
		frames = [{ path: path('4to9'), element: flight4to9, attributes: [attr('easing', 'easeInSine')] }];
		this._animationStories.set(storyTitle, { title: storyTitle, startElement: flight8Ato4, frames: frames, duration: duration(storyTitle) });

		// Leg 9 out
		storyTitle = story('9end');
		let flight9end = flight('9end');
		frames = [{ path: path('9end'), element: flight9end, attributes: fadeOut(flight9end) }];
		this._animationStories.set(storyTitle, { title: storyTitle, startElement: flight4to9, frames: frames, duration: duration(storyTitle) });
	}

	private initContextMenues(): void {
		this.initLegsContextMenu();
		this.initFlightsContextMenu();
	}

	private initLegsContextMenu(): void {
		let self = this;

		($(this._airportMap) as any).contextMenu({
			selector: this._legs.slice(1).map(leg => `#leg${leg._id}`).join(','),
			callback: function (key: any, options: any): void {
				let element = $(this)[0];
				let legId = element.id.replace('leg', '');
				switch (key) {
					case 'closeLeg':
					case 'openLeg':
						self._legs[legId].isClosed = !self._legs[legId].isClosed;
						$(element).find(`#barrier${legId}`)[0].style.display =
							self._legs[legId].isClosed ? '' : 'none';
						break;
					default:
						break;
				}
			},
			items: {
				'closeLeg': {
					name: 'Close Leg', icon: 'fa-ban',
					visible: function (key: any, options: any): boolean {
						let legId = ($(this)[0].id).replace('leg', '');
						return !self._legs[legId].isClosed;
					}
				},
				'openLeg': {
					name: 'Open Leg', icon: 'fa-road',
					visible: function (key: any, options: any): boolean {
						let legId = ($(this)[0].id).replace('leg', '');
						return self._legs[legId].isClosed;
					}
				}
			},
			position: function (opt: any, x: any, y: any): void {
				let parentOffset = $('#map').offset();
				opt.$menu.css({ top: y + parentOffset.top, left: x + parentOffset.left });
			}
		});
	}

	private initFlightsContextMenu(): void {
		let storyElements = Array.from(this._animationStories.values())
			.map(story => story.startElement)
			.filter((val, index, arr) => arr.indexOf(val) === index);

		let frameElements = Array.from(this._animationStories.values())
			.map(story => story.frames)
			.reduce((acc, cur) => acc.concat(cur), [])
			.map(frame => frame.element)
			.filter((val, index, arr) => val && arr.indexOf(val) === index);

		let allElements = storyElements.concat(frameElements)
			.filter((val, index, arr) => arr.indexOf(val) === index);

		allElements
			// Remove the following line to add contect menu to ALL flight elements
			.filter(element => element.id.includes('1') || element.id.includes('2'))
			.forEach(element => this.initFlightElementContextMenu(element));
	}

	private initFlightElementContextMenu(element: HTMLElement): void {
		let self = this;

		($(element.parentElement) as any).contextMenu({
			selector: `#${element.id}`,
			callback: function (key: any, options: any): void {
				let element = $(this);
				let flightCode = element.find('[id^="flightCode"]')[0].innerHTML;
				let leg = self._legs.find(leg => leg.flight && leg.flight.flightCode === flightCode);
				if (leg) {
					switch (key) {
						case 'setEmergency':
						case 'cancelEmergency':
							leg.flight.isEmergency = !leg.flight.isEmergency;
							let warningSign = element.find('[id^="warning"]')[0];
							warningSign.style.display = leg.flight.isEmergency ? '' : 'none';
							break;
						default:
							break;
					}
				}
			},
			items: {
				'setEmergency': {
					name: SET_EMERGENCY, icon: 'fa-exclamation-triangle',
					visible: function (key: any, options: any): boolean {
						let flightCode = $(this).find('[id^="flightCode"]')[0].innerHTML;
						let flight = self._allFlights.get(flightCode);
						return [LEGS.Enter, LEGS.PreLanding, LEGS.Landing].includes(flight.legId) && !flight.isEmergency;
					}
				},
				'cancelEmergency': {
					name: CANCEL_EMERGENCY, icon: 'fa-thumbs-o-up',
					visible: function (key: any, options: any): boolean {
						let flightCode = $(this).find('[id^="flightCode"]')[0].innerHTML;
						let flight = self._allFlights.get(flightCode);
						return flight.isEmergency;
					}
				}
			},
			position: function (opt: any, x: any, y: any): void {
				let parentOffset = $('#map').offset();
				opt.$menu.css({ top: y + parentOffset.top, left: x + parentOffset.left });
			}
		});
	}

	onQueueFlightContextMenu(event: MouseEvent): void {
		let self = this;
		let target = event.target as Element;
		($(target.parentElement) as any).contextMenu({
			selector: `[id='${target.id}']`,
			build: function ($trigger: JQuery, e: Event): any {
				return {
					callback: function (key: any, options: any): void {
						let element = $(this)[0];
						let flight = self._allFlights.get(element.id);
						flight.isEmergency = !flight.isEmergency;
					},
					items: {
						'setEmergency': {
							name: SET_EMERGENCY, icon: 'fa-exclamation-triangle',
							visible: function (key: any, options: any): boolean {
								let flightCode = ($(this)[0].id);
								return !self._allFlights.get(flightCode).isEmergency;
							}
						},
						'cancelEmergency': {
							name: CANCEL_EMERGENCY, icon: 'fa-thumbs-o-up',
							visible: function (key: any, options: any): boolean {
								let flightCode = ($(this)[0].id);
								return self._allFlights.get(flightCode).isEmergency;
							}
						}
					}
				};
			}
		});
	}
	//#endregion Helper Methods
}
