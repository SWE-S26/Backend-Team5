import { redisCacher } from '../shared/abstractions/redis/redisCacher';

import { initializeSubscribers } from '../events/subscribers';
import logger from '../shared/logger/logger';

export const initializeRedis = async (): Promise<void> => {
  await redisCacher.connect();
  logger.info('[Redis] All clients connected');

  await initializeSubscribers();
};
