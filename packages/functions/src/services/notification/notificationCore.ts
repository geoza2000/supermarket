import { logger } from 'firebase-functions/v2';
import { admin, db } from '../../admin';
import { INVALID_TOKEN_ERROR_CODES, DEFAULT_NOTIFICATION_CONFIG } from './constants';
import type {
  SendNotificationOptions,
  SendNotificationResult,
  SendNotificationToUserResult,
} from './types';

/**
 * Build a multicast message from notification options
 */
function buildMulticastMessage(
  tokens: string[],
  options: SendNotificationOptions
): admin.messaging.MulticastMessage {
  const {
    title,
    body,
    deepLink = DEFAULT_NOTIFICATION_CONFIG.deepLink,
    type = DEFAULT_NOTIFICATION_CONFIG.type,
    icon = DEFAULT_NOTIFICATION_CONFIG.icon,
    badge = DEFAULT_NOTIFICATION_CONFIG.badge,
    requireInteraction = DEFAULT_NOTIFICATION_CONFIG.requireInteraction,
    priority = DEFAULT_NOTIFICATION_CONFIG.priority,
    androidChannelId = DEFAULT_NOTIFICATION_CONFIG.androidChannelId,
    data = {},
    notificationId,
  } = options;

  // Merge custom data with standard fields
  const messageData: Record<string, string> = {
    type,
    timestamp: Date.now().toString(),
    title,
    body,
    deepLink,
    ...data,
  };

  if (notificationId) {
    messageData.notificationId = notificationId;
  }

  return {
    notification: {
      title,
      body,
    },
    data: messageData,
    tokens,
    webpush: {
      headers: {
        Urgency: priority,
      },
      notification: {
        title,
        body,
        icon,
        badge,
        requireInteraction,
      },
      fcmOptions: {
        link: deepLink,
      },
      data: {
        deepLink,
        notificationId: notificationId || '',
      },
    },
    android: {
      priority,
      notification: {
        channelId: androidChannelId,
        priority: priority === 'high' ? 'high' : 'default',
        icon: 'ic_notification',
        clickAction: 'OPEN_APP',
      },
      data: {
        deepLink,
        notificationId: notificationId || '',
      },
    },
    apns: {
      payload: {
        aps: {
          badge: 1,
          sound: 'default',
        },
        deepLink,
        notificationId: notificationId || '',
      },
    },
  };
}

/**
 * Remove invalid FCM tokens from user document
 */
async function removeInvalidTokens(
  userId: string,
  allTokens: string[],
  invalidTokens: string[]
): Promise<void> {
  if (invalidTokens.length === 0) return;

  logger.info('Removing invalid FCM tokens', {
    userId,
    count: invalidTokens.length,
    tokenPrefixes: invalidTokens.map(t => t?.substring(0, 20) + '...'),
  });

  try {
    const userRef = db.collection('users').doc(userId);
    const validTokens = allTokens.filter(t => !invalidTokens.includes(t));
    await userRef.update({
      'notifications.fcmTokens': validTokens,
      updatedAt: new Date().toISOString(),
    });
    logger.info('Invalid FCM tokens removed successfully', { userId });
  } catch (error) {
    logger.error('Failed to remove invalid FCM tokens', { error, userId });
    // Don't throw - this is cleanup, not critical to the notification send
  }
}

/**
 * Send a notification to multiple FCM tokens
 * Handles building the message, sending, logging, and cleaning up invalid tokens
 */
export async function sendNotification(
  userId: string,
  tokens: string[],
  options: SendNotificationOptions
): Promise<SendNotificationResult> {
  if (tokens.length === 0) {
    logger.warn('No FCM tokens provided for notification', { userId });
    return {
      success: false,
      totalTokens: 0,
      successCount: 0,
      failureCount: 0,
      invalidTokensRemoved: 0,
    };
  }

  logger.info('Sending notification', {
    userId,
    tokenCount: tokens.length,
    title: options.title,
    type: options.type,
    deepLink: options.deepLink,
  });

  const message = buildMulticastMessage(tokens, options);

  try {
    const response = await admin.messaging().sendEachForMulticast(message);

    logger.info('Notification sent', {
      userId,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

    // Collect invalid tokens for cleanup
    const invalidTokens: string[] = [];

    response.responses.forEach((resp, idx) => {
      const token = tokens[idx];

      if (!resp.success) {
        const error = resp.error;
        logger.error('Notification failed for token', {
          userId,
          tokenPrefix: token?.substring(0, 20) + '...',
          errorCode: error?.code,
          errorMessage: error?.message,
        });

        if (error?.code && INVALID_TOKEN_ERROR_CODES.includes(error.code)) {
          invalidTokens.push(token);
        }
      } else {
        logger.debug('Notification sent to token', {
          userId,
          tokenPrefix: token?.substring(0, 20) + '...',
          messageId: resp.messageId,
        });
      }
    });

    // Clean up invalid tokens
    await removeInvalidTokens(userId, tokens, invalidTokens);

    return {
      success: response.successCount > 0,
      totalTokens: tokens.length,
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokensRemoved: invalidTokens.length,
    };
  } catch (error) {
    const errorDetails = error instanceof Error
      ? { message: error.message, stack: error.stack, name: error.name }
      : error;
    logger.error('Failed to send notification', { error: errorDetails, userId });
    throw error;
  }
}

/**
 * Send a notification to a user by userId
 * Fetches tokens from the user document automatically
 */
export async function sendNotificationToUser(
  userId: string,
  options: SendNotificationOptions
): Promise<SendNotificationToUserResult> {
  const userDoc = await db.collection('users').doc(userId).get();

  if (!userDoc.exists) {
    logger.warn('User not found for notification', { userId });
    return {
      success: false,
      tokensFound: false,
      totalTokens: 0,
      successCount: 0,
      failureCount: 0,
      invalidTokensRemoved: 0,
    };
  }

  const userData = userDoc.data() as { notifications?: { fcmTokens?: string[] } };
  const tokens = userData?.notifications?.fcmTokens || [];

  if (tokens.length === 0) {
    logger.info('No FCM tokens registered for user', { userId });
    return {
      success: false,
      tokensFound: false,
      totalTokens: 0,
      successCount: 0,
      failureCount: 0,
      invalidTokensRemoved: 0,
    };
  }

  const result = await sendNotification(userId, tokens, options);
  return {
    ...result,
    tokensFound: true,
  };
}
