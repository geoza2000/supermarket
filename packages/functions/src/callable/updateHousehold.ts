import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { UpdateHouseholdSchema } from '@supermarket-list/shared';
import {
  getHouseholdById,
  isHouseholdOwner,
  updateHouseholdName,
} from '../services';
import { requireAuth } from '../utils/requireAuth';
import { CALLABLE_CONFIG } from '../config';

export const updateHouseholdFn = onCall(CALLABLE_CONFIG, async (request) => {
  const userId = requireAuth(request);

  const parsed = UpdateHouseholdSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.message);
  }

  const household = await getHouseholdById(parsed.data.householdId);
  if (!household) {
    throw new HttpsError('not-found', 'Household not found');
  }

  if (!isHouseholdOwner(household, userId)) {
    throw new HttpsError('permission-denied', 'Only the owner can update the household');
  }

  logger.info('Updating household', { userId, householdId: parsed.data.householdId });

  await updateHouseholdName(parsed.data.householdId, parsed.data.name);

  return { success: true };
});
