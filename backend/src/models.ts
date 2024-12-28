import mongoose from 'mongoose';
import { logger } from './logging';
import { schemas } from './schemas';


export async function connectToMongo(mongodb: string): Promise<Map<string, any>> {
	// MongoDB Connection
	return mongoose.connect(mongodb)
		.then(() => logger.info("Connected to MongoDB"))
		.catch(err => logger.error("MongoDB connection error:", err))
		// MongoDB Models
		.then(() => {
			return new Map<string, any>(Array.from(schemas,
				([schemaName, schema]) => [schemaName, mongoose.model(schemaName, schema)]));
		});
}

export async function disconnectFromMongo(): Promise<any> {
	return mongoose.disconnect();
}
