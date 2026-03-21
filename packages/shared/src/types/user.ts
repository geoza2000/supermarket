import { z } from 'zod';

// User settings
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
}

// Notification settings (stored on user doc — no raw FCM tokens here)
export interface NotificationSettings {
  /** Maintained by Cloud Functions from the fcmTokens subcollection (max 20). */
  registeredDeviceCount: number;
}

// Core User interface (stored in Firestore)
// Note: email, displayName and photoUrl come from Firebase Auth SDK, not stored here
export interface User {
  userId: string;
  settings: UserSettings;
  notifications: NotificationSettings;
  householdIds: string[];
  activeHouseholdId: string | null;
  lastLoginAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// User document for Firestore (ISO date strings)
export interface UserDocument {
  userId: string;
  settings: UserSettings;
  notifications: NotificationSettings;
  householdIds: string[];
  activeHouseholdId: string | null;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
}

// Create user input
export interface CreateUserInput {
  userId: string;
}

// User profile returned to client (push device count only; tokens live in a private subcollection)
// Note: email, displayName and photoUrl should be merged from Firebase Auth on the client
export interface UserProfile {
  userId: string;
  settings: UserSettings;
  notifications: {
    enabled: boolean;
    tokenCount: number;
  };
  householdIds: string[];
  activeHouseholdId: string | null;
  lastLoginAt: string;
}

// Zod schemas
export const UserSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
});

export const NotificationSettingsSchema = z.object({
  registeredDeviceCount: z.number().int().min(0).max(20),
});

export const CreateUserSchema = z.object({
  userId: z.string().min(1),
});

// Helper functions
export function userToDocument(user: User): UserDocument {
  return {
    ...user,
    lastLoginAt: user.lastLoginAt.toISOString(),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

/** Normalize Firestore notifications (supports legacy fcmTokens[] until migrated). */
export function parseNotificationSettingsFromDoc(raw: unknown): NotificationSettings {
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (typeof o.registeredDeviceCount === 'number' && Number.isFinite(o.registeredDeviceCount)) {
      return {
        registeredDeviceCount: Math.max(0, Math.min(20, Math.floor(o.registeredDeviceCount))),
      };
    }
    if (Array.isArray(o.fcmTokens)) {
      return { registeredDeviceCount: o.fcmTokens.length };
    }
  }
  return getDefaultNotificationSettings();
}

export function documentToUser(doc: UserDocument): User {
  return {
    ...doc,
    notifications: parseNotificationSettingsFromDoc(doc.notifications),
    householdIds: doc.householdIds || [],
    activeHouseholdId: doc.activeHouseholdId || null,
    lastLoginAt: new Date(doc.lastLoginAt),
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
  };
}

export function getDefaultUserSettings(): UserSettings {
  return { theme: 'system' };
}

export function getDefaultNotificationSettings(): NotificationSettings {
  return {
    registeredDeviceCount: 0,
  };
}

export function userToProfile(user: User): UserProfile {
  const n = user.notifications.registeredDeviceCount;
  return {
    userId: user.userId,
    settings: user.settings,
    notifications: {
      enabled: n > 0,
      tokenCount: n,
    },
    householdIds: user.householdIds,
    activeHouseholdId: user.activeHouseholdId,
    lastLoginAt: user.lastLoginAt.toISOString(),
  };
}
