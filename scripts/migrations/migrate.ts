import { initializeDbConnection } from '../../src/config/db/connect';
import mongoose, { mongo } from 'mongoose';
import logger from '../../src/shared/logger/logger';
import User from '../../src/shared/models/models.user';
import Settings from '../../src/shared/models/models.settings';
import { cleanUpDeletedUsers } from './cleanUpDeletedUsers';
import { deleteStaleUnverifiedUsers } from './cleanUpUnverified';
import { cleanUpTracks } from './cleanupTracks';

const runMigrations = async () => {
  try {
    // await cleanUpDeletedUsers();
    // await deleteStaleUnverifiedUsers();
    await cleanUpTracks();
  } catch (e) {
    if (e instanceof Error) {
      logger.error(`Error during migration execution: ${e.message}`);
    } else {
      logger.error({ error: e }, 'Unknown error during migration execution:');
    }
    throw e;
  }
};

initializeDbConnection()
  .then(() => {
    return runMigrations();
  })
  .then(() => {
    logger.info('Migrations completed successfully.');
  })
  .catch((err) => {
    logger.error('Error occurred while running migrations.', err);
  })
  .finally(async () => {
    await mongoose.connection.close();
    logger.info('[MongoDB] Connection closed.');
  });
