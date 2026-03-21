import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { CreateInvitationSchema } from '@supermarket-list/shared';
import {
  getHouseholdById,
  isHouseholdMember,
  createInvitation,
} from '../services';
import { requireAuth } from '../utils/requireAuth';
import { CALLABLE_CONFIG } from '../config';

export const createInvitationFn = onCall(CALLABLE_CONFIG, async (request) => {
  const userId = requireAuth(request);

  const parsed = CreateInvitationSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.message);
  }

  const { householdId, maxUses, expiryHours } = parsed.data;

  const household = await getHouseholdById(householdId);
  if (!household) {
    throw new HttpsError('not-found', 'Household not found');
  }

  if (!isHouseholdMember(household, userId)) {
    throw new HttpsError('permission-denied', 'You are not a member of this household');
  }

  logger.info('Creating invitation', { userId, householdId });

  const invitation = await createInvitation(
    householdId,
    household.name,
    userId,
    maxUses,
    expiryHours
  );

  return {
    invitationId: invitation.invitationId,
    token: invitation.token,
    expiresAt: invitation.expiresAt.toISOString(),
    maxUses: invitation.maxUses,
  };
});
