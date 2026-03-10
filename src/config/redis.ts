import { redisCacher } from './redis/redisCacher';
import { redisPublisher } from './redis/redisPublisher';
import { redisSubscriber } from './redis/redisSubscriber';

import { initializeSubscribers } from '../events/subscribers';
import { log } from '../shared/logger/logger';

export const initializeRedis = async (): Promise<void> => {
  await Promise.all([
    redisCacher.connect(),
    redisPublisher.connect(),
    redisSubscriber.connect(),
  ]);
  log('[Redis] All clients connected', 'success');

  await initializeSubscribers();
};
