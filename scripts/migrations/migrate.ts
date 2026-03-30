import { intializeDbConnection } from '../../src/config/db/connect';
import mongoose from 'mongoose';
import logger from '../../src/shared/logger/logger';
import User from '../../src/shared/models/models.user';
import Settings from '../../src/shared/models/models.settings';

const runMigrations = async () => {
  try {
    logger.info('Identifying orphaned settings...');

    // 1. Find all Settings that do not have a corresponding User
    const orphanedSettings = await Settings.aggregate([
      {
        $lookup: {
          from: 'users', // The name of the User collection in MongoDB
          localField: 'userId',
          foreignField: '_id',
          as: 'user_info',
        },
      },
      {
        $match: {
          user_info: { $size: 0 }, // Filter for records where no user was found
        },
      },
      {
        $project: { _id: 1 }, // We only need the ID for deletion
      },
    ]);

    const orphanedIds = orphanedSettings.map((doc) => doc._id);

    if (orphanedIds.length > 0) {
      logger.info(`Found ${orphanedIds.length} orphaned settings. Deleting...`);

      // 2. Delete the orphaned records
      const result = await Settings.deleteMany({
        _id: { $in: orphanedIds },
      });

      logger.info(
        `Successfully deleted ${result.deletedCount} orphaned settings.`,
      );
    } else {
      logger.info('No orphaned settings found. Database is clean.');
    }
  } catch (e) {
    if (e instanceof Error) {
      logger.error(`Error during migration execution: ${e.message}`);
    } else {
      console.error('Unknown error during migration execution:', e);
    }
    throw e; // Re-throw to be caught by the outer .catch()
  }
};

intializeDbConnection()
  .then(() => {
    return runMigrations();
  })
  .then(() => {
    logger.info('Migrations completed successfully.');
  })
  .catch((err) => {
    logger.error('Error occurred while running migrations.', err);
  })
  .finally(() => {
    mongoose.connection.close();
    logger.info('[MongoDB] Connection closed.');
  });
