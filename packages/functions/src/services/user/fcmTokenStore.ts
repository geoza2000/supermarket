import * as crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { db } from '../../admin';
import { USERS_COLLECTION } from './constants';

export const FCM_TOKENS_SUBCOLLECTION = 'fcmTokens';
export const MAX_FCM_TOKENS = 20;

function tokenDocId(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

export async function syncRegisteredDeviceCount(userId: string): Promise<void> {
  const userRef = db.collection(USERS_COLLECTION).doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) return;

  const collRef = userRef.collection(FCM_TOKENS_SUBCOLLECTION);
  const snap = await collRef.get();
  await userRef.update({
    'notifications.registeredDeviceCount': snap.size,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * One-time migration from legacy notifications.fcmTokens[] on the user doc.
 * Idempotent: skips if no legacy array or array is empty.
 */
export async function migrateLegacyFcmTokensIfNeeded(userId: string): Promise<void> {
  const userRef = db.collection(USERS_COLLECTION).doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) return;

  const data = userSnap.data() as {
    notifications?: { fcmTokens?: string[]; registeredDeviceCount?: number };
  };
  const legacy = data?.notifications?.fcmTokens;
  if (!legacy?.length) return;

  logger.info('Migrating legacy FCM tokens to subcollection', {
    userId,
    legacyCount: legacy.length,
  });

  const collRef = userRef.collection(FCM_TOKENS_SUBCOLLECTION);
  const baseMs = Date.now();
  let batch = db.batch();
  let opCount = 0;

  const commitIfNeeded = async (force = false) => {
    if (opCount >= 400 || (force && opCount > 0)) {
      await batch.commit();
      batch = db.batch();
      opCount = 0;
    }
  };

  for (let i = 0; i < legacy.length; i++) {
    const token = legacy[i];
    batch.set(
      collRef.doc(tokenDocId(token)),
      { token, registeredAt: new Date(baseMs + i).toISOString() },
      { merge: true }
    );
    opCount++;
    await commitIfNeeded();
  }

  batch.update(userRef, {
    'notifications.fcmTokens': FieldValue.delete(),
    updatedAt: new Date().toISOString(),
  });
  opCount++;
  await commitIfNeeded(true);

  await pruneOldestIfOverCap(userId);
  await syncRegisteredDeviceCount(userId);
}

async function pruneOldestIfOverCap(userId: string): Promise<void> {
  const collRef = db.collection(USERS_COLLECTION).doc(userId).collection(FCM_TOKENS_SUBCOLLECTION);
  const snap = await collRef.get();
  if (snap.size <= MAX_FCM_TOKENS) return;

  const docs = snap.docs.map((d) => ({
    ref: d.ref,
    registeredAt: (d.data().registeredAt as string) || '',
  }));
  docs.sort((a, b) => a.registeredAt.localeCompare(b.registeredAt));

  const excess = docs.length - MAX_FCM_TOKENS;
  const toDelete = docs.slice(0, excess);

  let batch = db.batch();
  let opCount = 0;
  for (const { ref } of toDelete) {
    batch.delete(ref);
    opCount++;
    if (opCount >= 400) {
      await batch.commit();
      batch = db.batch();
      opCount = 0;
    }
  }
  if (opCount > 0) {
    await batch.commit();
  }

  logger.info('Pruned oldest FCM token registrations', { userId, removed: toDelete.length });
}

export async function registerFcmToken(userId: string, token: string): Promise<void> {
  await migrateLegacyFcmTokensIfNeeded(userId);

  const collRef = db.collection(USERS_COLLECTION).doc(userId).collection(FCM_TOKENS_SUBCOLLECTION);
  const docId = tokenDocId(token);
  const now = new Date().toISOString();

  await collRef.doc(docId).set({ token, registeredAt: now }, { merge: true });
  await pruneOldestIfOverCap(userId);
  await syncRegisteredDeviceCount(userId);
}

export async function unregisterFcmToken(userId: string, token: string): Promise<void> {
  await migrateLegacyFcmTokensIfNeeded(userId);

  const collRef = db.collection(USERS_COLLECTION).doc(userId).collection(FCM_TOKENS_SUBCOLLECTION);
  await collRef.doc(tokenDocId(token)).delete();
  await syncRegisteredDeviceCount(userId);
}

export async function listFcmTokensForUser(userId: string): Promise<string[]> {
  await migrateLegacyFcmTokensIfNeeded(userId);

  const snap = await db
    .collection(USERS_COLLECTION)
    .doc(userId)
    .collection(FCM_TOKENS_SUBCOLLECTION)
    .get();

  return snap.docs.map((d) => d.data().token as string).filter((t) => typeof t === 'string' && t.length > 0);
}

export async function deleteInvalidFcmTokens(userId: string, invalidTokens: string[]): Promise<void> {
  if (invalidTokens.length === 0) return;

  const collRef = db.collection(USERS_COLLECTION).doc(userId).collection(FCM_TOKENS_SUBCOLLECTION);
  let batch = db.batch();
  let opCount = 0;

  for (const token of invalidTokens) {
    batch.delete(collRef.doc(tokenDocId(token)));
    opCount++;
    if (opCount >= 400) {
      await batch.commit();
      batch = db.batch();
      opCount = 0;
    }
  }
  if (opCount > 0) {
    await batch.commit();
  }

  await syncRegisteredDeviceCount(userId);
}
