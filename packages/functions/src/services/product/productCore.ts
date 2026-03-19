import { db } from '../../admin';
import type {
  Product,
  ProductDocument,
  CreateProductInput,
  UpdateProductInput,
} from '@supermarket-list/shared';
import { productToDocument, documentToProduct } from '@supermarket-list/shared';
import { HOUSEHOLDS_COLLECTION } from '../household/constants';
import { PRODUCTS_SUBCOLLECTION } from './constants';

function productsCollection(householdId: string) {
  return db
    .collection(HOUSEHOLDS_COLLECTION)
    .doc(householdId)
    .collection(PRODUCTS_SUBCOLLECTION);
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const now = new Date();
  const docRef = productsCollection(input.householdId).doc();

  const product: Product = {
    productId: docRef.id,
    householdId: input.householdId,
    name: input.name,
    brand: input.brand ?? null,
    barcode: input.barcode ?? null,
    shopId: input.shopId ?? null,
    defaultQuantity: input.defaultQuantity ?? null,
    unit: input.unit ?? null,
    createdAt: now,
    updatedAt: now,
  };

  await docRef.set(productToDocument(product));
  return product;
}

export async function getProductById(
  householdId: string,
  productId: string
): Promise<Product | null> {
  const doc = await productsCollection(householdId).doc(productId).get();
  if (!doc.exists) return null;
  return documentToProduct(doc.data() as ProductDocument);
}

export async function findProductByName(
  householdId: string,
  name: string
): Promise<Product | null> {
  const snapshot = await productsCollection(householdId)
    .where('name', '==', name)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  return documentToProduct(snapshot.docs[0].data() as ProductDocument);
}

export async function findProductByBarcode(
  householdId: string,
  barcode: string
): Promise<Product | null> {
  const snapshot = await productsCollection(householdId)
    .where('barcode', '==', barcode)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  return documentToProduct(snapshot.docs[0].data() as ProductDocument);
}

export async function updateProduct(input: UpdateProductInput): Promise<void> {
  const updateData: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.brand !== undefined) updateData.brand = input.brand;
  if (input.barcode !== undefined) updateData.barcode = input.barcode;
  if (input.shopId !== undefined) updateData.shopId = input.shopId;
  if (input.defaultQuantity !== undefined) updateData.defaultQuantity = input.defaultQuantity;
  if (input.unit !== undefined) updateData.unit = input.unit;

  await productsCollection(input.householdId).doc(input.productId).update(updateData);
}

export async function deleteProduct(
  householdId: string,
  productId: string
): Promise<void> {
  await productsCollection(householdId).doc(productId).delete();
}
