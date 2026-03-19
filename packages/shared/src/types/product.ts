import { z } from 'zod';

export interface Product {
  productId: string;
  householdId: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  shopId: string | null;
  category: string | null;
  defaultQuantity: number | null;
  unit: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductDocument {
  productId: string;
  householdId: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  shopId: string | null;
  category: string | null;
  defaultQuantity: number | null;
  unit: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ProductAction = 'create' | 'update' | 'delete';

export interface CreateProductInput {
  householdId: string;
  name: string;
  brand?: string | null;
  barcode?: string | null;
  shopId?: string | null;
  category?: string | null;
  defaultQuantity?: number | null;
  unit?: string | null;
}

export interface UpdateProductInput {
  householdId: string;
  productId: string;
  name?: string;
  brand?: string | null;
  barcode?: string | null;
  shopId?: string | null;
  category?: string | null;
  defaultQuantity?: number | null;
  unit?: string | null;
}

export interface DeleteProductInput {
  householdId: string;
  productId: string;
}

export type ManageProductInput =
  | { action: 'create'; data: CreateProductInput }
  | { action: 'update'; data: UpdateProductInput }
  | { action: 'delete'; data: DeleteProductInput };

export const CreateProductSchema = z.object({
  householdId: z.string().min(1),
  name: z.string().min(1).max(200).trim(),
  brand: z.string().max(200).nullable().optional(),
  barcode: z.string().max(50).nullable().optional(),
  shopId: z.string().nullable().optional(),
  category: z.string().max(100).nullable().optional(),
  defaultQuantity: z.number().positive().nullable().optional(),
  unit: z.string().max(20).nullable().optional(),
});

export const UpdateProductSchema = z.object({
  householdId: z.string().min(1),
  productId: z.string().min(1),
  name: z.string().min(1).max(200).trim().optional(),
  brand: z.string().max(200).nullable().optional(),
  barcode: z.string().max(50).nullable().optional(),
  shopId: z.string().nullable().optional(),
  category: z.string().max(100).nullable().optional(),
  defaultQuantity: z.number().positive().nullable().optional(),
  unit: z.string().max(20).nullable().optional(),
});

export const DeleteProductSchema = z.object({
  householdId: z.string().min(1),
  productId: z.string().min(1),
});

export const ManageProductSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('create'), data: CreateProductSchema }),
  z.object({ action: z.literal('update'), data: UpdateProductSchema }),
  z.object({ action: z.literal('delete'), data: DeleteProductSchema }),
]);

export function productToDocument(product: Product): ProductDocument {
  return {
    ...product,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export function documentToProduct(doc: ProductDocument): Product {
  return {
    ...doc,
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
  };
}
