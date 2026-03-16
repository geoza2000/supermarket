import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  AppCheck,
} from 'firebase/app-check';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';

let app: FirebaseApp;
let db: Firestore;
let appCheck: AppCheck | null = null;
let analytics: Analytics | null = null;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

db = getFirestore(app);

// Connect to emulators if enabled
if (useEmulators) {
  connectFirestoreEmulator(db, 'localhost', 8080);
  console.log('🔧 Using Firebase emulators');
}

// Initialize App Check (required if website calls Cloud Functions with enforceAppCheck)
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
} else if (useEmulators) {
  console.log('🔧 App Check: Skipped (no key, emulator mode)');
} else {
  console.warn('⚠️ App Check not initialized: VITE_RECAPTCHA_SITE_KEY not set');
}

// Initialize analytics (only in production and if supported)
if (!useEmulators && firebaseConfig.measurementId) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, db, appCheck, analytics };
