import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { db } from '../admin';
import { sendNotification } from '../services';
import { CALLABLE_CONFIG } from '../config';

interface UserData {
  notifications?: {
    fcmTokens?: string[];
  };
}

/**
 * Callable function to send test notification
 * Accepts optional currentToken to verify if the device's token is registered
 * Protected by: Auth, App Check
 */
export const sendTestNotification = onCall(CALLABLE_CONFIG, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const userId = request.auth.uid;
  const { currentToken } = (request.data || {}) as { currentToken?: string };

  // Fetch user tokens
  const userDoc = await db.collection('users').doc(userId).get();

  if (!userDoc.exists) {
    logger.error('User not found for test notification', { userId });
    throw new HttpsError('not-found', 'User not found');
  }

  const user = userDoc.data() as UserData;
  const fcmTokens = user.notifications?.fcmTokens || [];

  if (fcmTokens.length === 0) {
    logger.error('No FCM tokens registered for test notification', { userId });
    throw new HttpsError('failed-precondition', 'No FCM tokens registered');
  }

  // Check if current device's token is in the registered tokens
  const tokenFound = currentToken ? fcmTokens.includes(currentToken) : false;

  if (currentToken && !tokenFound) {
    logger.warn('Current device token NOT FOUND in registered tokens!', {
      userId,
      currentTokenPrefix: currentToken.substring(0, 20) + '...',
      registeredTokenPrefixes: fcmTokens.map((t) => t.substring(0, 20) + '...'),
    });
  }

  // Send notification using the service
  const result = await sendNotification(userId, fcmTokens, {
    title: '🔔 Test Notification',
    body: 'Your notifications are working correctly!',
    type: 'test',
    deepLink: '/',
    requireInteraction: true,
    priority: 'high',
  });

  return {
    ...result,
    tokenFound,
  };
});
