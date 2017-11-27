import { Response } from 'express';
import { Document, Model } from 'mongoose';
import * as utils from '../utils';
import { IController } from './IController';

export default class MongooseController implements IController {

	constructor(private _model: Model<Document>) {
	}

	// get all documents or only those that math conditions
	getAll(res: Response, conditions: object = {}, options?: object): void {
		let query = this._model.find(conditions);

		if (options && options['sort'])
			query = query.sort(options['sort']);

		query
			.then(docs => res.json(docs))
			.catch(err => res.status(400).json(err));
	}

	// get a document by id
	getOne(res: Response, id: number): void {
		this._model.findOne({ _id: id })
			.then(doc => res.json(doc))
			.catch(err => res.status(400).json(err));
	}

	// create a new document(s)
	create(res: Response, ...docs: object[]): void {
		this.assignDiscriminators(docs);
		this._model.create(utils.getInnerArray(docs))
			.then(docs => res.json(docs))
			.catch(err => res.status(400).json(err));
	}

	// update the first document that matches conditions
	update(res: Response, conditions: object, obj: object): void {
		this.assignDiscriminators(obj);
		this._model.findOneAndUpdate(conditions, obj, { upsert: true })
			.then(result => res.json(result))
			.catch(err => res.status(400).json(err));
	}

	// update all documents that match conditions
	updateAll(res: Response, conditions: object, obj: object): void {
		this.assignDiscriminators(obj);
		this._model.update(conditions, obj, { multi: true, upsert: true, setDefaultsOnInsert: true })
			.then(result => res.json(result))
			.catch(err => res.status(400).json(err));
	}

	// delete the first document that matches conditions
	delete(res: Response, conditions: object): void {
		this._model.findOneAndRemove(conditions)
			.then(result => res.json(result))
			.catch(err => res.status(400).json(err));
	}

	// delete all documents that match conditions
	deleteAll(res: Response, conditions: object): void {
		this._model.remove(conditions)
			.then(result => res.json(result))
			.catch(err => res.status(400).json(err));
	}

	private assignDiscriminators(...docs: object[]): void {
		if (this._model.schema.statics.assignDiscriminators) {
			this._model.schema.statics.assignDiscriminators(docs);
		}
	}
}
