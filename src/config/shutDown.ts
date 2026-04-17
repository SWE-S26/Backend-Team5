import mongoose from 'mongoose';
import { redisCacher } from '../shared/abstractions/redis/redisCacher';
import logger from '../shared/logger/logger';
import { closeDbConnection } from './connect';

const shutDown = async (signal: NodeJS.Signals) => {
  logger.info(`[Shutdown] Received ${signal}, shutting down gracefully...`);

  closeDbConnection();
  await redisCacher.disconnect();
  await mongoose.connection.close(false);
  process.exit(0);
};

export default shutDown;
