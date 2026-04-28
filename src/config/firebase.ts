import * as admin from 'firebase-admin';
import path from 'path';
import logger from '../shared/logger/logger';

let initialized = false;

export function initializeFirebase(): void {
  if (initialized) return;

  try {
    const serviceAccountPath = path.resolve(
      __dirname,
      '../../firebase-service-account.json',
    );

    const serviceAccount = require(serviceAccountPath);

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
      'Firebase initialization failed. Ensure firebase-service-account.json exists in the project root.',
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
