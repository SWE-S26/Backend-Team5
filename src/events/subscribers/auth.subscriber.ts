import { redisCacher } from '../../shared/abstractions/redis/redisCacher';
import { redisSubscriber } from '../../shared/abstractions/redis/redisSubscriber';
import { CHANNELS } from '../channels';
import { AuthEvent } from '../eventPayloads';

export const registerAuthSubscriber = async (): Promise<void> => {
  await redisSubscriber.subscribe<AuthEvent>(CHANNELS.AUTH, async (event) => {
    switch (event.type) {
      case 'auth:registered':
        console.log(
          `[AuthSubscriber] New registration: ${event.payload.email}`,
        );
        break;

      case 'auth:password-reset-requested':
        console.log(
          `[AuthSubscriber] Password reset requested for: ${event.payload.email}`,
        );
        break;

      case 'auth:account-deleted':
        console.log(`[AuthSubscriber] Account deleted: ${event.payload.email}`);
        break;

      default:
        console.warn('[AuthSubscriber] Unknown event received:', event);
    }
  });
};
