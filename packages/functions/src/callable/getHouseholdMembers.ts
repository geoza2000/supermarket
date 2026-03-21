import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { admin } from '../admin';
import { getHouseholdById, isHouseholdMember } from '../services';
import { requireAuth } from '../utils/requireAuth';
import { CALLABLE_CONFIG } from '../config';
import type { HouseholdMember } from '@supermarket-list/shared';

export const getHouseholdMembersFn = onCall(CALLABLE_CONFIG, async (request) => {
  const userId = requireAuth(request);

  const { householdId } = request.data as { householdId: string };
  if (!householdId) {
    throw new HttpsError('invalid-argument', 'householdId is required');
  }

  const household = await getHouseholdById(householdId);
  if (!household) {
    throw new HttpsError('not-found', 'Household not found');
  }

  if (!isHouseholdMember(household, userId)) {
    throw new HttpsError('permission-denied', 'You are not a member of this household');
  }

  const members: HouseholdMember[] = await Promise.all(
    household.memberIds.map(async (uid) => {
      try {
        const userRecord = await admin.auth().getUser(uid);
        return {
          userId: uid,
          displayName: userRecord.displayName ?? null,
          photoUrl: userRecord.photoURL ?? null,
          email: userRecord.email ?? null,
        };
      } catch {
        return {
          userId: uid,
          displayName: null,
          photoUrl: null,
          email: null,
        };
      }
    })
  );

  return { members };
});
