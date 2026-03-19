import { z } from 'zod';

export type VisitPeriodUnit = 'days' | 'weeks' | 'months';

export interface VisitPeriod {
  value: number;
  unit: VisitPeriodUnit;
}

export interface Shop {
  shopId: string;
  householdId: string;
  name: string;
  visitPeriod: VisitPeriod | null;
  lastVisitedAt: Date | null;
  lastNotifiedAt: Date | null;
  /** Lower values appear first. Null for legacy documents before ordering existed. */
  sortOrder: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShopDocument {
  shopId: string;
  householdId: string;
  name: string;
  visitPeriod: VisitPeriod | null;
  lastVisitedAt: string | null;
  lastNotifiedAt: string | null;
  /** When missing, clients fall back to createdAt / name for ordering. */
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export type ShopAction = 'create' | 'update' | 'delete';

export interface CreateShopInput {
  householdId: string;
  name: string;
  visitPeriod?: VisitPeriod | null;
}

export interface UpdateShopInput {
  householdId: string;
  shopId: string;
  name?: string;
  visitPeriod?: VisitPeriod | null;
}

export interface DeleteShopInput {
  householdId: string;
  shopId: string;
}

export interface ReorderShopsInput {
  householdId: string;
  /** Every shop id in the household, in desired display order */
  orderedShopIds: string[];
}

export type ManageShopInput =
  | { action: 'create'; data: CreateShopInput }
  | { action: 'update'; data: UpdateShopInput }
  | { action: 'delete'; data: DeleteShopInput }
  | { action: 'reorder'; data: ReorderShopsInput };

const VisitPeriodSchema = z.object({
  value: z.number().int().min(1).max(365),
  unit: z.enum(['days', 'weeks', 'months']),
});

export const CreateShopSchema = z.object({
  householdId: z.string().min(1),
  name: z.string().min(1).max(100).trim(),
  visitPeriod: VisitPeriodSchema.nullable().optional(),
});

export const UpdateShopSchema = z.object({
  householdId: z.string().min(1),
  shopId: z.string().min(1),
  name: z.string().min(1).max(100).trim().optional(),
  visitPeriod: VisitPeriodSchema.nullable().optional(),
});

export const DeleteShopSchema = z.object({
  householdId: z.string().min(1),
  shopId: z.string().min(1),
});

export const ReorderShopsSchema = z.object({
  householdId: z.string().min(1),
  orderedShopIds: z.array(z.string().min(1)),
});

export const ManageShopSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('create'), data: CreateShopSchema }),
  z.object({ action: z.literal('update'), data: UpdateShopSchema }),
  z.object({ action: z.literal('delete'), data: DeleteShopSchema }),
  z.object({ action: z.literal('reorder'), data: ReorderShopsSchema }),
]);

export function shopToDocument(shop: Shop): ShopDocument {
  const doc: ShopDocument = {
    shopId: shop.shopId,
    householdId: shop.householdId,
    name: shop.name,
    visitPeriod: shop.visitPeriod,
    lastVisitedAt: shop.lastVisitedAt?.toISOString() ?? null,
    lastNotifiedAt: shop.lastNotifiedAt?.toISOString() ?? null,
    createdAt: shop.createdAt.toISOString(),
    updatedAt: shop.updatedAt.toISOString(),
  };
  if (shop.sortOrder != null) {
    doc.sortOrder = shop.sortOrder;
  }
  return doc;
}

export function documentToShop(doc: ShopDocument): Shop {
  return {
    ...doc,
    sortOrder: typeof doc.sortOrder === 'number' ? doc.sortOrder : null,
    lastVisitedAt: doc.lastVisitedAt ? new Date(doc.lastVisitedAt) : null,
    lastNotifiedAt: doc.lastNotifiedAt ? new Date(doc.lastNotifiedAt) : null,
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
  };
}

/** Stable ordering for shops on the dashboard and shopping list (mobile-first list order). */
export function sortShopDocumentsByDisplayOrder(
  shops: ShopDocument[]
): ShopDocument[] {
  return [...shops].sort((a, b) => {
    const ao = a.sortOrder;
    const bo = b.sortOrder;
    if (ao != null && bo != null && ao !== bo) return ao - bo;
    if (ao != null && bo == null) return -1;
    if (ao == null && bo != null) return 1;
    return a.createdAt.localeCompare(b.createdAt) || a.name.localeCompare(b.name);
  });
}
