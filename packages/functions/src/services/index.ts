// Notification service
export {
  sendNotification,
  sendNotificationToUser,
  type SendNotificationOptions,
  type SendNotificationResult,
  type SendNotificationToUserResult,
} from './notification';

// User service
export {
  createUser,
  getUserById,
  getUserProfile,
  addFcmToken,
  removeFcmToken,
  removeInvalidFcmTokens,
  updateUserSettings,
} from './user';

// Household service
export {
  createHousehold,
  getHouseholdById,
  updateHouseholdName,
  addMemberToHousehold,
  removeMemberFromHousehold,
  transferOwnership,
  deleteHousehold,
  isHouseholdMember,
  isHouseholdOwner,
  HOUSEHOLDS_COLLECTION,
} from './household';

// Invitation service
export {
  createInvitation,
  getInvitationByToken,
  getInvitationDetails,
  acceptInvitation,
  revokeInvitation,
  getInvitationById,
  INVITATIONS_COLLECTION,
} from './invitation';

// Shop service
export {
  createShop,
  getShopById,
  getShopsByHousehold,
  reorderShops,
  updateShop,
  deleteShop,
  updateShopLastVisited,
  computeVisitDueDate,
  getShopsDueForVisit,
  updateShopLastNotified,
  type ShopDueForVisit,
  SHOPS_SUBCOLLECTION,
} from './shop';

// Product service
export {
  createProduct,
  getProductById,
  findProductByName,
  findProductByBarcode,
  updateProduct,
  deleteProduct,
  PRODUCTS_SUBCOLLECTION,
} from './product';

// Shopping list service
export {
  addItem,
  completeItem,
  uncompleteItem,
  removeItem,
  closeShoppingSession,
  ITEMS_SUBCOLLECTION,
} from './shoppingList';
