import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  requestNotificationPermission, 
  callManageFcmToken,
  getCurrentFcmToken,
} from '@/lib/firebase';
import { queryKeys } from '@/lib/queryClient';

/**
 * Result of FCM token registration
 */
interface RegisterFcmTokenResult {
  success: boolean;
  token: string | null;
  permissionDenied: boolean;
}

/**
 * Result of FCM token unregistration
 */
interface UnregisterFcmTokenResult {
  success: boolean;
  token: string | null;
}

/**
 * Hook for registering FCM token (enabling push notifications)
 * 
 * Handles:
 * - Requesting browser notification permission
 * - Getting FCM token from Firebase
 * - Registering token with backend
 */
export function useRegisterFcmToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<RegisterFcmTokenResult> => {
      // Request browser permission and get token
      const token = await requestNotificationPermission();

      if (!token) {
        return {
          success: false,
          token: null,
          permissionDenied: typeof Notification !== 'undefined' 
            ? Notification.permission === 'denied'
            : true,
        };
      }

      // Register with backend
      await callManageFcmToken({ token, action: 'register' });

      return {
        success: true,
        token,
        permissionDenied: false,
      };
    },
    onSuccess: () => {
      // Invalidate notification-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() });
    },
  });
}

/**
 * Hook for unregistering FCM token (disabling push notifications)
 * 
 * Handles:
 * - Getting current FCM token
 * - Unregistering token from backend
 */
export function useUnregisterFcmToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cachedToken?: string | null): Promise<UnregisterFcmTokenResult> => {
      // Get current token (from cache or fetch)
      let token = cachedToken;
      if (!token) {
        token = await getCurrentFcmToken();
      }

      if (!token) {
        return {
          success: false,
          token: null,
        };
      }

      // Unregister from backend
      await callManageFcmToken({ token, action: 'unregister' });

      return {
        success: true,
        token,
      };
    },
    onSuccess: () => {
      // Invalidate notification-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() });
    },
  });
}
