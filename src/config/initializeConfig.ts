import 'dotenv/config';
import { intializeDbConnection } from './db';
import { initializeRedis } from './redis';
import { log } from '../shared/logger/logger';

export const initializeConfig = async (): Promise<void> => {
  await intializeDbConnection();
  // await initializeRedis();
  log('[Config] All services initialized', 'success');
};
