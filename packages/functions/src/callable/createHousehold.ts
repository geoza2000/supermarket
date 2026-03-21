import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { CreateHouseholdSchema } from '@supermarket-list/shared';
import { createHousehold } from '../services';
import { requireAuth } from '../utils/requireAuth';
import { CALLABLE_CONFIG } from '../config';

export const createHouseholdFn = onCall(CALLABLE_CONFIG, async (request) => {
  const userId = requireAuth(request);

  const parsed = CreateHouseholdSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.message);
  }

  logger.info('Creating household', { userId, name: parsed.data.name });

  const household = await createHousehold(parsed.data, userId);

  return {
    householdId: household.householdId,
    name: household.name,
    ownerId: household.ownerId,
    memberIds: household.memberIds,
    plan: household.plan,
    createdAt: household.createdAt.toISOString(),
  };
});
