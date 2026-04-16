import mongoose from 'mongoose';
import 'dotenv/config';
import logger from '../shared/logger/logger';
let isConnected = false;
let isShuttingDown = false;

export const closeDbConnection = () => {
  logger.info(`[MongoDB] Shutting down gracefully, disconnecting...`);
  isShuttingDown = true;
};

export const initializeDbConnection = async () => {
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

    setTimeout(initializeDbConnection, 5000);
  }
};

mongoose.connection.on('disconnected', () => {
  if (isShuttingDown) return;
  logger.warn('[MongoDB] disconnected. Reconnecting...');
  isConnected = false;
  setTimeout(initializeDbConnection, 5000);
});

mongoose.connection.on('error', (err) => {
  logger.error(`[MongoDB] runtime error: ${err}`);
});
