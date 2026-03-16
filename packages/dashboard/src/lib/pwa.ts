/**
 * Utility functions for PWA detection and management
 */

// Re-export service worker manager functions for convenience
export {
  registerFirebaseMessagingSW,
  getFirebaseMessagingSwRegistration,
  onServiceWorkerUpdate,
  setupServiceWorkerUpdateListeners,
} from './serviceWorkerManager';

/**
 * Check if the app is running in standalone PWA mode
 * Works for iOS, Android, and Desktop PWAs
 */
export function isPWAInstalled(): boolean {
  // Check if running in standalone mode (iOS)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  // Check if running as PWA on iOS (Safari)
  if ((window.navigator as unknown as { standalone?: boolean }).standalone === true) {
    return true;
  }

  // Check Android/Chrome PWA
  if (document.referrer.includes('android-app://')) {
    return true;
  }

  return false;
}

/**
 * Check if PWA installation is supported on this device/browser
 */
export function isPWAInstallable(): boolean {
  return 'BeforeInstallPromptEvent' in window || 'onbeforeinstallprompt' in window;
}

/**
 * Get PWA display mode
 */
export function getPWADisplayMode(): 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser' {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone';
  }
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen';
  }
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui';
  }
  return 'browser';
}

/**
 * Force update all service workers and clear caches
 */
export async function forceUpdatePWA(): Promise<{ updated: boolean; message: string }> {
  if (!('serviceWorker' in navigator)) {
    return { updated: false, message: 'Service workers not supported' };
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log('Found service worker registrations:', registrations.length);

    for (const registration of registrations) {
      console.log('Updating SW:', registration.scope);
      await registration.update();
    }

    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log('Clearing caches:', cacheNames);
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
      }
    }

    return {
      updated: true,
      message: `Updated ${registrations.length} service workers and cleared caches. Please refresh the page.`,
    };
  } catch (error) {
    console.error('Failed to force update PWA:', error);
    return {
      updated: false,
      message: error instanceof Error ? error.message : 'Failed to update',
    };
  }
}

/**
 * Get platform-specific install instructions
 */
export function getInstallInstructions(): { platform: string; steps: string[] } {
  const userAgent = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return {
      platform: 'iOS (Safari)',
      steps: [
        'Tap the Share button (square with arrow)',
        'Scroll down and tap "Add to Home Screen"',
        'Tap "Add" to confirm',
      ],
    };
  }

  if (/android/.test(userAgent)) {
    return {
      platform: 'Android (Chrome)',
      steps: [
        'Tap the menu icon (three dots) in the top right',
        'Tap "Install app" or "Add to Home screen"',
        'Tap "Install" to confirm',
      ],
    };
  }

  if (/chrome|edg/.test(userAgent)) {
    return {
      platform: 'Desktop (Chrome/Edge)',
      steps: [
        'Click the install icon in the address bar (or ⊕ icon)',
        'Click "Install" in the popup',
      ],
    };
  }

  return {
    platform: 'Your Browser',
    steps: [
      'Look for an install or "Add to Home Screen" option in your browser menu',
      'Follow the prompts to install the app',
    ],
  };
}
