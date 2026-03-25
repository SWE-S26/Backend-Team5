import { intializeDbConnection } from '../../src/config/db/connect';
import mongoose from 'mongoose';
import logger from '../../src/shared/logger/logger';

const runMigrations = async () => {
  try {
    logger.info('Database connection established. Running migrations...');
  } catch (e) {
    logger.error('Failed to establish database connection.');
  }
};

intializeDbConnection()
  .then(() => {
    runMigrations();
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
