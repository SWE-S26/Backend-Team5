import { createClient, RedisClientType } from 'redis';
import logger from '../../logger/logger';

class RedisCacher {
  private static instance: RedisCacher;
  private client: RedisClientType;
  private isConnected = false;

  private constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10)
            return new Error('RedisCacher: max retries exceeded');
          return Math.min(retries * 500, 5000);
        },
      },
    }) as RedisClientType;

    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('[RedisCacher] Connected');
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      logger.error('[RedisCacher] Error:', err.message);
    });

    this.client.on('reconnecting', () => {
      this.isConnected = false;
      logger.warn('[RedisCacher] Reconnecting...');
    });
  }

  static getInstance(): RedisCacher {
    if (!RedisCacher.instance) {
      RedisCacher.instance = new RedisCacher();
    }
    return RedisCacher.instance;
  }

  async connect(): Promise<void> {
    if (!this.isConnected) await this.client.connect();
  }

  /**
   * @param key - Key much like maps, Since you are going use it later for getting
   * The way you may strcuture the key should be request-based, after all we are caching
   * to be able to ease the load on the DB, so if there is something defining in the request
   * feel free to cache it, we can't trust the "قدام مصنع الكراسي"/"عبور المنصة"
   * that they are going to cache on their side
   * @param value - Value stored
   * @param ttlSeconds - Time to live in seconds default ~ 15 mins
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 900): Promise<void> {
    const serialized = JSON.stringify(value);
    await this.client.setEx(key, ttlSeconds, serialized);
  }

  /**
   *
   * @param key I hope, you remember it,
   * otherwise you are going to have a bad time trying to get the data back
   * @returns The data you supposedly cached
   */
  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  async delete(...keys: string[]): Promise<void> {
    await this.client.del(keys);
  }

  // Useful for wildcard invalidation e.g. "products:list:*"
  async deleteByPattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) await this.client.del(keys);
  }
}

/**
 * @description Singleton Redis cacher instance for app-wide use
 * Consider this a global map with TTL, it cleans itself automatically if something expires
 * @get When you find a get request, first check if the data exists in this cacher,
 * if it does return it, otherwise fetch from DB and set it in the cacher before returning
 * @delete When there is a post request, invalidate the data in the cacher related to that request,
 * so that the next get request will fetch fresh data from DB and update the cache again
 */
export const redisCacher = RedisCacher.getInstance();
