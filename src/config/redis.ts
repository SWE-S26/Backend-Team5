import { redisCacher } from './redis/redisCacher';
import { redisPublisher } from './redis/redisPublisher';
import { redisSubscriber } from './redis/redisSubscriber';

import { initializeSubscribers } from '../events/subscribers';

export const initializeRedis = async (): Promise<void> => {
  await Promise.all([
    redisCacher.connect(),
    redisPublisher.connect(),
    redisSubscriber.connect(),
  ]);
  console.log('[Redis] All clients connected');

  await initializeSubscribers();
};
