import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { RevokeInvitationSchema } from '@supermarket-list/shared';
import {
  getInvitationById,
  revokeInvitation,
  getHouseholdById,
  isHouseholdOwner,
} from '../services';
import { requireAuth } from '../utils/requireAuth';
import { CALLABLE_CONFIG } from '../config';

export const revokeInvitationFn = onCall(CALLABLE_CONFIG, async (request) => {
  const userId = requireAuth(request);

  const parsed = RevokeInvitationSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.message);
  }

  const invitation = await getInvitationById(parsed.data.invitationId);
  if (!invitation) {
    throw new HttpsError('not-found', 'Invitation not found');
  }

  const isCreator = invitation.createdBy === userId;
  const household = await getHouseholdById(invitation.householdId);
  const isOwner = household ? isHouseholdOwner(household, userId) : false;

  if (!isCreator && !isOwner) {
    throw new HttpsError(
      'permission-denied',
      'Only the invitation creator or household owner can revoke'
    );
  }

  logger.info('Revoking invitation', { userId, invitationId: parsed.data.invitationId });

  await revokeInvitation(parsed.data.invitationId);

  return { success: true };
});
