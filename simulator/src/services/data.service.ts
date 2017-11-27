import * as querystring from 'querystring';
import * as rd from 'request-debug';
import * as rp from 'request-promise';

export enum DBCollection {
	Arrivals = 'simulatorArrivals',
	Departures = 'simulatorDepartures'
}

const request = rp.defaults({ baseUrl: 'http://localhost:3000', json: true });

// Unmark to get request debug info in stderr
// rd(request);

export class DataService {

	static getAll(collection: string, conditions?: object): rp.RequestPromise {
		return request.get(`${collection}${conditions ? `?${querystring.stringify(conditions)}` : ''}`);
	}

	static getOne(collection: string, id: any): rp.RequestPromise {
		return request.get(`${collection}/${id}`);
	}

	static create(collection: string, ...docs: object[]): rp.RequestPromise {
		return request.post(collection, { body: docs });
	}

	static update(collection: string, conditions: object, data: object): rp.RequestPromise {
		return request.put(`${collection}${conditions ? `?${querystring.stringify(conditions)}` : ''}`, data);
	}

	static delete(collection: string, conditions: object): rp.RequestPromise {
		return request.delete(`${collection}${conditions ? `?${querystring.stringify(conditions)}` : ''}`);
	}
}
