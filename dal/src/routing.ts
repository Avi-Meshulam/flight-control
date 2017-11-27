import { Router } from 'express';
import { IController } from './controllers/IController';

export default class Routing {
	constructor(private _collection: IController) {
	}

	router: Router = Router()
		// get all flight requests
		.get('/', (req, res) => {
			this._collection.getAll(res, req.query, req.body);
		})
		// get a flight request by id
		.get('/:id', (req, res) => {
			this._collection.getOne(res, req.params.id);
		})
		// create a new flight request
		.post('/', (req, res) => {
			this._collection.create(res, req.body);
		})
		// update a flight request
		.put('/', (req, res) => {
			this._collection.update(res, req.query, req.body);
		})
		// delete a flight request
		.delete('/', (req, res) => {
			this._collection.delete(res, req.query);
		});
}
