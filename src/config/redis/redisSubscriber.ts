import { createClient, RedisClientType } from 'redis';

type MessageHandler<T = unknown> = (message: T, channel: string) => void;

class RedisSubscriber {
  private static instance: RedisSubscriber;
  private client: RedisClientType;
  private isConnected = false;

  private constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10)
            return new Error('RedisSubscriber: max retries exceeded');
          return Math.min(retries * 500, 5000);
        },
      },
    }) as RedisClientType;

    this.client.on('connect', () => {
      this.isConnected = true;
      console.log('[RedisSubscriber] Connected');
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      console.error('[RedisSubscriber] Error:', err.message);
    });

    this.client.on('reconnecting', () => {
      this.isConnected = false;
      console.warn('[RedisSubscriber] Reconnecting...');
    });
  }

  static getInstance(): RedisSubscriber {
    if (!RedisSubscriber.instance) {
      RedisSubscriber.instance = new RedisSubscriber();
    }
    return RedisSubscriber.instance;
  }

  async connect(): Promise<void> {
    if (!this.isConnected) await this.client.connect();
  }

  /**
   *
   * @param channel - Just copy that name from the publisher
   * @param handler - A function, not sure if you should send a response from here.
   */
  async subscribe<T>(
    channel: string,
    handler: MessageHandler<T>,
  ): Promise<void> {
    await this.client.subscribe(channel, (rawMessage) => {
      try {
        const parsed = JSON.parse(rawMessage) as T;
        handler(parsed, channel);
      } catch {
        console.error(
          `[RedisSubscriber] Failed to parse message on channel "${channel}":`,
          rawMessage,
        );
      }
    });
    console.log(`[RedisSubscriber] Subscribed to channel: ${channel}`);
  }

  /**
   * leaves the channel and stop listening, but why would we do that?
   * @param channel
   */
  async unsubscribe(channel: string): Promise<void> {
    await this.client.unsubscribe(channel);
    console.log(`[RedisSubscriber] Unsubscribed from channel: ${channel}`);
  }
}

/**
 * @description Singleton Redis subscriber instance for app-wide use
 * Consider this a global listener on certain channels.
 * The RedisPublisher can publish to channels, and this subscriber will react accordingly.
 * @example Suppose you have a "notifications" channel.
 * The publisher can publish a message to "notifications",
 * and the subscriber can listen to that channel and trigger in-app notifications for users.
 * Berogola keda ne3mel decoupling le 7aga maslan zy el emails, mesh lazem el auth bas ely y3melha
 * el auth bas hay3mel maslan publish we yb3at fel message el data ely me7tagha we 5alas yfoko
 */
export const redisSubscriber = RedisSubscriber.getInstance();
