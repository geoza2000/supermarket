import { db } from '../../admin';
import type {
  User,
  UserDocument,
  CreateUserInput,
  UserProfile,
} from '@supermarket-list/shared';
import {
  documentToUser,
  userToDocument,
  userToProfile,
  getDefaultUserSettings,
  getDefaultNotificationSettings,
} from '@supermarket-list/shared';
import { USERS_COLLECTION } from './constants';
import { migrateLegacyFcmTokensIfNeeded } from './fcmTokenStore';

/**
 * Create a new user when they first sign in, or update lastLoginAt if exists
 * Always updates lastLoginAt on every call
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  const now = new Date();
  const docRef = db.collection(USERS_COLLECTION).doc(input.userId);

  // Check if user already exists
  const existing = await docRef.get();
  if (existing.exists) {
    await migrateLegacyFcmTokensIfNeeded(input.userId);
    await docRef.update({
      lastLoginAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    const refreshed = await docRef.get();
    const user = documentToUser(refreshed.data() as UserDocument);
    user.lastLoginAt = now;
    user.updatedAt = now;
    return user;
  }

  const user: User = {
    userId: input.userId,
    settings: getDefaultUserSettings(),
    notifications: getDefaultNotificationSettings(),
    householdIds: [],
    activeHouseholdId: null,
    lastLoginAt: now,
    createdAt: now,
    updatedAt: now,
  };

  const doc = userToDocument(user);
  await docRef.set(doc);

  return user;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const docRef = db.collection(USERS_COLLECTION).doc(userId);
  const doc = await docRef.get();

  if (!doc.exists) {
    return null;
  }

  return documentToUser(doc.data() as UserDocument);
}

/**
 * Get user profile (safe to return to client)
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const user = await getUserById(userId);
  if (!user) return null;
  return userToProfile(user);
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  userId: string,
  settings: Partial<User['settings']>
): Promise<void> {
  const docRef = db.collection(USERS_COLLECTION).doc(userId);
  const updateData: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (settings.theme !== undefined) {
    updateData['settings.theme'] = settings.theme;
  }

  await docRef.update(updateData);
}
