// Firebase Messaging Service Worker
// Handles background push notifications from Firebase Cloud Messaging

importScripts('https://www.gstatic.com/firebasejs/11.3.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.3.1/firebase-messaging-compat.js');

// Get config from query params (set during registration)
const urlParams = new URLSearchParams(self.location.search);
const firebaseConfig = {
  apiKey: urlParams.get('apiKey') || '',
  authDomain: urlParams.get('authDomain') || '',
  projectId: urlParams.get('projectId') || '',
  storageBucket: urlParams.get('storageBucket') || '',
  messagingSenderId: urlParams.get('messagingSenderId') || '',
  appId: urlParams.get('appId') || '',
};

// Initialize Firebase only if we have valid config
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  firebase.initializeApp(firebaseConfig);
  console.log('[firebase-messaging-sw.js] Firebase initialized with project:', firebaseConfig.projectId);

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] onBackgroundMessage received:', payload);
  });
} else {
  console.warn('[firebase-messaging-sw.js] Firebase config not available, messaging disabled');
}

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event.notification.tag);
  event.notification.close();

  const data = event.notification.data || {};
  let urlToOpen = data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.postMessage({ type: 'NOTIFICATION_CLICK', data });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle push events directly
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push event received');

  if (!event.data) {
    console.log('[firebase-messaging-sw.js] Push event had no data');
    return;
  }

  let payload;
  try {
    payload = event.data.json();
    console.log('[firebase-messaging-sw.js] Push payload:', payload);
  } catch (e) {
    console.log('[firebase-messaging-sw.js] Push data (text):', event.data.text());
    return;
  }

  const notification = payload.notification || {};
  const data = payload.data || {};

  const notificationTitle = notification.title || data.title || 'New Notification';
  const notificationBody = notification.body || data.body || '';

  if (!notificationTitle && !notificationBody) {
    console.log('[firebase-messaging-sw.js] No notification content to show');
    return;
  }

  const notificationOptions = {
    body: notificationBody,
    icon: notification.icon || data.icon || '/logo-192.png',
    badge: '/logo-192.png',
    tag: data.tag || payload.fcmMessageId || 'default',
    data: data,
    requireInteraction: data.requireInteraction === 'true',
  };

  console.log('[firebase-messaging-sw.js] Showing notification:', notificationTitle);

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

// Service worker lifecycle
self.addEventListener('install', () => {
  console.log('[firebase-messaging-sw.js] Service worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker activated');
  event.waitUntil(clients.claim());
});

console.log('[firebase-messaging-sw.js] Service worker loaded');
