import 'dotenv/config';
import { intializeDbConnection } from './db';
import { initializeRedis } from './redis';
import logger from '../shared/logger/logger';

export const initializeConfig = async (): Promise<void> => {
  await intializeDbConnection();

  if (process.env.USE_REDIS === 'TRUE') {
    await initializeRedis();
    logger.info('[Config] Redis initialized');
  } else {
    logger.info('[Config] Redis skipped');
  }

  logger.info('[Config] All services initialized');
};
