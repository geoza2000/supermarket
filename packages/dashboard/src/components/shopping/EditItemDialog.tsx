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
import { Loader2, Trash2 } from 'lucide-react';
import { useUpdateItem, useRemoveItem } from '@/hooks/mutations';
import type { ShoppingItemDocument, ShopDocument } from '@supermarket-list/shared';

interface EditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ShoppingItemDocument | null;
  householdId: string;
  shops: ShopDocument[];
}

const COMMON_UNITS = ['pcs', 'kg', 'g', 'liters', 'ml', 'pack', 'dozen'];

export function EditItemDialog({
  open,
  onOpenChange,
  item,
  householdId,
  shops,
}: EditItemDialogProps) {
  const updateMutation = useUpdateItem();
  const removeMutation = useRemoveItem();

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [shopId, setShopId] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (item && open) {
      setName(item.name);
      setQuantity(item.quantity != null ? String(item.quantity) : '');
      setUnit(item.unit ?? '');
      setShopId(item.shopId ?? '');
      setShowDeleteConfirm(false);
    }
  }, [item, open]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !name.trim()) return;

    const resolvedShopId = shopId && shopId !== '__none__' ? shopId : null;
    try {
      await updateMutation.mutateAsync({
        householdId,
        itemId: item.itemId,
        name: name.trim(),
        quantity: quantity ? Number(quantity) : null,
        unit: unit || null,
        shopId: resolvedShopId,
      });
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    try {
      await removeMutation.mutateAsync({ householdId, itemId: item.itemId });
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  const isSaving = updateMutation.isPending;
  const isDeleting = removeMutation.isPending;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Edit Item</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Product Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-quantity">Quantity</Label>
              <Input
                id="edit-quantity"
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                placeholder="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-unit">Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger id="edit-unit">
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
              <Label htmlFor="edit-shop">Shop (optional)</Label>
              <Select value={shopId} onValueChange={setShopId}>
                <SelectTrigger id="edit-shop">
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

          <div className="flex gap-3">
            <Button
              type="submit"
              className="flex-1"
              size="lg"
              disabled={!name.trim() || isSaving || isDeleting}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>

            {!showDeleteConfirm ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="text-destructive hover:text-destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSaving || isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="destructive"
                size="lg"
                onClick={handleDelete}
                disabled={isSaving || isDeleting}
              >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </Button>
            )}
          </div>

          {(updateMutation.isError || removeMutation.isError) && (
            <p className="text-sm text-destructive text-center">
              Something went wrong. Please try again.
            </p>
          )}
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
