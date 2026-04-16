import 'dotenv/config';
import { initializeDbConnection } from './connect';
import { initializeRedis } from './redis';
import logger from '../shared/logger/logger';

export const initializeConfig = async (): Promise<void> => {
  await initializeDbConnection();

  try {
    if (process.env.USE_REDIS === 'TRUE') {
      await initializeRedis();
      logger.info('[Config] Redis initialized');
    } else {
      logger.warn('[Config] Redis skipped');
    }
  } catch (error) {
    logger.error({ error }, '[Config] Failed to initialize Redis:');
  }

  logger.info('[Config] All services initialized');
};
