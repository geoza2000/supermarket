import type { CallableOptions } from 'firebase-functions/v2/https';

/**
 * Common configuration for all callable functions.
 * App Check is enforced to protect against abuse.
 */
export const CALLABLE_CONFIG: CallableOptions = {
  region: 'us-central1',
  cors: true,
  invoker: 'public',
  enforceAppCheck: true,
};

/**
 * Configuration for authentication-sensitive callables.
 * Uses consumeAppCheckToken to prevent replay attacks.
 */
export const AUTH_CALLABLE_CONFIG: CallableOptions = {
  ...CALLABLE_CONFIG,
  consumeAppCheckToken: true,
};

/**
 * Common configuration for HTTP (onRequest) functions.
 * Health check and other public endpoints typically do not enforce App Check.
 */
export const HTTPS_CONFIG = {
  region: 'us-central1' as const,
  cors: true,
};
