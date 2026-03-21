import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { createUser } from '../services/user/userCore';
import {
  registerFcmToken,
  unregisterFcmToken,
} from '../services/user/fcmTokenStore';
import { CALLABLE_CONFIG } from '../config';

interface ManageFcmTokenRequest {
  token: string;
  action?: 'register' | 'unregister';
}

/**
 * Callable function to manage FCM tokens (register or unregister)
 * - action: 'register' adds the token (default)
 * - action: 'unregister' removes the token
 * Tokens are stored under users/{uid}/fcmTokens/{hash} (no client read/write).
 * Max 20 tokens per user; oldest registrations are removed when over capacity.
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

  const uid = request.auth.uid;

  if (action === 'unregister') {
    await unregisterFcmToken(uid, token);
    logger.info('FCM token unregistered', {
      userId: uid,
      tokenPrefix: token.substring(0, 20) + '...',
    });
    return { success: true };
  }

  await createUser({ userId: uid });
  await registerFcmToken(uid, token);

  logger.info('FCM token registered', {
    userId: uid,
    tokenPrefix: token.substring(0, 20) + '...',
  });

  return { success: true };
});
