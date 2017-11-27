"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
exports.rangeSchema = new mongoose_1.Schema({
    min: Number,
    max: Number
}, { _id: false });
//# sourceMappingURL=schemas.js.map