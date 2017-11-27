import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DataServiceBase } from '../../../shared/services/base.data.service';

export enum DBCollection {
	ArrivalsQueue = 'arrivals',
	DeparturesQueue = 'departures',
	Legs = 'legs',
	FlightLog = 'flightLog',
	Log = 'log',
	Settings = 'settings'
}

const baseUrl = 'http://localhost:3000';

@Injectable()
export class DataService extends DataServiceBase {
	constructor(_http: HttpClient) {
		super(_http, baseUrl);
	}
}
