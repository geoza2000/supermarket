import { sendNotificationToUser } from './notificationCore';
import type { SendNotificationOptions } from './types';

/**
 * Send the same notification to household members, optionally excluding some user IDs.
 */
export async function sendNotificationToHouseholdMembers(
  memberIds: string[],
  options: SendNotificationOptions,
  excludeUserIds: ReadonlySet<string> = new Set()
): Promise<void> {
  const targets = memberIds.filter((id) => !excludeUserIds.has(id));
  await Promise.all(targets.map((memberId) => sendNotificationToUser(memberId, options)));
}
