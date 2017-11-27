import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import * as querystring from 'querystring';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/toPromise';
import Utils from '../utils';
import { IDataService } from './IDataService';

const DEFAULT_RETRY_DELAY_TIME: number = 1000;
const DEFAULT_RETRY_ATTEMPTS: number = 5;

export abstract class DataServiceBase implements IDataService {

	constructor(private _http: HttpClient, private _baseUrl: string) {
		if (_baseUrl[_baseUrl.length - 1] === '/') {
			_baseUrl = _baseUrl.substring(0, _baseUrl.length - 2);
		}
	}

	getAll(collection: string, conditions: object = {}): Promise<object[]> {
		return this._http.get<object[]>(`${this._baseUrl}/${collection}${conditions ? `?${querystring.stringify(conditions)}` : ''}`)
			.do(result => console.log(`${result.length} records have been retrieved from collection '${collection}'`))
			.retryWhen(Utils.retryStrategy())
			.toPromise()
			.catch(err => {
				return Promise.reject(err.__zone_symbol__currentTask.target.response);
			});
	}

	getOne(collection: string, id: any): Promise<object> {
		return this._http.get<object>(`${this._baseUrl}/${collection}/${id}`)
			// .do(result => console.log(`getOne: ${JSON.stringify(result)}\n`))
			.retryWhen(Utils.retryStrategy())
			.toPromise()
			.catch(err => {
				return Promise.reject(err.__zone_symbol__currentTask.target.response);
			});
	}

	create(collection: string, item: object): Promise<object> {
		return this._http.post<object>(`${this._baseUrl}/${collection}`, item)
			// .do(result => console.log(`create: ${JSON.stringify(item)}\n`))
			.retryWhen(Utils.retryStrategy())
			.toPromise()
			.catch(err => {
				return Promise.reject(err.__zone_symbol__currentTask.target.response);
			});
	}

	update(collection: string, conditions: object, data: object): Promise<object> {
		return this._http.put<object>(`${this._baseUrl}/${collection}${conditions ? `?${querystring.stringify(conditions)}` : ''}`, data)
			// .do(result => console.log(`update: ${JSON.stringify(result)}\n`))
			.retryWhen(Utils.retryStrategy())
			.toPromise()
			.catch(err => {
				return Promise.reject(err.__zone_symbol__currentTask.target.response);
			});
	}

	delete(collection: string, conditions: object): Promise<object> {
		return this._http.delete<object>(`${this._baseUrl}/${collection}${conditions ? `?${querystring.stringify(conditions)}` : ''}`)
			// .do(result => console.log(`delete: ${JSON.stringify(conditions)}\n`))
			.retryWhen(Utils.retryStrategy())
			.toPromise()
			.catch(err => {
				return Promise.reject(err.__zone_symbol__currentTask.target.response);
			});
	}
}
