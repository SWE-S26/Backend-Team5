import { registerAuthSubscriber } from './subscribers/auth.subscriber';
import logger from '../shared/logger/logger';

export const initializeSubscribers = async (): Promise<void> => {
  await registerAuthSubscriber();
  logger.info('[Subscribers] All subscribers registered');
};
