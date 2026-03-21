import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { AcceptInvitationSchema } from '@supermarket-list/shared';
import {
  acceptInvitation,
  addMemberToHousehold,
  getHouseholdById,
  isHouseholdMember,
} from '../services';
import { requireAuth } from '../utils/requireAuth';
import { CALLABLE_CONFIG } from '../config';

export const acceptInvitationFn = onCall(CALLABLE_CONFIG, async (request) => {
  const userId = requireAuth(request);

  const parsed = AcceptInvitationSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.message);
  }

  logger.info('Accepting invitation', { userId, token: parsed.data.token.slice(0, 8) + '...' });

  let householdId: string;
  try {
    const result = await acceptInvitation(parsed.data.token, userId);
    householdId = result.householdId;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to accept invitation';
    throw new HttpsError('failed-precondition', message);
  }

  const household = await getHouseholdById(householdId);
  if (!household) {
    throw new HttpsError('not-found', 'Household no longer exists');
  }

  if (isHouseholdMember(household, userId)) {
    return {
      householdId,
      householdName: household.name,
      alreadyMember: true,
    };
  }

  await addMemberToHousehold(householdId, userId);

  return {
    householdId,
    householdName: household.name,
    alreadyMember: false,
  };
});
