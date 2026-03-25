import mongoose from 'mongoose';
import logger from '../../shared/logger/logger';
import 'dotenv/config';

const userSchema = new mongoose.Schema({
  isVerified: Boolean,
  createdAt: Date,
});

const User = mongoose.model('User', userSchema);

async function deleteStaleUnverifiedUsers(): Promise<void> {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const result = await User.deleteMany({
    isVerified: false,
    createdAt: { $lt: threeDaysAgo },
  });

  logger.info(`Deleted ${result.deletedCount} stale unverified users.`);
}

async function connect() {
  try {
    await mongoose.connect(process.env.MONGO_URI as string, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('[MongoDB] connected');
  } catch (err) {
    logger.error(`[MongoDB] Initial connection failed: ${err}`);
  }
}

connect()
  .then(() => deleteStaleUnverifiedUsers())
  .then(() => {
    logger.info('Cleanup completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    logger.error(`Cleanup failed: ${err}`);
    process.exit(1);
  })
  .finally(() => {
    mongoose.connection.close();
  });
