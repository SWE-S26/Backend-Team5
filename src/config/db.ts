import mongoose from 'mongoose';
import 'dotenv/config';
let isConnected = false;

export const intializeDbConnection = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGO_URI as string, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log('[MongoDB] connected');
  } catch (err) {
    console.error('[MongoDB] Initial connection failed:', err);

    setTimeout(intializeDbConnection, 5000);
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('[MongoDB] disconnected. Reconnecting...');
  isConnected = false;
  setTimeout(intializeDbConnection, 5000);
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] runtime error:', err);
});
