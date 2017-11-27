"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils = require("../utils");
class MongooseController {
    constructor(_model) {
        this._model = _model;
    }
    // get all documents or only those that math conditions
    getAll(res, conditions = {}, options) {
        let query = this._model.find(conditions);
        if (options && options['sort'])
            query = query.sort(options['sort']);
        query
            .then(docs => res.json(docs))
            .catch(err => res.status(400).json(err));
    }
    // get a document by id
    getOne(res, id) {
        this._model.findOne({ _id: id })
            .then(doc => res.json(doc))
            .catch(err => res.status(400).json(err));
    }
    // create a new document(s)
    create(res, ...docs) {
        this.assignDiscriminators(docs);
        this._model.create(utils.getInnerArray(docs))
            .then(docs => res.json(docs))
            .catch(err => res.status(400).json(err));
    }
    // update the first document that matches conditions
    update(res, conditions, obj) {
        this.assignDiscriminators(obj);
        this._model.findOneAndUpdate(conditions, obj, { upsert: true })
            .then(result => res.json(result))
            .catch(err => res.status(400).json(err));
    }
    // update all documents that match conditions
    updateAll(res, conditions, obj) {
        this.assignDiscriminators(obj);
        this._model.update(conditions, obj, { multi: true, upsert: true, setDefaultsOnInsert: true })
            .then(result => res.json(result))
            .catch(err => res.status(400).json(err));
    }
    // delete the first document that matches conditions
    delete(res, conditions) {
        this._model.findOneAndRemove(conditions)
            .then(result => res.json(result))
            .catch(err => res.status(400).json(err));
    }
    // delete all documents that match conditions
    deleteAll(res, conditions) {
        this._model.remove(conditions)
            .then(result => res.json(result))
            .catch(err => res.status(400).json(err));
    }
    assignDiscriminators(...docs) {
        if (this._model.schema.statics.assignDiscriminators) {
            this._model.schema.statics.assignDiscriminators(docs);
        }
    }
}
exports.default = MongooseController;
//# sourceMappingURL=mongooseController.js.map