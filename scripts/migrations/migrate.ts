import {
  closeDbConnection,
  initializeDbConnection,
} from '../../src/config/connect';
import mongoose from 'mongoose';
import logger from '../../src/shared/logger/logger';
import { cleanUpDeletedUsers } from './cleanUpDeletedUsersSettings';
import { deleteStaleUnverifiedUsers } from './cleanUpUnverifiedUsers';
import { changeTracksImages } from './changeAudioImages';
import { changeProfileImages } from './changeProfileImages';
// import { cleanUpBelalMess } from './cleanUpBelalMess';
import { backupDatabase } from './backupDb';
import { deleteTracksWithoutDuration } from './cleanUpWithoutDurationTracks';

const runMigrations = async () => {
  try {
    await cleanUpDeletedUsers();
    await deleteStaleUnverifiedUsers();
    await changeTracksImages();
    await changeProfileImages();
    await deleteTracksWithoutDuration();
    // await cleanUpBelalMess();
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
    closeDbConnection();
    logger.info('Migrations completed successfully.');
  })
  .catch((err) => {
    logger.error('Error occurred while running migrations.', err);
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
