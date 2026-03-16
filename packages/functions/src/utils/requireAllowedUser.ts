import { HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { isEmailAllowed } from '@supermarket-list/shared';

/**
 * Verify that the request is authenticated AND the user's email is allowed.
 * Throws HttpsError if user is not authenticated or email is not allowed.
 *
 * Usage in Cloud Functions:
 * ```typescript
 * export const myFunction = onCall(async (request) => {
 *   const userId = requireAllowedUser(request);
 *   // ... function logic
 * });
 * ```
 *
 * @param request - The callable function request
 * @returns The authenticated user's UID
 * @throws HttpsError with 'unauthenticated' if not logged in
 * @throws HttpsError with 'permission-denied' if email not in allowlist
 */
export function requireAllowedUser(request: CallableRequest): string {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const email = request.auth.token.email;

  if (!isEmailAllowed(email)) {
    throw new HttpsError(
      'permission-denied',
      'You do not have access to this application'
    );
  }

  return request.auth.uid;
}

/**
 * Verify that the request is authenticated (without email allowlist check).
 * Use this when you want to allow any authenticated user.
 *
 * @param request - The callable function request
 * @returns The authenticated user's UID
 * @throws HttpsError with 'unauthenticated' if not logged in
 */
export function requireAuth(request: CallableRequest): string {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  return request.auth.uid;
}
