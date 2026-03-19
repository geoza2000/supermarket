import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
  connectFirestoreEmulator,
  doc,
  getDoc,
} from 'firebase/firestore';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFunctions, Functions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { getMessaging, Messaging, getToken, onMessage } from 'firebase/messaging';
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  AppCheck,
} from 'firebase/app-check';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';
import { getFirebaseMessagingSwRegistration } from './serviceWorkerManager';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Check if emulators should be used
const USE_EMULATORS = import.meta.env.VITE_USE_EMULATORS === 'true';

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let functions: Functions;
let appCheck: AppCheck | null = null;
let messaging: Messaging | null = null;
let analytics: Analytics | null = null;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
auth = getAuth(app);
functions = getFunctions(app, 'us-central1');

// Connect to emulators in development (except Auth - always use live)
if (USE_EMULATORS) {
  console.log('🔧 Using Firebase Emulators (Auth uses live)');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

// Initialize App Check for callable function protection
const reCaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (reCaptchaSiteKey) {
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(reCaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
    console.log('🛡️ App Check initialized');
  } catch (e) {
    console.warn('App Check initialization failed:', e);
  }
} else if (USE_EMULATORS) {
  console.log('🔧 App Check: Skipped (no key, emulator mode)');
} else {
  console.warn('⚠️ App Check not initialized: VITE_RECAPTCHA_SITE_KEY not set');
}

// Initialize messaging only in browser with service worker support
// Note: FCM requires real Firebase project credentials even in emulator mode
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (e) {
    console.warn('Firebase Messaging not supported:', e);
  }
}

// Initialize Analytics (production / live only; skip with emulators)
if (!USE_EMULATORS && firebaseConfig.measurementId) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

const googleProvider = new GoogleAuthProvider();

export { app, db, auth, functions, appCheck, messaging, analytics, googleProvider, USE_EMULATORS };

// Collection names
export const Collections = {
  USERS: 'users',
  HOUSEHOLDS: 'households',
  INVITATIONS: 'invitations',
} as const;

// Subcollection names
export const Subcollections = {
  SHOPS: 'shops',
  PRODUCTS: 'products',
  ITEMS: 'items',
} as const;

// Callable functions
import type {
  UserProfile,
  HouseholdDocument,
  HouseholdMember,
  InvitationDetails,
  CloseShoppingSessionResult,
} from '@supermarket-list/shared';

export const callGetUserDetails = httpsCallable<
  { email?: string; displayName?: string; photoUrl?: string },
  UserProfile
>(functions, 'getUserDetails');

export const callManageFcmToken = httpsCallable<
  { token: string; action?: 'register' | 'unregister' },
  { success: boolean }
>(functions, 'manageFcmToken');

export const callSendTestNotification = httpsCallable<
  { currentToken?: string },
  { success: boolean; tokenFound: boolean; totalTokens: number; successCount: number; failureCount: number }
>(functions, 'sendTestNotification');

// Household functions
export const callCreateHousehold = httpsCallable<
  { name: string },
  { householdId: string; name: string; ownerId: string; memberIds: string[]; plan: string; createdAt: string }
>(functions, 'createHousehold');

export async function getHouseholdDoc(householdId: string): Promise<HouseholdDocument | null> {
  const snap = await getDoc(doc(db, Collections.HOUSEHOLDS, householdId));
  if (!snap.exists()) return null;
  return snap.data() as HouseholdDocument;
}

export const callGetHouseholdMembers = httpsCallable<
  { householdId: string },
  { members: HouseholdMember[] }
>(functions, 'getHouseholdMembers');

export const callUpdateHousehold = httpsCallable<
  { householdId: string; name: string },
  { success: boolean }
>(functions, 'updateHousehold');

export const callLeaveHousehold = httpsCallable<
  { householdId: string },
  { deleted: boolean }
>(functions, 'leaveHousehold');

export const callSetActiveHousehold = httpsCallable<
  { householdId: string },
  { success: boolean }
>(functions, 'setActiveHousehold');

// Invitation functions
export const callCreateInvitation = httpsCallable<
  { householdId: string; maxUses?: number; expiryHours?: number },
  { invitationId: string; token: string; expiresAt: string; maxUses: number }
>(functions, 'createInvitation');

export const callGetInvitationDetails = httpsCallable<
  { token: string },
  InvitationDetails
