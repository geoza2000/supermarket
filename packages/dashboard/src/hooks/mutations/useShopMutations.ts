import { useMutation } from '@tanstack/react-query';
import { callManageShop } from '@/lib/firebase';
import type { VisitPeriod } from '@supermarket-list/shared';

export function useCreateShop() {
  return useMutation({
    mutationFn: async ({
      householdId,
      name,
      visitPeriod,
    }: {
      householdId: string;
      name: string;
      visitPeriod?: VisitPeriod | null;
    }) => {
      const result = await callManageShop({
        action: 'create',
        data: { householdId, name, visitPeriod },
      });
      return result.data;
    },
  });
}

export function useUpdateShop() {
  return useMutation({
    mutationFn: async ({
      householdId,
      shopId,
      name,
      visitPeriod,
    }: {
      householdId: string;
      shopId: string;
      name?: string;
      visitPeriod?: VisitPeriod | null;
    }) => {
      const result = await callManageShop({
        action: 'update',
        data: { householdId, shopId, name, visitPeriod },
      });
      return result.data;
    },
  });
}

export function useDeleteShop() {
  return useMutation({
    mutationFn: async ({
      householdId,
      shopId,
    }: {
      householdId: string;
      shopId: string;
    }) => {
      const result = await callManageShop({
        action: 'delete',
        data: { householdId, shopId },
      });
      return result.data;
    },
  });
}

export function useReorderShops() {
  return useMutation({
    mutationFn: async ({
      householdId,
      orderedShopIds,
    }: {
      householdId: string;
      orderedShopIds: string[];
    }) => {
      const result = await callManageShop({
        action: 'reorder',
        data: { householdId, orderedShopIds },
      });
      return result.data;
    },
  });
}
