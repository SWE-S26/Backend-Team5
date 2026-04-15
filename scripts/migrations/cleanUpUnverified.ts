import mongoose from 'mongoose';
import logger from '../../src/shared/logger/logger';
import 'dotenv/config';
import User from '../../src/shared/models/models.user';

export const deleteStaleUnverifiedUsers = async (): Promise<void> => {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const result = await User.deleteMany({
    isVerified: false,
    createdAt: { $lt: threeDaysAgo },
  });

  logger.info(`Deleted ${result.deletedCount} stale unverified users.`);
};
