import { createClient, RedisClientType } from 'redis';
import logger from '../../logger/logger';

class RedisCacher {
  private static instance: RedisCacher;
  private client: RedisClientType;
  private isConnected = false;
  private isConnecting = false;

  private constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000, // fail fast if Redis is unreachable on boot
        keepAliveInitialDelay: 10000, // start keepalive after 10s of idle time
        keepAlive: true, // detect dead TCP connections (10s keepalive)
        reconnectStrategy: (retries) => {
          if (retries > 10)
            return new Error('RedisCacher: max retries exceeded');
          return Math.min(retries * 500, 5000);
        },
      },
    }) as RedisClientType;
    this.client.on('ready', () => {
      this.isConnected = true;
      logger.info('[RedisCacher] Ready');
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      logger.error('[RedisCacher] Error:', err.message);
    });

    this.client.on('reconnecting', () => {
      this.isConnected = false;
      logger.warn('[RedisCacher] Reconnecting...');
    });

    this.client.on('end', () => {
      this.isConnected = false;
      logger.warn('[RedisCacher] Connection closed');
    });
  }

  static getInstance(): RedisCacher {
    if (!RedisCacher.instance) {
      RedisCacher.instance = new RedisCacher();
    }
    return RedisCacher.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected || this.isConnecting) return;
    this.isConnecting = true;
    try {
      await this.client.connect();
    } finally {
      this.isConnecting = false;
    }
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
    if (!this.isConnected) return;

    try {
      const serialized = JSON.stringify(value);

      logger.info(`[Cache] SET ${key}`);

      await this.client.setEx(key, ttlSeconds, serialized);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`[Cache] Failed to set key ${key}: ${error.message}`);
      }
    }
  }

  /**
   *
   * @param key I hope, you remember it,
   * otherwise you are going to have a bad time trying to get the data back
   * @returns The data you supposedly cached
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) return null;

    try {
      logger.info(`[Cache] GET ${key}`);

      const data = await this.client.get(key);
      if (!data) {
        logger.info(`[Cache] MISS ${key}`);
        return null;
      }

      logger.info(`[Cache] HIT ${key}`);
      return JSON.parse(data) as T;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`[Cache] Failed to get key ${key}: ${error.message}`);
      }
      return null;
    }
  }

  async delete(...keys: string[]): Promise<void> {
    if (!this.isConnected || keys.length === 0) return;
    try {
      await this.client.del(keys);
      logger.info(`[Cache] DELETED keys: ${keys.join(', ')}`);
    } catch (err) {
      logger.error(
        `[Cache] DELETE failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.quit(); // sends QUIT command, flushes pipeline
      logger.info('[RedisCacher] Disconnected gracefully');
    }
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
