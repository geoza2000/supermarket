import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { CloseShoppingSessionSchema } from '@supermarket-list/shared';
import { getHouseholdById, isHouseholdMember } from '../services';
import { closeShoppingSession } from '../services/shoppingList';
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

  return result;
});
