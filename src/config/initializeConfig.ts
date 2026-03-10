import 'dotenv/config';
import { intializeDbConnection } from './db';
import { initializeRedis } from './redis';

export const initializeConfig = async (): Promise<void> => {
  await intializeDbConnection();
  // await initializeRedis();
  console.log('[Config] All services initialized');
};
