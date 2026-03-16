/**
 * FCM error codes that indicate a token is invalid and should be removed
 */
export const INVALID_TOKEN_ERROR_CODES = [
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
];

/**
 * Default notification configuration values
 */
export const DEFAULT_NOTIFICATION_CONFIG = {
  icon: '/logo-192.png',
  badge: '/logo-192.png',
  deepLink: '/',
  type: 'notification',
  priority: 'high' as const,
  androidChannelId: 'default',
  requireInteraction: false,
};
