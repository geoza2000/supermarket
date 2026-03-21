import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { ManageShopSchema } from '@supermarket-list/shared';
import { getHouseholdById, isHouseholdMember } from '../services';
import { createShop, updateShop, deleteShop, reorderShops } from '../services/shop';
import { requireAuth } from '../utils/requireAuth';
import { CALLABLE_CONFIG } from '../config';

export const manageShopFn = onCall(CALLABLE_CONFIG, async (request) => {
  const userId = requireAuth(request);

  const parsed = ManageShopSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.message);
  }

  const { action, data } = parsed.data;
  const householdId = data.householdId;

  const household = await getHouseholdById(householdId);
  if (!household) {
    throw new HttpsError('not-found', 'Household not found');
  }
  if (!isHouseholdMember(household, userId)) {
    throw new HttpsError('permission-denied', 'You are not a member of this household');
  }

  logger.info('Managing shop', { userId, householdId, action });

  switch (action) {
    case 'create': {
      const shop = await createShop(data);
      return {
        shopId: shop.shopId,
        name: shop.name,
        visitPeriod: shop.visitPeriod,
        createdAt: shop.createdAt.toISOString(),
      };
    }
    case 'update': {
      await updateShop(data);
      return { success: true };
    }
    case 'delete': {
      await deleteShop(data.householdId, data.shopId);
      return { success: true };
    }
    case 'reorder': {
      await reorderShops(data);
      return { success: true };
    }
  }
});
