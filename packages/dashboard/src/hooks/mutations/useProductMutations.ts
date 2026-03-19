import { useMutation } from '@tanstack/react-query';
import { callManageProduct } from '@/lib/firebase';

export function useUpdateProduct() {
  return useMutation({
    mutationFn: async (data: {
      householdId: string;
      productId: string;
      name?: string;
      brand?: string | null;
      barcode?: string | null;
      shopId?: string | null;
      defaultQuantity?: number | null;
      unit?: string | null;
    }) => {
      const result = await callManageProduct({
        action: 'update',
        data,
      });
      return result.data;
    },
  });
}

export function useDeleteProduct() {
  return useMutation({
    mutationFn: async (data: { householdId: string; productId: string }) => {
      const result = await callManageProduct({
        action: 'delete',
        data,
      });
      return result.data;
    },
  });
}
