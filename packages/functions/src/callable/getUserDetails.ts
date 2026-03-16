import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { createUser } from '../services';
import { userToProfile } from '@supermarket-list/shared';
import type { CreateUserInput } from '@supermarket-list/shared';
import { CALLABLE_CONFIG } from '../config';
import '../admin'; // Ensure admin is initialized

/**
 * Callable function to get user details (creates user if doesn't exist)
 * Called on app initialization to ensure user document exists
 * Also updates lastLoginAt on every call
 *
 * Note: email, displayName and photoUrl are NOT stored in DB - they come from Firebase Auth SDK
 * Protected by: Auth, App Check
 */
export const getUserDetails = onCall(CALLABLE_CONFIG, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const input: CreateUserInput = {
    userId: request.auth.uid,
  };

  logger.info('Get user details', { userId: input.userId });

  // Creates user if doesn't exist, updates lastLoginAt on every call
  const user = await createUser(input);

  // Return profile (excludes sensitive data like FCM tokens)
  // Note: Client should merge email/displayName/photoUrl from Firebase Auth SDK
  return userToProfile(user);
});
