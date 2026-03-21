import { HttpsError, CallableRequest } from 'firebase-functions/v2/https';

/**
 * Verify that the request is authenticated.
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
