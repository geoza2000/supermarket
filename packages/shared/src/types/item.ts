import { z } from 'zod';

export interface ShoppingItem {
  itemId: string;
  householdId: string;
  productId: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  shopId: string | null;
  category: string | null;
  completed: boolean;
  completedBy: string | null;
  completedAt: Date | null;
  addedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShoppingItemDocument {
  itemId: string;
  householdId: string;
  productId: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  shopId: string | null;
  category: string | null;
  completed: boolean;
  completedBy: string | null;
  completedAt: string | null;
  addedBy: string;
  createdAt: string;
  updatedAt: string;
}

export type ShoppingItemAction = 'add' | 'update' | 'complete' | 'uncomplete' | 'remove';

export interface AddItemInput {
  householdId: string;
  name: string;
  brand?: string | null;
  productId?: string;
  barcode?: string | null;
  quantity?: number | null;
  unit?: string | null;
  shopId?: string | null;
  category?: string | null;
}

export interface CompleteItemInput {
  householdId: string;
  itemId: string;
}

export interface UncompleteItemInput {
  householdId: string;
  itemId: string;
}

export interface UpdateItemInput {
  householdId: string;
  itemId: string;
  name?: string;
  quantity?: number | null;
  unit?: string | null;
  shopId?: string | null;
  category?: string | null;
}

export interface RemoveItemInput {
  householdId: string;
  itemId: string;
}

export type ManageShoppingItemInput =
  | { action: 'add'; data: AddItemInput }
  | { action: 'update'; data: UpdateItemInput }
  | { action: 'complete'; data: CompleteItemInput }
  | { action: 'uncomplete'; data: UncompleteItemInput }
  | { action: 'remove'; data: RemoveItemInput };

export interface CloseShoppingSessionInput {
  householdId: string;
  shopId?: string | null;
  closeAll?: boolean;
}

export interface CloseShoppingSessionResult {
  clearedCount: number;
  remainingCount: number;
  shopsUpdated: string[];
}

export const AddItemSchema = z.object({
  householdId: z.string().min(1),
  name: z.string().min(1).max(200).trim(),
  brand: z.string().max(200).nullable().optional(),
  productId: z.string().optional(),
  barcode: z.string().max(50).nullable().optional(),
  quantity: z.number().positive().nullable().optional(),
  unit: z.string().max(20).nullable().optional(),
  shopId: z.string().nullable().optional(),
  category: z.string().max(100).nullable().optional(),
});

export const CompleteItemSchema = z.object({
  householdId: z.string().min(1),
  itemId: z.string().min(1),
});

export const UncompleteItemSchema = z.object({
  householdId: z.string().min(1),
  itemId: z.string().min(1),
});

export const UpdateItemSchema = z.object({
  householdId: z.string().min(1),
  itemId: z.string().min(1),
  name: z.string().min(1).max(200).trim().optional(),
  quantity: z.number().positive().nullable().optional(),
  unit: z.string().max(20).nullable().optional(),
  shopId: z.string().nullable().optional(),
  category: z.string().max(100).nullable().optional(),
});

export const RemoveItemSchema = z.object({
  householdId: z.string().min(1),
  itemId: z.string().min(1),
});

export const ManageShoppingItemSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('add'), data: AddItemSchema }),
  z.object({ action: z.literal('update'), data: UpdateItemSchema }),
  z.object({ action: z.literal('complete'), data: CompleteItemSchema }),
  z.object({ action: z.literal('uncomplete'), data: UncompleteItemSchema }),
  z.object({ action: z.literal('remove'), data: RemoveItemSchema }),
]);

export const CloseShoppingSessionSchema = z.object({
  householdId: z.string().min(1),
  shopId: z.string().nullish().transform((v) => v ?? undefined),
  closeAll: z.boolean().nullish().transform((v) => v ?? undefined),
});

export function shoppingItemToDocument(item: ShoppingItem): ShoppingItemDocument {
  return {
    ...item,
    completedAt: item.completedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function documentToShoppingItem(doc: ShoppingItemDocument): ShoppingItem {
  return {
    ...doc,
    completedAt: doc.completedAt ? new Date(doc.completedAt) : null,
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
  };
}
