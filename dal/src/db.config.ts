import * as mongoose from 'mongoose';

/*
*   Database connection to mongoDB
*/

(<any>mongoose).Promise = global.Promise;

export const connectMongoDB = () => {
	return mongoose.connect(
		process.env.MONGODB_URI || 'mongodb://localhost/flight-control',
		{ useMongoClient: true },
		(err) => {
			if (err) {
				console.log('Failed to connect to DB');
			} else {
				console.log('Successfully connected to MongoDB');
			}
		});
};
