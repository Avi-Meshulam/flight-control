import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { Subscription } from 'rxjs/Subscription';
import { CONTROL_TOWER } from './constants';
// import * as data from './data/flights';
import { arrivals, departures } from './data/flights';
import { IArrivingFlight, IDepartingFlight, IFlight } from './models/IFlight';
import { ArrivingFlight, DepartingFlight, Flight } from './models/flight';
import { ReplyCode, Transmission } from './models/transmission';
import { DataService, DBCollection } from './services/data.service';
import Utils from './utils';

type Range = {
	min: number;
	max: number;
};

type Settings = {
	intervalRange: Range;
};

const DEFAULT_MIN_INTERVAL = 10;
const DEFAULT_MAX_INTERVAL = 1000;

// const arrivals = data.arrivals;
// const departures = data.departures;

export class Simulator {

	private _arrivals: Map<string, IArrivingFlight> = new Map<string, IArrivingFlight>();
	private _departures: Map<string, IDepartingFlight> = new Map<string, IDepartingFlight>();
	private _arrivalsSubscription: Subscription;
	private _departuresSubscription: Subscription;


	private readonly _intervalRange: Range = { min: DEFAULT_MIN_INTERVAL, max: DEFAULT_MAX_INTERVAL };
	get intervalRange(): Range {
		return this._intervalRange;
	}
	set intervalRange(value: Range) {
		if (this._intervalRange !== value) {
			this._intervalRange.min = value.min;
			this._intervalRange.max = value.max;
		}
	}
	//#endregion properties

	getTransmissions(): Observable<Transmission> {
		return Observable.create(observer => {
			this._arrivalsSubscription = this.getObservable(DBCollection.Arrivals).subscribe(
				flight => observer.next(this.createTransmission(
					ArrivingFlight.createNew(flight as IArrivingFlight), 'Asking permission to enter airport')),
				err => console.log(err),
				() => observer.complete()
			);

			this._departuresSubscription = this.getObservable(DBCollection.Departures).subscribe(
				flight => observer.next(this.createTransmission(
					DepartingFlight.createNew(flight as IDepartingFlight), 'Ready to depart')),
				err => console.log(err),
				() => observer.complete()
			);
		});
	}

	stop(subscription?: Subscription): void {
		this._arrivalsSubscription.unsubscribe();
		this._departuresSubscription.unsubscribe();
		if (subscription)
			subscription.unsubscribe();
	}

	deleteTransmission(flight: IFlight): void {
		if (this._arrivals.has(flight.flightCode))
			DataService.delete(DBCollection.Arrivals, { flightCode: flight.flightCode })
				.then(() => {
					this._arrivals.delete(flight.flightCode);
					// console.error(`flight ${flight.flightCode} deleted. arrivals size: ${this._arrivals.size}.`);
				})
				.catch(err => console.error(err));
		else
			// if (this._departures.has(flight.flightCode))
			DataService.delete(DBCollection.Departures, { flightCode: flight.flightCode })
				.then(() => {
					this._departures.delete(flight.flightCode);
					// console.error(`flight ${flight.flightCode} deleted. departures size: ${this._departures.size}.`);
				})
				.catch(err => console.error(err));
	}

	applySettings(obj: Settings): void {
		if (!obj) return;
		this._intervalRange.min = obj.intervalRange.min;
		this._intervalRange.max = obj.intervalRange.max;
	}

	private getObservable(collection: DBCollection): Observable<IFlight> {
		return Observable.create(async (observer: Observer<IFlight>) => {
			await this.initData(collection);
			let map = collection === DBCollection.Arrivals ? this._arrivals : this._departures;

			let iterate = async () => {
				for (let [key, value] of map) {
					if (observer.closed)
						return;
					observer.next(value);
					await Utils.delay(Utils.getRandomInt(this._intervalRange.min, this._intervalRange.max));
				}
			};

			while (!observer.closed) {
				while (map.size > 0 && !observer.closed) {
					await iterate();
				}
				if (observer.closed)
					break;
				console.log(`Starting over ${collection}...\n`);
				await this.initData(collection, true);
			}
		});
	}

	// Inits this._arrivals OR this._departures from DB (upon startup) or from memory storage (and update DB)
	private async initData(collection: DBCollection, isRestart: boolean = false): Promise<void> {
		let setData = async (DBData?: any, isDBError = false) => {
			let localData = collection === DBCollection.Arrivals ? arrivals : departures;

			if (DBData.length === 0 && !isDBError)
				await DataService.create(collection, localData)
					.catch(err => console.error(err));

			let flights = DBData.length > 0 ? DBData : localData;

			if (collection === DBCollection.Arrivals)
				flights.forEach(flight => this._arrivals.set(flight.flightCode, flight as IArrivingFlight));
			else
				flights.forEach(flight => this._departures.set(flight.flightCode, flight as IDepartingFlight));
		};

		// if (isRestart)
		// 	await setData(collection);
		// else
		await DataService.getAll(collection)
			.then(async data => await setData(data))
			.catch(async err => {
				console.error(err);
				await setData(null, true);
			});
	}

	private createTransmission(flight: Flight, message: string): Transmission {
		return new Transmission(
			flight.flightCode,
			CONTROL_TOWER,
			message,
			ReplyCode.Over,
			flight
		);
	}

	private getSettingsObject(): Settings {
		return {
			intervalRange: this._intervalRange
		};
	}
}
