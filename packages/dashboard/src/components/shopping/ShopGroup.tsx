import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CloseSessionDialog } from './CloseSessionDialog';
import { ShoppingItemRow } from './ShoppingItemRow';
import { CheckCircle2 } from 'lucide-react';
import type { ShoppingItemDocument } from '@supermarket-list/shared';

interface ShopGroupProps {
  shopId: string | null;
  shopName: string;
  items: ShoppingItemDocument[];
  onComplete: (itemId: string) => void;
  onUncomplete: (itemId: string) => void;
  onEdit: (item: ShoppingItemDocument) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onCloseSession: (shopId: string | null) => Promise<void>;
  togglingItemId: string | null;
}

export function ShopGroup({
  shopId,
  shopName,
  items,
  onComplete,
  onUncomplete,
  onEdit,
  onUpdateQuantity,
  onCloseSession,
  togglingItemId,
}: ShopGroupProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const completedCount = items.filter((i) => i.completed).length;
  const pendingCount = items.filter((i) => !i.completed).length;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{shopName}</h3>
          <Badge variant="secondary" className="text-xs">
            {pendingCount} left
          </Badge>
        </div>
        {completedCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={() => setShowConfirm(true)}
          >
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            Done Shopping
          </Button>
        )}
      </div>

      <div className="divide-y">
        {items.map((item) => (
          <ShoppingItemRow
            key={item.itemId}
            item={item}
            onComplete={onComplete}
            onUncomplete={onUncomplete}
            onEdit={onEdit}
            onUpdateQuantity={onUpdateQuantity}
            isToggling={togglingItemId === item.itemId}
          />
        ))}
      </div>

      <CloseSessionDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        shopName={shopName}
        shopId={shopId}
        completedCount={completedCount}
        pendingCount={pendingCount}
        onCloseSession={onCloseSession}
      />
    </div>
  );
}
