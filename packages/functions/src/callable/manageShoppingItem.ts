import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { ManageShoppingItemSchema } from '@supermarket-list/shared';
import { getHouseholdById, isHouseholdMember } from '../services';
import {
  addItem,
  updateItem,
  completeItem,
  uncompleteItem,
  removeItem,
} from '../services/shoppingList';
import { requireAllowedUser } from '../utils/requireAllowedUser';
import { CALLABLE_CONFIG } from '../config';

export const manageShoppingItemFn = onCall(CALLABLE_CONFIG, async (request) => {
  const userId = requireAllowedUser(request);

  const parsed = ManageShoppingItemSchema.safeParse(request.data);
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

  logger.info('Managing shopping item', { userId, householdId, action });

  switch (action) {
    case 'add': {
      const item = await addItem(data, userId);
      return {
        itemId: item.itemId,
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        shopId: item.shopId,
        createdAt: item.createdAt.toISOString(),
      };
    }
    case 'update': {
      await updateItem(data);
      return { success: true };
    }
    case 'complete': {
      await completeItem(data.householdId, data.itemId, userId);
      return { success: true };
    }
    case 'uncomplete': {
      await uncompleteItem(data.householdId, data.itemId);
      return { success: true };
    }
    case 'remove': {
      await removeItem(data.householdId, data.itemId);
      return { success: true };
    }
  }
});
