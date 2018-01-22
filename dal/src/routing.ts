import { Router } from 'express';
import { IController } from './controllers/IController';

export default class Routing {
	constructor(private _collection: IController) {
	}

	router: Router = Router()
		// get all items
		.get('/', (req, res) => {
			this._collection.getAll(res, req.query, req.body);
		})
		// get an item by id
		.get('/:id', (req, res) => {
			this._collection.getOne(res, req.params.id);
		})
		// create a new item
		.post('/', (req, res) => {
			this._collection.create(res, req.body);
		})
		// update an item
		.put('/', (req, res) => {
			this._collection.update(res, req.query, req.body);
		})
		// delete an item
		.delete('/', (req, res) => {
			this._collection.delete(res, req.query);
		});
}
