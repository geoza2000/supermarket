import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../admin';
import { SCHEDULER_CONFIG } from '../config';
import { getHouseholdById, isHouseholdMember } from '../services';
import { sendNotificationToHouseholdMembers } from '../services/notification/householdNotifications';
import { getAuthDisplayName } from '../utils/authDisplayName';
import { ITEM_ADD_NOTIFICATION_BATCHES_SUBCOLLECTION } from '../services/shoppingList/itemAddNotificationBatch';

const IDLE_MS = 60 * 60 * 1000;
/** Max item names shown in notification body before summarizing. */
const BODY_NAME_LIMIT = 5;

function formatItemAddBody(displayName: string, names: string[]): string {
  const uniquePreview = names.slice(0, BODY_NAME_LIMIT);
  const rest = names.length - uniquePreview.length;
  if (names.length === 0) {
    return `${displayName} updated the shopping list`;
  }
  if (names.length === 1) {
    return `${displayName} added ${names[0]}`;
  }
  if (rest <= 0) {
    return `${displayName} added ${uniquePreview.join(', ')}`;
  }
  return `${displayName} added ${uniquePreview.join(', ')} and ${rest} more`;
}

export const flushPendingItemAddNotificationsFn = onSchedule(
  { ...SCHEDULER_CONFIG, schedule: 'every 1 hours' },
  async () => {
    const now = Date.now();
    const cutoff = Timestamp.fromMillis(now - IDLE_MS);
    logger.info('Flushing idle item-add notification batches', {
      cutoff: cutoff.toDate().toISOString(),
    });

    const snap = await db
      .collectionGroup(ITEM_ADD_NOTIFICATION_BATCHES_SUBCOLLECTION)
      .where('lastAddAt', '<=', cutoff)
      .get();

    if (snap.empty) {
      logger.info('No pending item-add batches to flush');
      return;
    }

    let flushed = 0;

    for (const doc of snap.docs) {
      const data = doc.data() as {
        householdId?: string;
        addedByUserId?: string;
        itemNames?: string[];
      };

      const householdId = data.householdId;
      const addedByUserId = data.addedByUserId;
      const itemNames = data.itemNames ?? [];

      if (!householdId || !addedByUserId) {
        logger.warn('Skipping malformed item-add batch doc', { path: doc.ref.path });
        await doc.ref.delete().catch(() => undefined);
        continue;
      }

      try {
        const household = await getHouseholdById(householdId);
        if (!household || !isHouseholdMember(household, addedByUserId)) {
          await doc.ref.delete();
          continue;
        }

        const displayName = await getAuthDisplayName(addedByUserId);
        const body = formatItemAddBody(displayName, itemNames);

        await sendNotificationToHouseholdMembers(
          household.memberIds,
          {
            title: 'Shopping list updated',
            body,
            type: 'items_added',
            deepLink: '/',
            data: {
              householdId,
              addedByUserId,
              itemCount: String(itemNames.length),
            },
          },
          new Set([addedByUserId])
        );

        await doc.ref.delete();
        flushed++;
      } catch (error) {
        logger.error('Failed to flush item-add batch', {
          path: doc.ref.path,
          error: error instanceof Error ? error.message : error,
        });
      }
    }

    logger.info('Item-add batch flush complete', { flushed, candidates: snap.size });
  }
);
