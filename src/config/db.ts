import mongoose from 'mongoose';
import 'dotenv/config';
import { log } from '../shared/logger/logger';
let isConnected = false;

export const intializeDbConnection = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGO_URI as string, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    log('[MongoDB] connected', 'success');
  } catch (err) {
    log(`[MongoDB] Initial connection failed: ${err}`, 'error');

    setTimeout(intializeDbConnection, 5000);
  }
};

mongoose.connection.on('disconnected', () => {
  log('[MongoDB] disconnected. Reconnecting...', 'warning');
  isConnected = false;
  setTimeout(intializeDbConnection, 5000);
});

mongoose.connection.on('error', (err) => {
  log(`[MongoDB] runtime error: ${err}`, 'error');
});
