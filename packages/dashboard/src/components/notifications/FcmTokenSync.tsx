import { useEffect, useRef } from 'react';
import { syncFcmToken } from '@/lib/firebase';
import { onServiceWorkerUpdate } from '@/lib/serviceWorkerManager';

/**
 * Component that handles global FCM token synchronization.
 * 
 * This component ensures the FCM token stays registered with the server,
 * especially after PWA/service worker updates which can invalidate the old token.
 * 
 * Must be mounted when the user is authenticated.
 */
export function FcmTokenSync() {
  const hasSyncedOnMount = useRef(false);

  // Sync token on mount (handles app refresh after PWA update)
  useEffect(() => {
    async function syncOnMount() {
      if (hasSyncedOnMount.current) return;
      hasSyncedOnMount.current = true;

      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
        console.log('[FcmTokenSync] Notifications not granted, skipping initial sync');
        return;
      }

      console.log('[FcmTokenSync] Running initial token sync...');
      const result = await syncFcmToken();
      console.log('[FcmTokenSync] Initial sync result:', result.action, result.message);
    }

    syncOnMount();
  }, []);

  // Listen for service worker updates and re-sync token
  useEffect(() => {
    const unsubscribe = onServiceWorkerUpdate(async () => {
      console.log('[FcmTokenSync] Service worker updated, syncing FCM token...');

      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
        console.log('[FcmTokenSync] Notifications not granted, skipping sync');
        return;
      }

      // Small delay to let the new SW settle
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        const result = await syncFcmToken();
        console.log('[FcmTokenSync] Post-update sync result:', result.action, result.message);
      } catch (error) {
        console.error('[FcmTokenSync] Error syncing token after SW update:', error);
      }
    });

    return unsubscribe;
  }, []);

  // This component doesn't render anything
  return null;
}
