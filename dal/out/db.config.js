"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
/*
*   Database connection to mongoDB
*/
mongoose.Promise = global.Promise;
exports.connectMongoDB = () => {
    return mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/flight-control', { useMongoClient: true }, (err) => {
        if (err) {
            console.log('Failed to connect to DB');
        }
        else {
            console.log('Successfully connected to MongoDB');
        }
    });
};
//# sourceMappingURL=db.config.js.map