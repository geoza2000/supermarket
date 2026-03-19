import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { ManageProductSchema } from '@supermarket-list/shared';
import { getHouseholdById, isHouseholdMember } from '../services';
import { createProduct, updateProduct, deleteProduct } from '../services/product';
import { updateItemsByProductId } from '../services/shoppingList';
import { requireAllowedUser } from '../utils/requireAllowedUser';
import { CALLABLE_CONFIG } from '../config';

export const manageProductFn = onCall(CALLABLE_CONFIG, async (request) => {
  const userId = requireAllowedUser(request);

  const parsed = ManageProductSchema.safeParse(request.data);
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

  logger.info('Managing product', { userId, householdId, action });

  switch (action) {
    case 'create': {
      const product = await createProduct(data);
      return {
        productId: product.productId,
        name: product.name,
        barcode: product.barcode,
        shopId: product.shopId,
        defaultQuantity: product.defaultQuantity,
        unit: product.unit,
        createdAt: product.createdAt.toISOString(),
      };
    }
    case 'update': {
      await updateProduct(data);

      const configUpdates: { name?: string; shopId?: string | null } = {};
      if (data.name !== undefined) configUpdates.name = data.name;
      if (data.shopId !== undefined) configUpdates.shopId = data.shopId;

      if (Object.keys(configUpdates).length > 0) {
        await updateItemsByProductId(householdId, data.productId, configUpdates);
      }

      return { success: true };
    }
    case 'delete': {
      await deleteProduct(data.householdId, data.productId);
      return { success: true };
    }
  }
});
