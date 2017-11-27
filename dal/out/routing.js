"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
class Routing {
    constructor(_collection) {
        this._collection = _collection;
        this.router = express_1.Router()
            .get('/', (req, res) => {
            this._collection.getAll(res, req.query, req.body);
        })
            .get('/:id', (req, res) => {
            this._collection.getOne(res, req.params.id);
        })
            .post('/', (req, res) => {
            this._collection.create(res, req.body);
        })
            .put('/', (req, res) => {
            this._collection.update(res, req.query, req.body);
        })
            .delete('/', (req, res) => {
            this._collection.delete(res, req.query);
        });
    }
}
exports.default = Routing;
//# sourceMappingURL=routing.js.map