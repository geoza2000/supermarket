import { z } from 'zod';

// User settings
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
}

// Notification settings
export interface NotificationSettings {
  fcmTokens: string[];
}

// Core User interface (stored in Firestore)
// Note: email, displayName and photoUrl come from Firebase Auth SDK, not stored here
export interface User {
  userId: string;
  settings: UserSettings;
  notifications: NotificationSettings;
  lastLoginAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// User document for Firestore (ISO date strings)
export interface UserDocument {
  userId: string;
  settings: UserSettings;
  notifications: NotificationSettings;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
}

// Create user input
export interface CreateUserInput {
  userId: string;
}

// User profile returned to client (excludes sensitive data like fcmTokens)
// Note: email, displayName and photoUrl should be merged from Firebase Auth on the client
export interface UserProfile {
  userId: string;
  settings: UserSettings;
  notifications: {
    enabled: boolean;
    tokenCount: number;
  };
  lastLoginAt: string;
}

// Zod schemas
export const UserSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
});

export const NotificationSettingsSchema = z.object({
  fcmTokens: z.array(z.string()),
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

export function documentToUser(doc: UserDocument): User {
  return {
    ...doc,
    notifications: doc.notifications || getDefaultNotificationSettings(),
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
    fcmTokens: [],
  };
}

export function userToProfile(user: User): UserProfile {
  return {
    userId: user.userId,
    settings: user.settings,
    notifications: {
      enabled: user.notifications.fcmTokens.length > 0,
      tokenCount: user.notifications.fcmTokens.length,
    },
    lastLoginAt: user.lastLoginAt.toISOString(),
  };
}