>(functions, 'getInvitationDetails');

export const callAcceptInvitation = httpsCallable<
  { token: string },
  { householdId: string; householdName: string; alreadyMember: boolean }
>(functions, 'acceptInvitation');

export const callRevokeInvitation = httpsCallable<
  { invitationId: string },
  { success: boolean }
>(functions, 'revokeInvitation');

// Shop functions
export const callManageShop = httpsCallable<
  { action: string; data: Record<string, unknown> },
  Record<string, unknown>
>(functions, 'manageShop');

// Product functions
export const callManageProduct = httpsCallable<
  { action: string; data: Record<string, unknown> },
  Record<string, unknown>
>(functions, 'manageProduct');

// Shopping list functions
export const callManageShoppingItem = httpsCallable<
  { action: string; data: Record<string, unknown> },
  Record<string, unknown>
>(functions, 'manageShoppingItem');

export const callCloseShoppingSession = httpsCallable<
  { householdId: string; shopId?: string | null; closeAll?: boolean },
  CloseShoppingSessionResult
>(functions, 'closeShoppingSession');

// FCM Token management
export async function requestNotificationPermission(): Promise<string | null> {
  if (!messaging) {
    console.warn('Messaging not available');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);

    if (permission !== 'granted') {
      console.warn('Notification permission not granted:', permission);
      return null;
    }

    const swRegistration = await getFirebaseMessagingSwRegistration();
    if (!swRegistration) {
      console.error('Firebase Messaging service worker not available');
      return null;
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error('VAPID key is not configured');
      return null;
    }

    console.log('Requesting FCM token...');
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swRegistration,
    });

    if (token) {
      console.log('FCM token obtained:', token.substring(0, 20) + '...');
    } else {
      console.warn('No FCM token received');
    }

    return token;
  } catch (error) {
    console.error('Failed to get FCM token:', error);
    return null;
  }
}

export async function getCurrentFcmToken(): Promise<string | null> {
  if (!messaging) {
    console.warn('Messaging not available');
    return null;
  }

  try {
    if (Notification.permission !== 'granted') {
      console.log('Notification permission not granted');
      return null;
    }

    const swRegistration = await getFirebaseMessagingSwRegistration();
    if (!swRegistration) {
      console.error('Firebase Messaging service worker not available');
      return null;
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error('VAPID key is not configured');
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swRegistration,
    });

    return token;
  } catch (error) {
    console.error('Failed to get current FCM token:', error);
    return null;
  }
}

export function onForegroundMessage(callback: (payload: unknown) => void) {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
}

/**
 * Result of FCM token sync operation
 */
export interface FcmTokenSyncResult {
  success: boolean;
  action: 'none' | 'registered' | 'error';
  token: string | null;
  message: string;
}

/**
 * Sync FCM token with the server
 * 
 * This ensures the current device's FCM token is registered with the server.
 * The backend handles deduplication, so we can safely call this on every app load.
 * 
 * This should be called:
 * - On app load (when notifications are enabled)
 * - After service worker updates (which may invalidate the old token)
 */
export async function syncFcmToken(): Promise<FcmTokenSyncResult> {
  console.log('[FCM Sync] Starting token sync...');

  // Check if notifications are supported and permission is granted
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    console.log('[FCM Sync] Notifications not granted, skipping sync');
    return {
      success: true,
      action: 'none',
      token: null,
      message: 'Notifications not granted',
    };
  }

  try {
    // Get current FCM token from Firebase
    const currentToken = await getCurrentFcmToken();
    
    if (!currentToken) {
      console.log('[FCM Sync] No current token available');
      return {
        success: true,
        action: 'none',
        token: null,
        message: 'No token available',
      };
    }

    console.log('[FCM Sync] Current token:', currentToken.substring(0, 20) + '...');

    // Register the token with the server
    // The backend handles deduplication - it will update if token exists or add if new
    await callManageFcmToken({ token: currentToken, action: 'register' });

    console.log('[FCM Sync] Token registered/synced successfully');
    return {
      success: true,
      action: 'registered',
      token: currentToken,
      message: 'Token synced with server',
    };
  } catch (error) {
    console.error('[FCM Sync] Error syncing token:', error);
    return {
      success: false,
      action: 'error',
      token: null,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
