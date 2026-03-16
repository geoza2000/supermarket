import { useMutation } from '@tanstack/react-query';
import { callSendTestNotification, getCurrentFcmToken } from '@/lib/firebase';

/**
 * Input for sending test notification
 */
interface SendTestNotificationInput {
  /** Cached token to avoid refetching */
  cachedToken?: string | null;
}

/**
 * Result of sending test notification
 */
interface SendTestNotificationResult {
  success: boolean;
  tokenFound: boolean;
  totalTokens: number;
  successCount: number;
  failureCount: number;
  currentToken: string | null;
}

/**
 * Hook for sending a test push notification
 * 
 * Sends a test notification to all registered devices for the current user.
 * Also validates if the current device's token is registered.
 */
export function useSendTestNotification() {
  return useMutation({
    mutationFn: async ({ cachedToken }: SendTestNotificationInput = {}): Promise<SendTestNotificationResult> => {
      // Get current token to send to server for validation
      let currentToken = cachedToken ?? null;
      if (!currentToken) {
        currentToken = await getCurrentFcmToken();
      }

      console.log('Sending test notification...');
      console.log('Current FCM token:', currentToken?.substring(0, 20) + '...');

      // Send current token to server so it can verify it's registered
      const result = await callSendTestNotification({ currentToken: currentToken || undefined });
      const data = result.data;

      return {
        success: data.success,
        tokenFound: data.tokenFound,
        totalTokens: data.totalTokens,
        successCount: data.successCount,
        failureCount: data.failureCount,
        currentToken,
      };
    },
  });
}
