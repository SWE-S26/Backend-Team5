import { registerAuthSubscriber } from './subscribers/auth.subscriber';

export const initializeSubscribers = async (): Promise<void> => {
  await registerAuthSubscriber();
  console.log('[Subscribers] All subscribers registered');
};
