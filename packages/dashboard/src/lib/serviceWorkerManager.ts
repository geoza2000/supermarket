/**
 * Service Worker Manager
 * Handles registration of Firebase Messaging service worker
 */

let fcmSwRegistration: ServiceWorkerRegistration | null = null;

type SwUpdateCallback = () => void;
const swUpdateCallbacks: Set<SwUpdateCallback> = new Set();

export function onServiceWorkerUpdate(callback: SwUpdateCallback): () => void {
  swUpdateCallbacks.add(callback);
  return () => swUpdateCallbacks.delete(callback);
}

function notifySwUpdate(): void {
  console.log('[ServiceWorkerManager] Notifying SW update to', swUpdateCallbacks.size, 'subscribers');
  swUpdateCallbacks.forEach((callback) => {
    try {
      callback();
    } catch (error) {
      console.error('[ServiceWorkerManager] Error in SW update callback:', error);
    }
  });
}

export function setupServiceWorkerUpdateListeners(): void {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[ServiceWorkerManager] Service worker controller changed');
    notifySwUpdate();
  });

  if (fcmSwRegistration) {
    setupRegistrationUpdateListener(fcmSwRegistration);
  }

  console.log('[ServiceWorkerManager] SW update listeners initialized');
}

function setupRegistrationUpdateListener(registration: ServiceWorkerRegistration): void {
  registration.addEventListener('updatefound', () => {
    console.log('[ServiceWorkerManager] Update found for registration:', registration.scope);
    
    const newWorker = registration.installing;
    if (newWorker) {
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'activated') {
          console.log('[ServiceWorkerManager] New service worker activated:', registration.scope);
          notifySwUpdate();
        }
      });
    }
  });
}

function buildFirebaseSwUrl(): string {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  const params = new URLSearchParams();
  Object.entries(config).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  return `/firebase-messaging-sw.js?${params.toString()}`;
}

export async function registerFirebaseMessagingSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[ServiceWorkerManager] Service workers not supported');
    return null;
  }

  if (fcmSwRegistration) {
    console.log('[ServiceWorkerManager] Returning cached FCM SW registration');
    return fcmSwRegistration;
  }

  try {
    const swUrl = buildFirebaseSwUrl();
    console.log('[ServiceWorkerManager] Registering Firebase Messaging SW...');

    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: '/firebase-cloud-messaging-push-scope',
    });

    console.log('[ServiceWorkerManager] Firebase Messaging SW registered:', {
      scope: registration.scope,
      state: registration.active?.state || registration.installing?.state || registration.waiting?.state,
    });

    if (registration.installing) {
      await new Promise<void>((resolve) => {
        registration.installing!.addEventListener('statechange', function handler(e) {
          if ((e.target as ServiceWorker).state === 'activated') {
            registration.installing?.removeEventListener('statechange', handler);
            resolve();
          }
        });
      });
    }

    setupRegistrationUpdateListener(registration);
    fcmSwRegistration = registration;
    return registration;
  } catch (error) {
    console.error('[ServiceWorkerManager] Failed to register Firebase Messaging SW:', error);
    return null;
  }
}

export async function getFirebaseMessagingSwRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (fcmSwRegistration) return fcmSwRegistration;

  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const fcmRegistration = registrations.find((reg) =>
        reg.scope.includes('firebase-cloud-messaging-push-scope')
      );

      if (fcmRegistration) {
        console.log('[ServiceWorkerManager] Found existing FCM SW registration');
        fcmSwRegistration = fcmRegistration;
        return fcmRegistration;
      }

      console.log('[ServiceWorkerManager] No existing FCM SW found, registering...');
      return await registerFirebaseMessagingSW();
    } catch (error) {
      console.error('[ServiceWorkerManager] Error getting FCM SW registration:', error);
      return null;
    }
  }

  return null;
}
