import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { readShopGroupExpanded, writeShopGroupExpanded } from '@/lib/shopGroupExpandedStorage';
import { CloseSessionDialog } from './CloseSessionDialog';
import { ShoppingItemRow } from './ShoppingItemRow';
import { CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import type { ShoppingItemDocument } from '@supermarket-list/shared';

interface ShopGroupProps {
  householdId: string | null;
  /** Stable id for this block (e.g. shop id, __unassigned__, or a sentinel for "Completed-only"). */
  sectionKey: string;
  shopId: string | null;
  shopName: string;
  items: ShoppingItemDocument[];
  onComplete: (itemId: string) => void;
  onUncomplete: (itemId: string) => void;
  onEdit: (item: ShoppingItemDocument) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => Promise<void>;
  onCloseSession: (shopId: string | null) => Promise<void>;
  togglingItemId: string | null;
  disabled?: boolean;
}

export function ShopGroup({
  householdId,
  sectionKey,
  shopId,
  shopName,
  items,
  onComplete,
  onUncomplete,
  onEdit,
  onUpdateQuantity,
  onCloseSession,
  togglingItemId,
  disabled,
}: ShopGroupProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [expanded, setExpanded] = useState(() =>
    householdId ? readShopGroupExpanded(householdId, sectionKey) : true
  );

  useEffect(() => {
    if (!householdId) return;
    setExpanded(readShopGroupExpanded(householdId, sectionKey));
  }, [householdId, sectionKey]);

  const completedCount = items.filter((i) => i.completed).length;
  const pendingCount = items.filter((i) => !i.completed).length;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-muted/50">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-1 text-left -my-1 -ml-1 pl-1 transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={() =>
            setExpanded((e) => {
              const next = !e;
              if (householdId) writeShopGroupExpanded(householdId, sectionKey, next);
              return next;
            })
          }
          aria-expanded={expanded}
          aria-label={expanded ? `Collapse ${shopName}` : `Expand ${shopName}`}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          )}
          <span className="truncate font-semibold text-sm">{shopName}</span>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {pendingCount} left
          </Badge>
        </button>
        {completedCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-xs h-7"
            onClick={() => setShowConfirm(true)}
            disabled={disabled}
          >
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            Done Shopping
          </Button>
        )}
      </div>

      {expanded && (
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
              disabled={disabled}
            />
          ))}
        </div>
      )}

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
