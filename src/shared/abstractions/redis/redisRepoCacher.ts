import { redisCacher } from './redisCacher';
import 'dotenv/config';

export enum RedisObjectType {
  COMMENT = 'comment',
  TRACK = 'track',
  USER = 'user',
  PLAYLIST = 'playlist',
  PLAY = 'play',
  REPOST = 'repost',
  NOTIFICATION = 'notification',
}

class RedisRepoCacher {
  private static instance: RedisRepoCacher;
  private constructor() {}

  static getInstance(): RedisRepoCacher {
    if (!RedisRepoCacher.instance) {
      RedisRepoCacher.instance = new RedisRepoCacher();
    }
    return RedisRepoCacher.instance;
  }

  private buildKey(objectType: RedisObjectType, objectId: string): string {
    if (!Object.values(RedisObjectType).includes(objectType)) {
      throw new Error(`Unsupported object type: ${objectType}`);
    }
    return `${objectType}:${objectId}`;
  }

  /**
   * @whenToUse **After hitting the DB** and
   * you have the **ENTIRE OBJECT** that is the only case to cache never cache a partial object.
   * Partial objects will corrupt reads for any other part of the app sharing the same cache key.
   */
  async cacheObject<T extends object>(
    objectType: RedisObjectType,
    objectId: string,
    object: T,
    ttlSeconds: number = 900,
  ): Promise<void> {
    const redisKey = this.buildKey(objectType, objectId);
    await redisCacher.set(redisKey, object, ttlSeconds);
  }

  /**
   * @whenToUse Right before hitting the DB, check the cache first.
   * For joined data, loop through each ID and attempt a cache hit individually.
   * On **any miss**, fall back to the DB, fetch the **complete object**,
   * and cache it before returning.
   * Field filtering should happen in the service/mapper layer, not here.
   *
   * @example Fetching a playlist with its tracks:
   * 1. Get the playlist from cache
   * 2. Loop over its track IDs, fetching each from cache individually
   * 3. On a miss, fetch the **full track** from DB and cache it
   */
  async getCachedObject<T>(
    objectType: RedisObjectType,
    objectId: string,
  ): Promise<T | null> {
    const redisKey = this.buildKey(objectType, objectId);
    return await redisCacher.get<T>(redisKey);
  }

  /**
   * @whenToUse When an object is **mutated or deleted**, invalidate immediately so the next
   * read fetches fresh data from the DB and repopulates the cache.
   *
   * @example A user updates their profile picture:
   * invalidate `USER:userId` so no stale profile data is served to any caller.
   */
  async invalidateCache(objectType: RedisObjectType, objectId: string) {
    const redisKey = this.buildKey(objectType, objectId);
    await redisCacher.delete(redisKey);
  }
}

export const redisRepoCacher = RedisRepoCacher.getInstance();
