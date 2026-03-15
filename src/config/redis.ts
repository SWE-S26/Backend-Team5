import { redisCacher } from '../shared/abstractions/redis/redisCacher';
import { redisPublisher } from '../shared/abstractions/redis/redisPublisher';
import { redisSubscriber } from '../shared/abstractions/redis/redisSubscriber';

import { initializeSubscribers } from '../events/subscribers';
import logger from '../shared/logger/logger';

export const initializeRedis = async (): Promise<void> => {
  await Promise.all([
    redisCacher.connect(),
    redisPublisher.connect(),
    redisSubscriber.connect(),
  ]);
  logger.info('[Redis] All clients connected');

  await initializeSubscribers();
};
