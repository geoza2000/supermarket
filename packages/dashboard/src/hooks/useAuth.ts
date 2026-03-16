import { useState, useEffect, useCallback, useRef } from 'react';
import {
  User as FirebaseUser,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider, callGetUserDetails, Collections } from '@/lib/firebase';

export interface UserProfile {
  // Core identity
  userId: string;
  // From Firebase Auth SDK (not stored in DB)
  email: string;
  displayName: string;
  photoUrl: string | null;
  // From Firestore
  settings: {
    theme: 'light' | 'dark' | 'system';
  };
  notifications: {
    enabled: boolean;
    tokenCount: number;
  };
  lastLoginAt: string | null;
}

interface UseAuthResult {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Keep track of current Firebase user for Firestore subscription
  const currentUserRef = useRef<FirebaseUser | null>(null);

  // Subscribe to user profile from Firestore, merging with Firebase Auth data
  const subscribeToProfile = useCallback((firebaseUser: FirebaseUser): (() => void) => {
    currentUserRef.current = firebaseUser;
    const userRef = doc(db, Collections.USERS, firebaseUser.uid);
    
    return onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          // Merge Firebase Auth data with Firestore data
          // Note: email, displayName and photoUrl come from Firebase Auth, NOT stored in DB
          const userProfile: UserProfile = {
            // Core identity
            userId: firebaseUser.uid,
            // From Firebase Auth SDK (not stored in DB)
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'User',
            photoUrl: firebaseUser.photoURL,
            // From Firestore
            settings: data.settings || { theme: 'system' },
            notifications: {
              enabled: (data.notifications?.fcmTokens?.length || 0) > 0,
              tokenCount: data.notifications?.fcmTokens?.length || 0,
            },
            lastLoginAt: data.lastLoginAt || null,
          };
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching profile:', err);
        setError(err);
        setLoading(false);
      }
    );
  }, []);

  // Create user profile if it doesn't exist
  const ensureProfileExists = useCallback(async (): Promise<void> => {
    try {
      await callGetUserDetails({});
    } catch (err) {
      console.error('Failed to ensure profile exists:', err);
      setError(err as Error);
    }
  }, []);

  // Listen to auth state changes and subscribe to profile
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        setUser(firebaseUser);
        
        // Cleanup previous profile subscription
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        
        if (firebaseUser) {
          // Ensure profile exists (creates if needed)
          await ensureProfileExists();
          // Subscribe to profile updates
          unsubscribeProfile = subscribeToProfile(firebaseUser);
        } else {
          setProfile(null);
          setLoading(false);
        }
      },
      (err) => {
        console.error('Auth state change error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, [subscribeToProfile, ensureProfileExists]);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Sign in with Google - profile subscription handled by auth state listener
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
      setProfile(null);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const refreshProfile = async () => {
    // Profile updates automatically via Firestore subscription
    // This function is kept for API compatibility but is now a no-op
  };

  return {
    user,
    profile,
    loading,
    error,
    signInWithGoogle,
    signOut,
    refreshProfile,
  };
}
