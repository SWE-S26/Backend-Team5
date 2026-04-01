import { redisCacher } from '../shared/abstractions/redis/redisCacher';

export const initializeRedis = async (): Promise<void> => {
  await redisCacher.connect();
};
