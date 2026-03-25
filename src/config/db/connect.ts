import mongoose from 'mongoose';
import 'dotenv/config';
import logger from '../../shared/logger/logger';
let isConnected = false;

export const intializeDbConnection = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGO_URI as string, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    logger.info('[MongoDB] connected');
  } catch (err) {
    logger.error(`[MongoDB] Initial connection failed: ${err}`);

    setTimeout(intializeDbConnection, 5000);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('[MongoDB] disconnected. Reconnecting...');
  isConnected = false;
  setTimeout(intializeDbConnection, 5000);
});

mongoose.connection.on('error', (err) => {
  logger.error(`[MongoDB] runtime error: ${err}`);
});
