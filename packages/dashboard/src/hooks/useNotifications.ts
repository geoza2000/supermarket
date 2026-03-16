import { useEffect, useState } from 'react';
import { onForegroundMessage, requestNotificationPermission, callManageFcmToken } from '@/lib/firebase';
import { useToast } from './useToast';

interface NotificationPayload {
  notification?: {
    title?: string;
    body?: string;
  };
  data?: {
    type?: string;
    [key: string]: string | undefined;
  };
}

export function useNotifications() {
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [token, setToken] = useState<string | null>(null);

  // Listen for foreground messages
  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload: unknown) => {
      const typedPayload = payload as NotificationPayload;
      console.log('Received foreground message:', typedPayload);

      // Show toast notification
      toast({
        title: typedPayload.notification?.title || 'New Notification',
        description: typedPayload.notification?.body,
      });
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [toast]);

  // Request permission and get token
  const enableNotifications = async (): Promise<boolean> => {
    try {
      const fcmToken = await requestNotificationPermission();
      
      if (!fcmToken) {
        setPermission(Notification.permission);
        return false;
      }

      // Register token with backend
      await callManageFcmToken({ token: fcmToken });
      
      setToken(fcmToken);
      setPermission('granted');
      return true;
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      return false;
    }
  };

  return {
    permission,
    token,
    isSupported: typeof Notification !== 'undefined',
    enableNotifications,
  };
}
