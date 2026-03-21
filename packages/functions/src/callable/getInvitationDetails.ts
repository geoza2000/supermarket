import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { GetInvitationDetailsSchema } from '@supermarket-list/shared';
import { getInvitationDetails } from '../services';
import { requireAuth } from '../utils/requireAuth';
import { CALLABLE_CONFIG } from '../config';

export const getInvitationDetailsFn = onCall(CALLABLE_CONFIG, async (request) => {
  requireAuth(request);

  const parsed = GetInvitationDetailsSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.message);
  }

  const details = await getInvitationDetails(parsed.data.token);
  if (!details) {
    throw new HttpsError('not-found', 'Invitation not found');
  }

  return details;
});
