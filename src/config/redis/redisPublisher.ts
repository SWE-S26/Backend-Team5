import { createClient, RedisClientType } from 'redis';

class RedisPublisher {
  private static instance: RedisPublisher;
  private client: RedisClientType;
  private isConnected = false;

  private constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10)
            return new Error('RedisPublisher: max retries exceeded');
          return Math.min(retries * 500, 5000);
        },
      },
    }) as RedisClientType;

    this.client.on('connect', () => {
      this.isConnected = true;
      console.log('[RedisPublisher] Connected');
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      console.error('[RedisPublisher] Error:', err.message);
    });

    this.client.on('reconnecting', () => {
      this.isConnected = false;
      console.warn('[RedisPublisher] Reconnecting...');
    });
  }

  static getInstance(): RedisPublisher {
    if (!RedisPublisher.instance) {
      RedisPublisher.instance = new RedisPublisher();
    }
    return RedisPublisher.instance;
  }

  async connect(): Promise<void> {
    if (!this.isConnected) await this.client.connect();
  }

  /**
   *
   * @param channel - use the channel in events/channels.ts
   * @param message - a JSON, that the subscriber is going to recieve
   * and act accordingly, don't put the action here, just the data
   */
  async publish<T>(channel: string, message: T): Promise<void> {
    const serialized = JSON.stringify(message);
    await this.client.publish(channel, serialized);
  }
}

export const redisPublisher = RedisPublisher.getInstance();
