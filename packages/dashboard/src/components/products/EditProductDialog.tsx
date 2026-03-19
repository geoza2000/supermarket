import { useState, useEffect } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useUpdateProduct } from '@/hooks/mutations';
import type { ProductDocument, ShopDocument } from '@supermarket-list/shared';

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductDocument | null;
  householdId: string;
  shops: ShopDocument[];
}

const COMMON_UNITS = ['pcs', 'kg', 'g', 'liters', 'ml', 'pack', 'dozen'];

export function EditProductDialog({
  open,
  onOpenChange,
  product,
  householdId,
  shops,
}: EditProductDialogProps) {
  const updateMutation = useUpdateProduct();

  const [editName, setEditName] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editBarcode, setEditBarcode] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editShopId, setEditShopId] = useState('');

  useEffect(() => {
    if (product && open) {
      setEditName(product.name);
      setEditBrand(product.brand ?? '');
      setEditBarcode(product.barcode ?? '');
      setEditCategory(product.category ?? '');
      setEditQuantity(product.defaultQuantity != null ? String(product.defaultQuantity) : '');
      setEditUnit(product.unit ?? '');
      setEditShopId(product.shopId ?? '');
    }
  }, [product, open]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !editName.trim()) return;

    const resolvedShopId = editShopId && editShopId !== '__none__' ? editShopId : null;
    try {
      await updateMutation.mutateAsync({
        householdId,
        productId: product.productId,
        name: editName.trim(),
        brand: editBrand.trim() || null,
        barcode: editBarcode.trim() || null,
        category: editCategory.trim() || null,
        defaultQuantity: editQuantity ? Number(editQuantity) : null,
        unit: editUnit || null,
        shopId: resolvedShopId,
      });
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Edit Product</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prod-name">Name</Label>
            <Input
              id="prod-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prod-brand">Brand (optional)</Label>
            <Input
              id="prod-brand"
              value={editBrand}
              onChange={(e) => setEditBrand(e.target.value)}
              placeholder="e.g. Nestlé, Heinz..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prod-barcode">Barcode</Label>
            <Input
              id="prod-barcode"
              value={editBarcode}
              onChange={(e) => setEditBarcode(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="prod-qty">Default Quantity</Label>
              <Input
                id="prod-qty"
                type="number"
                step="any"
                min="0"
                placeholder="1"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-unit">Unit</Label>
              <Select value={editUnit} onValueChange={setEditUnit}>
                <SelectTrigger id="prod-unit">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {shops.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="prod-shop">Default Shop</Label>
              <Select value={editShopId} onValueChange={setEditShopId}>
                <SelectTrigger id="prod-shop">
                  <SelectValue placeholder="No shop" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No shop</SelectItem>
                  {shops.map((shop) => (
                    <SelectItem key={shop.shopId} value={shop.shopId}>
                      {shop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="prod-category">Category</Label>
            <Input
              id="prod-category"
              placeholder="e.g. Dairy, Produce, Meat..."
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={!editName.trim() || updateMutation.isPending}
          >
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>

          {updateMutation.isError && (
            <p className="text-sm text-destructive text-center">
              Failed to update product. Please try again.
            </p>
          )}
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
