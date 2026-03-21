import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { SetActiveHouseholdSchema } from '@supermarket-list/shared';
import { getHouseholdById, isHouseholdMember } from '../services';
import { requireAuth } from '../utils/requireAuth';
import { CALLABLE_CONFIG } from '../config';
import { db } from '../admin';
import { USERS_COLLECTION } from '../services/user/constants';

export const setActiveHouseholdFn = onCall(CALLABLE_CONFIG, async (request) => {
  const userId = requireAuth(request);

  const parsed = SetActiveHouseholdSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.message);
  }

  const household = await getHouseholdById(parsed.data.householdId);
  if (!household) {
    throw new HttpsError('not-found', 'Household not found');
  }

  if (!isHouseholdMember(household, userId)) {
    throw new HttpsError('permission-denied', 'You are not a member of this household');
  }

  await db.collection(USERS_COLLECTION).doc(userId).update({
    activeHouseholdId: parsed.data.householdId,
    updatedAt: new Date().toISOString(),
  });

  return { success: true };
});
