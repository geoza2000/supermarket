import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../admin';
import { HOUSEHOLDS_COLLECTION } from '../household/constants';

export const ITEM_ADD_NOTIFICATION_BATCHES_SUBCOLLECTION = 'itemAddNotificationBatches';

/** Cap stored names to keep documents small; notification body uses a shorter slice. */
const MAX_NAMES_STORED = 40;

function batchRef(householdId: string, addedByUserId: string) {
  return db
    .collection(HOUSEHOLDS_COLLECTION)
    .doc(householdId)
    .collection(ITEM_ADD_NOTIFICATION_BATCHES_SUBCOLLECTION)
    .doc(addedByUserId);
}

/**
 * Record an item add so a batched notification can be sent after 1h idle (hourly cron).
 */
export async function recordPendingItemAddNotification(
  householdId: string,
  addedByUserId: string,
  itemName: string
): Promise<void> {
  const ref = batchRef(householdId, addedByUserId);

  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const prev = snap.exists
      ? ((snap.data() as { itemNames?: string[] }).itemNames ?? [])
      : [];
    const next = [...prev, itemName].slice(-MAX_NAMES_STORED);
    transaction.set(ref, {
      householdId,
      addedByUserId,
      itemNames: next,
      lastAddAt: FieldValue.serverTimestamp(),
    });
  });
}
