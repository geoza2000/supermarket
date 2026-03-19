import { HttpsError } from 'firebase-functions/v2/https';
import { db } from '../../admin';
import type {
  Shop,
  ShopDocument,
  CreateShopInput,
  UpdateShopInput,
  VisitPeriod,
  ReorderShopsInput,
} from '@supermarket-list/shared';
import {
  shopToDocument,
  documentToShop,
  sortShopDocumentsByDisplayOrder,
} from '@supermarket-list/shared';
import { HOUSEHOLDS_COLLECTION } from '../household/constants';
import { SHOPS_SUBCOLLECTION } from './constants';
import { ITEMS_SUBCOLLECTION } from '../shoppingList/constants';
import { PRODUCTS_SUBCOLLECTION } from '../product/constants';

function shopsCollection(householdId: string) {
  return db
    .collection(HOUSEHOLDS_COLLECTION)
    .doc(householdId)
    .collection(SHOPS_SUBCOLLECTION);
}

export async function createShop(input: CreateShopInput): Promise<Shop> {
  const now = new Date();
  const docRef = shopsCollection(input.householdId).doc();
  const snapshot = await shopsCollection(input.householdId).get();
  let maxOrder = -1;
  for (const d of snapshot.docs) {
    const data = d.data() as ShopDocument;
    if (typeof data.sortOrder === 'number' && data.sortOrder > maxOrder) {
      maxOrder = data.sortOrder;
    }
  }

  const shop: Shop = {
    shopId: docRef.id,
    householdId: input.householdId,
    name: input.name,
    visitPeriod: input.visitPeriod ?? null,
    lastVisitedAt: null,
    lastNotifiedAt: null,
    sortOrder: maxOrder + 1,
    createdAt: now,
    updatedAt: now,
  };

  await docRef.set(shopToDocument(shop));
  return shop;
}

export async function getShopById(
  householdId: string,
  shopId: string
): Promise<Shop | null> {
  const doc = await shopsCollection(householdId).doc(shopId).get();
  if (!doc.exists) return null;
  return documentToShop(doc.data() as ShopDocument);
}

export async function getShopsByHousehold(
  householdId: string
): Promise<Shop[]> {
  const snapshot = await shopsCollection(householdId).get();
  const docs = snapshot.docs.map((doc) => doc.data() as ShopDocument);
  const sorted = sortShopDocumentsByDisplayOrder(docs);
  return sorted.map((d) => documentToShop(d));
}

export async function reorderShops(input: ReorderShopsInput): Promise<void> {
  const coll = shopsCollection(input.householdId);
  const snapshot = await coll.get();
  const existing = new Set(snapshot.docs.map((d) => d.id));

  if (input.orderedShopIds.length !== existing.size) {
    throw new HttpsError(
      'invalid-argument',
      'orderedShopIds must list every shop once'
    );
  }

  const seen = new Set<string>();
  for (const id of input.orderedShopIds) {
    if (!existing.has(id) || seen.has(id)) {
      throw new HttpsError(
        'invalid-argument',
        'orderedShopIds must list every shop once'
      );
    }
    seen.add(id);
  }

  const batch = db.batch();
  const now = new Date().toISOString();
  input.orderedShopIds.forEach((shopId, index) => {
    batch.update(coll.doc(shopId), { sortOrder: index, updatedAt: now });
  });
  await batch.commit();
}

export async function updateShop(input: UpdateShopInput): Promise<void> {
  const updateData: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.visitPeriod !== undefined) updateData.visitPeriod = input.visitPeriod;

  await shopsCollection(input.householdId).doc(input.shopId).update(updateData);
}

export async function deleteShop(
  householdId: string,
  shopId: string
): Promise<void> {
  const householdRef = db.collection(HOUSEHOLDS_COLLECTION).doc(householdId);

  const [itemsSnapshot, productsSnapshot] = await Promise.all([
    householdRef
      .collection(ITEMS_SUBCOLLECTION)
      .where('shopId', '==', shopId)
      .get(),
    householdRef
      .collection(PRODUCTS_SUBCOLLECTION)
      .where('shopId', '==', shopId)
      .get(),
  ]);

  const batch = db.batch();

  const now = new Date().toISOString();
  for (const doc of itemsSnapshot.docs) {
    batch.update(doc.ref, { shopId: null, updatedAt: now });
  }
  for (const doc of productsSnapshot.docs) {
    batch.update(doc.ref, { shopId: null, updatedAt: now });
  }

  batch.delete(shopsCollection(householdId).doc(shopId));

  await batch.commit();
}

export async function updateShopLastVisited(
  householdId: string,
  shopId: string
): Promise<void> {
  await shopsCollection(householdId).doc(shopId).update({
    lastVisitedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export function computeVisitDueDate(
  referenceDate: Date,
  period: VisitPeriod
): Date {
  const due = new Date(referenceDate);
  switch (period.unit) {
    case 'days':
      due.setDate(due.getDate() + period.value);
      break;
    case 'weeks':
      due.setDate(due.getDate() + period.value * 7);
      break;
    case 'months':
      due.setMonth(due.getMonth() + period.value);
      break;
  }
  return due;
}

export interface ShopDueForVisit {
  shop: Shop;
  dueDate: Date;
}

/**
 * Returns all shops within a household that are overdue for a visit
 * and haven't been notified yet for the current period.
 */
export async function getShopsDueForVisit(
  householdId: string,
  now: Date = new Date()
): Promise<ShopDueForVisit[]> {
  const shops = await getShopsByHousehold(householdId);
  const due: ShopDueForVisit[] = [];

  for (const shop of shops) {
    if (!shop.visitPeriod) continue;

    const referenceDate = shop.lastVisitedAt ?? shop.createdAt;
    const dueDate = computeVisitDueDate(referenceDate, shop.visitPeriod);

    if (now < dueDate) continue;

    // Skip if we already notified for this overdue period
    if (shop.lastNotifiedAt && shop.lastNotifiedAt >= dueDate) continue;

    due.push({ shop, dueDate });
  }

  return due;
}

export async function updateShopLastNotified(
  householdId: string,
  shopId: string
): Promise<void> {
  const now = new Date().toISOString();
  await shopsCollection(householdId).doc(shopId).update({
    lastNotifiedAt: now,
    updatedAt: now,
  });
}
