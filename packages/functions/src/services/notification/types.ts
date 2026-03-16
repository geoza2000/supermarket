/**
 * Options for sending a notification
 */
export interface SendNotificationOptions {
  /** Notification title */
  title: string;
  /** Notification body/description */
  body: string;
  /** Deep link path for when notification is clicked (e.g., '/dashboard', '/invoices/123') */
  deepLink?: string;
  /** Notification type for client-side handling (e.g., 'test', 'invoice_processed', 'reminder') */
  type?: string;
  /** Icon URL (defaults to '/logo-192.png') */
  icon?: string;
  /** Badge URL for web push (defaults to '/logo-192.png') */
  badge?: string;
  /** Whether the notification requires user interaction to dismiss */
  requireInteraction?: boolean;
  /** Priority level */
  priority?: 'high' | 'normal';
  /** Android notification channel ID */
  androidChannelId?: string;
  /** Additional custom data to include */
  data?: Record<string, string>;
  /** Optional notification ID for tracking */
  notificationId?: string;
}

/**
 * Result of sending notifications
 */
export interface SendNotificationResult {
  success: boolean;
  totalTokens: number;
  successCount: number;
  failureCount: number;
  invalidTokensRemoved: number;
}

/**
 * Extended result when sending to a user by ID
 */
export interface SendNotificationToUserResult extends SendNotificationResult {
  tokensFound: boolean;
}
