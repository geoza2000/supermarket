import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../admin';
import { CALLABLE_CONFIG } from '../config';

interface ManageFcmTokenRequest {
  token: string;
  action?: 'register' | 'unregister';
}

/**
 * Callable function to manage FCM tokens (register or unregister)
 * - action: 'register' adds the token (default)
 * - action: 'unregister' removes the token
 * Protected by: Auth, App Check
 */
export const manageFcmToken = onCall(CALLABLE_CONFIG, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { token, action = 'register' } = request.data as ManageFcmTokenRequest;

  if (!token || typeof token !== 'string') {
    throw new HttpsError('invalid-argument', 'Token is required');
  }

  if (action !== 'register' && action !== 'unregister') {
    throw new HttpsError('invalid-argument', 'Action must be "register" or "unregister"');
  }

  const userRef = db.collection('users').doc(request.auth.uid);

  // Check if user document exists, create if not
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    // Create user document with FCM token
    await userRef.set({
      userId: request.auth.uid,
      email: request.auth.token.email || null,
      notifications: {
        fcmTokens: action === 'register' ? [token] : [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    logger.info('User document created with FCM token', {
      userId: request.auth.uid,
      action,
      tokenPrefix: token.substring(0, 20) + '...',
    });

    return { success: true };
  }

  if (action === 'register') {
    await userRef.update({
      'notifications.fcmTokens': FieldValue.arrayUnion(token),
      updatedAt: new Date().toISOString(),
    });

    logger.info('FCM token registered', {
      userId: request.auth.uid,
      tokenPrefix: token.substring(0, 20) + '...',
    });
  } else {
    await userRef.update({
      'notifications.fcmTokens': FieldValue.arrayRemove(token),
      updatedAt: new Date().toISOString(),
    });

    logger.info('FCM token unregistered', {
      userId: request.auth.uid,
      tokenPrefix: token.substring(0, 20) + '...',
    });
  }

  return { success: true };
});
