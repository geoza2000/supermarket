import * as dotenv from 'dotenv';
dotenv.config();

import './admin';

// Callable (onCall) - Auth
export { getUserDetails } from './callable/getUserDetails';
export { manageFcmToken } from './callable/manageFcmToken';
export { sendTestNotification } from './callable/sendTestNotification';

// Callable (onCall) - Household
export { createHouseholdFn as createHousehold } from './callable/createHousehold';
export { getHouseholdMembersFn as getHouseholdMembers } from './callable/getHouseholdMembers';
export { updateHouseholdFn as updateHousehold } from './callable/updateHousehold';
export { leaveHouseholdFn as leaveHousehold } from './callable/leaveHousehold';
export { setActiveHouseholdFn as setActiveHousehold } from './callable/setActiveHousehold';

// Callable (onCall) - Invitations
export { createInvitationFn as createInvitation } from './callable/createInvitation';
export { getInvitationDetailsFn as getInvitationDetails } from './callable/getInvitationDetails';
export { acceptInvitationFn as acceptInvitation } from './callable/acceptInvitation';
export { revokeInvitationFn as revokeInvitation } from './callable/revokeInvitation';

// Callable (onCall) - Shops
export { manageShopFn as manageShop } from './callable/manageShop';

// Callable (onCall) - Products
export { manageProductFn as manageProduct } from './callable/manageProduct';

// Callable (onCall) - Shopping List
export { manageShoppingItemFn as manageShoppingItem } from './callable/manageShoppingItem';
export { closeShoppingSessionFn as closeShoppingSession } from './callable/closeShoppingSession';

// HTTP (onRequest)
export { healthCheck } from './https/healthCheck';

// Scheduler (onSchedule)
export { checkVisitRemindersFn as checkVisitReminders } from './scheduler/checkVisitReminders';
export { flushPendingItemAddNotificationsFn as flushPendingItemAddNotifications } from './scheduler/flushPendingItemAddNotifications';
