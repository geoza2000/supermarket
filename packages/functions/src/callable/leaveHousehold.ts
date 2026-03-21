import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { LeaveHouseholdSchema } from '@supermarket-list/shared';
import {
  getHouseholdById,
  isHouseholdMember,
  isHouseholdOwner,
  removeMemberFromHousehold,
  transferOwnership,
  deleteHousehold,
} from '../services';
import { requireAuth } from '../utils/requireAuth';
import { CALLABLE_CONFIG } from '../config';
import { db } from '../admin';
import { USERS_COLLECTION } from '../services/user/constants';

export const leaveHouseholdFn = onCall(CALLABLE_CONFIG, async (request) => {
  const userId = requireAuth(request);

  const parsed = LeaveHouseholdSchema.safeParse(request.data);
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

  logger.info('Leaving household', { userId, householdId: parsed.data.householdId });

  if (isHouseholdOwner(household, userId)) {
    const otherMembers = household.memberIds.filter((id) => id !== userId);

    if (otherMembers.length === 0) {
      await deleteHousehold(parsed.data.householdId);
      await db.collection(USERS_COLLECTION).doc(userId).update({
        activeHouseholdId: null,
        updatedAt: new Date().toISOString(),
      });
      return { deleted: true };
    }

    await transferOwnership(parsed.data.householdId, otherMembers[0]);
  }

  await removeMemberFromHousehold(parsed.data.householdId, userId);

  await db.collection(USERS_COLLECTION).doc(userId).update({
    activeHouseholdId: null,
    updatedAt: new Date().toISOString(),
  });

  return { deleted: false };
});
