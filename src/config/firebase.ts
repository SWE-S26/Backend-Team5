import * as admin from 'firebase-admin';
import logger from '../shared/logger/logger';

let initialized = false;

export function initializeFirebase(): void {
  if (initialized) return;

  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (!raw) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_JSON is not set in environment variables.',
      );
    }

    const serviceAccount = JSON.parse(raw);

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    initialized = true;
    logger.info('[Firebase] Firebase Admin initialized successfully');
  } catch (error) {
    logger.error(`[Firebase] Failed to initialize: ${error}`);
    throw new Error(
      'Firebase initialization failed. Ensure FIREBASE_SERVICE_ACCOUNT_JSON is set in .env with a valid service account object.',
    );
  }
}

export function getMessaging(): admin.messaging.Messaging {
  if (!initialized) {
    throw new Error(
      'Firebase is not initialized. Call initializeFirebase() first.',
    );
  }
  return admin.messaging();
}
