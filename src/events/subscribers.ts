import { registerAuthSubscriber } from './subscribers/auth.subscriber';
import { log } from '../shared/logger/logger';

export const initializeSubscribers = async (): Promise<void> => {
  await registerAuthSubscriber();
  log('[Subscribers] All subscribers registered', 'success');
};
