import { useMutation } from '@tanstack/react-query';
import {
  callManageShoppingItem,
  callCloseShoppingSession,
} from '@/lib/firebase';

export function useAddItem() {
  return useMutation({
    mutationFn: async (data: {
      householdId: string;
      name: string;
      brand?: string | null;
      productId?: string;
      barcode?: string | null;
      quantity?: number | null;
      unit?: string | null;
      shopId?: string | null;
      category?: string | null;
    }) => {
      const result = await callManageShoppingItem({
        action: 'add',
        data,
      });
      return result.data;
    },
  });
}

export function useUpdateItem() {
  return useMutation({
    mutationFn: async (data: {
      householdId: string;
      itemId: string;
      name?: string;
      quantity?: number | null;
      unit?: string | null;
      shopId?: string | null;
      category?: string | null;
    }) => {
      const result = await callManageShoppingItem({
        action: 'update',
        data,
      });
      return result.data;
    },
  });
}

export function useCompleteItem() {
  return useMutation({
    mutationFn: async ({ householdId, itemId }: { householdId: string; itemId: string }) => {
      const result = await callManageShoppingItem({
        action: 'complete',
        data: { householdId, itemId },
      });
      return result.data;
    },
  });
}

export function useUncompleteItem() {
  return useMutation({
    mutationFn: async ({ householdId, itemId }: { householdId: string; itemId: string }) => {
      const result = await callManageShoppingItem({
        action: 'uncomplete',
        data: { householdId, itemId },
      });
      return result.data;
    },
  });
}

export function useRemoveItem() {
  return useMutation({
    mutationFn: async ({ householdId, itemId }: { householdId: string; itemId: string }) => {
      const result = await callManageShoppingItem({
        action: 'remove',
        data: { householdId, itemId },
      });
      return result.data;
    },
  });
}

export function useCloseShoppingSession() {
  return useMutation({
    mutationFn: async ({
      householdId,
      shopId,
      closeAll,
    }: {
      householdId: string;
      shopId?: string | null;
      closeAll?: boolean;
    }) => {
      const result = await callCloseShoppingSession({
        householdId,
        shopId,
        closeAll,
      });
      return result.data;
    },
  });
}
