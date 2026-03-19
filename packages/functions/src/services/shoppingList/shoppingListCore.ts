import { db } from '../../admin';
import type {
  ShoppingItem,
  ShoppingItemDocument,
  AddItemInput,
  UpdateItemInput,
  CloseShoppingSessionResult,
} from '@supermarket-list/shared';
import {
  shoppingItemToDocument,
  documentToShoppingItem,
} from '@supermarket-list/shared';
import { HOUSEHOLDS_COLLECTION } from '../household/constants';
import { ITEMS_SUBCOLLECTION } from './constants';
import { SHOPS_SUBCOLLECTION } from '../shop/constants';
import {
  createProduct,
  findProductByName,
  findProductByBarcode,
  updateProduct,
} from '../product';

function itemsCollection(householdId: string) {
  return db
    .collection(HOUSEHOLDS_COLLECTION)
    .doc(householdId)
    .collection(ITEMS_SUBCOLLECTION);
}

export async function addItem(
  input: AddItemInput,
  userId: string
): Promise<ShoppingItem> {
  const now = new Date();

  let productId = input.productId;
  let brand = input.brand ?? null;
  let shopId = input.shopId ?? null;
  let quantity = input.quantity ?? null;
  let unit = input.unit ?? null;

  if (!productId) {
    let existingProduct = null;

    if (input.barcode) {
      existingProduct = await findProductByBarcode(input.householdId, input.barcode);
    }
    if (!existingProduct) {
      existingProduct = await findProductByName(input.householdId, input.name);
    }

    if (existingProduct) {
      productId = existingProduct.productId;
      brand = brand ?? existingProduct.brand;
      shopId = shopId ?? existingProduct.shopId;
      quantity = quantity ?? existingProduct.defaultQuantity;
      unit = unit ?? existingProduct.unit;
    } else {
      const newProduct = await createProduct({
        householdId: input.householdId,
        name: input.name,
        brand: input.brand ?? null,
        barcode: input.barcode ?? null,
        shopId,
        defaultQuantity: quantity,
        unit,
      });
      productId = newProduct.productId;
    }
  }

  const docRef = itemsCollection(input.householdId).doc();

  const item: ShoppingItem = {
    itemId: docRef.id,
    householdId: input.householdId,
    productId: productId!,
    name: input.name,
    brand,
    quantity,
    unit,
    shopId,
    completed: false,
    completedBy: null,
    completedAt: null,
    addedBy: userId,
    createdAt: now,
    updatedAt: now,
  };

  await docRef.set(shoppingItemToDocument(item));
  return item;
}

export async function updateItem(input: UpdateItemInput): Promise<void> {
  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (input.name !== undefined) updates.name = input.name;
  if (input.quantity !== undefined) updates.quantity = input.quantity;
  if (input.unit !== undefined) updates.unit = input.unit;
  if (input.shopId !== undefined) updates.shopId = input.shopId;

  const itemRef = itemsCollection(input.householdId).doc(input.itemId);
  await itemRef.update(updates);

  const hasConfigChanges =
    input.name !== undefined ||
    input.shopId !== undefined;

  if (hasConfigChanges) {
    const itemDoc = await itemRef.get();
    if (itemDoc.exists) {
      const item = itemDoc.data() as ShoppingItemDocument;
      const productUpdate: Parameters<typeof updateProduct>[0] = {
        householdId: input.householdId,
        productId: item.productId,
      };
      if (input.name !== undefined) productUpdate.name = input.name;
      if (input.shopId !== undefined) productUpdate.shopId = input.shopId;
      await updateProduct(productUpdate);
    }
  }
}

export async function completeItem(
  householdId: string,
  itemId: string,
  userId: string
): Promise<void> {
  const now = new Date().toISOString();
  await itemsCollection(householdId).doc(itemId).update({
    completed: true,
    completedBy: userId,
    completedAt: now,
    updatedAt: now,
  });
}

export async function uncompleteItem(
  householdId: string,
  itemId: string
): Promise<void> {
  await itemsCollection(householdId).doc(itemId).update({
    completed: false,
    completedBy: null,
    completedAt: null,
    updatedAt: new Date().toISOString(),
  });
}

export async function removeItem(
  householdId: string,
  itemId: string
): Promise<void> {
  await itemsCollection(householdId).doc(itemId).delete();
}

export async function updateItemsByProductId(
  householdId: string,
  productId: string,
  updates: { name?: string; shopId?: string | null }
): Promise<void> {
  const snapshot = await itemsCollection(householdId)
    .where('productId', '==', productId)
    .get();

  if (snapshot.empty) return;

  const batch = db.batch();
  const now = new Date().toISOString();

  const updateData: Record<string, unknown> = { updatedAt: now };
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.shopId !== undefined) updateData.shopId = updates.shopId;

  for (const doc of snapshot.docs) {
    batch.update(doc.ref, updateData);
  }

  await batch.commit();
}

export async function closeShoppingSession(
  householdId: string,
  shopId?: string | null,
  closeAll?: boolean
): Promise<CloseShoppingSessionResult> {
  const householdRef = db.collection(HOUSEHOLDS_COLLECTION).doc(householdId);
  let clearedCount = 0;
  let remainingCount = 0;
  const shopsUpdated: string[] = [];

  if (closeAll) {
    const allItems = await itemsCollection(householdId).get();
    const batch = db.batch();

    const shopIdsToUpdate = new Set<string>();

    for (const doc of allItems.docs) {
      const item = doc.data() as ShoppingItemDocument;
      if (item.completed) {
        batch.delete(doc.ref);
        clearedCount++;
        if (item.shopId) shopIdsToUpdate.add(item.shopId);
      } else {
        remainingCount++;
      }
    }

    const now = new Date().toISOString();
    for (const sid of shopIdsToUpdate) {
      batch.update(
        householdRef.collection(SHOPS_SUBCOLLECTION).doc(sid),
        { lastVisitedAt: now, updatedAt: now }
      );
      shopsUpdated.push(sid);
    }

    await batch.commit();
  } else {
    let query: FirebaseFirestore.Query = itemsCollection(householdId);
    if (shopId) {
      query = query.where('shopId', '==', shopId);
    } else {
      query = query.where('shopId', '==', null);
    }

    const snapshot = await query.get();
    const batch = db.batch();

    for (const doc of snapshot.docs) {
      const item = doc.data() as ShoppingItemDocument;
      if (item.completed) {
        batch.delete(doc.ref);
        clearedCount++;
      } else {
        remainingCount++;
      }
    }

    if (shopId) {
      const now = new Date().toISOString();
      batch.update(
        householdRef.collection(SHOPS_SUBCOLLECTION).doc(shopId),
        { lastVisitedAt: now, updatedAt: now }
      );
      shopsUpdated.push(shopId);
    }

    await batch.commit();
  }

  return { clearedCount, remainingCount, shopsUpdated };
}
