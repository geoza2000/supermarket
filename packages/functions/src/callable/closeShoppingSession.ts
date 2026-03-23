import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { CloseShoppingSessionSchema } from '@supermarket-list/shared';
import {
  getHouseholdById,
  isHouseholdMember,
  sendNotificationToHouseholdMembers,
} from '../services';
import { closeShoppingSession } from '../services/shoppingList';
import { getAuthDisplayName } from '../utils/authDisplayName';
import { requireAuth } from '../utils/requireAuth';
import { CALLABLE_CONFIG } from '../config';

export const closeShoppingSessionFn = onCall(CALLABLE_CONFIG, async (request) => {
  const userId = requireAuth(request);

  const parsed = CloseShoppingSessionSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.message);
  }

  const { householdId, shopId, closeAll } = parsed.data;

  const household = await getHouseholdById(householdId);
  if (!household) {
    throw new HttpsError('not-found', 'Household not found');
  }
  if (!isHouseholdMember(household, userId)) {
    throw new HttpsError('permission-denied', 'You are not a member of this household');
  }

  logger.info('Closing shopping session', {
    userId,
    householdId,
    shopId: shopId ?? 'unassigned',
    closeAll,
  });

  const result = await closeShoppingSession(householdId, shopId, closeAll);

  if (result.clearedCount > 0) {
    try {
      const displayName = await getAuthDisplayName(userId);
      const n = result.clearedCount;
      const body =
        n === 1
          ? `${displayName} cleared 1 item from the shopping list`
          : `${displayName} cleared ${n} items from the shopping list`;

      await sendNotificationToHouseholdMembers(household.memberIds, {
        title: 'Shopping trip complete',
        body,
        type: 'shopping_complete',
        deepLink: '/',
        data: {
          householdId,
          clearedCount: String(n),
        },
      });
    } catch (error) {
      logger.error('Failed to send shopping-complete notifications', {
        householdId,
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  return result;
});
