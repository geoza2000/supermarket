import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Pencil, Check } from 'lucide-react';
import type { ShoppingItemDocument } from '@supermarket-list/shared';
import { toast } from '@/hooks/useToast';
import { ShoppingItemAmountTrigger } from './ShoppingItemAmountTrigger';
import { ShoppingItemQuantityDialog } from './ShoppingItemQuantityDialog';

interface ShoppingItemRowProps {
  item: ShoppingItemDocument;
  onComplete: (itemId: string) => void;
  onUncomplete: (itemId: string) => void;
  onEdit: (item: ShoppingItemDocument) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => Promise<void>;
  isToggling?: boolean;
  disabled?: boolean;
}

export function ShoppingItemRow({
  item,
  onComplete,
  onUncomplete,
  onEdit,
  onUpdateQuantity,
  isToggling,
  disabled,
}: ShoppingItemRowProps) {
  const [qtyEditorOpen, setQtyEditorOpen] = useState(false);
  const [optimisticQty, setOptimisticQty] = useState<number | null>(null);
  const commitGenRef = useRef(0);

  useEffect(() => {
    setOptimisticQty(null);
  }, [item.itemId]);

  const serverQty = item.quantity ?? 1;
  const displayQty = optimisticQty ?? serverQty;

  useEffect(() => {
    if (optimisticQty === null) return;
    if (serverQty === optimisticQty) {
      setOptimisticQty(null);
    }
  }, [serverQty, optimisticQty]);

  const commitQuantity = useCallback(
    async (q: number) => {
      const gen = ++commitGenRef.current;
      setOptimisticQty(q);
      try {
        await onUpdateQuantity(item.itemId, q);
      } catch (err) {
        if (commitGenRef.current !== gen) return;
        setOptimisticQty(null);
        toast({
          title: 'Failed to update quantity',
          description:
            err instanceof Error
              ? err.message
              : 'Could not save your change. Check your connection and try again.',
          variant: 'destructive',
        });
      }
    },
    [item.itemId, onUpdateQuantity]
  );

  const quantityLabel = [
    item.quantity != null ? String(item.quantity) : null,
    item.unit,
  ]
    .filter(Boolean)
    .join(' ');

  const handleToggle = () => {
    if (isToggling || disabled) return;
    item.completed ? onUncomplete(item.itemId) : onComplete(item.itemId);
  };

  return (
    <div className="flex items-center min-h-[56px] py-2 pl-4 pr-3 gap-2">
      {/* Checkbox */}
      <button
        type="button"
        className="shrink-0 active:scale-95 transition-transform"
        onClick={handleToggle}
        disabled={isToggling || disabled}
      >
        <div
          className="flex items-center justify-center h-7 w-7 rounded-full border-2 border-primary/40 transition-colors data-[checked=true]:bg-primary data-[checked=true]:border-primary"
          data-checked={item.completed}
        >
          {isToggling ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : item.completed ? (
            <Check className="h-4 w-4 text-primary-foreground" />
          ) : null}
        </div>
      </button>

      {/* Name + badges — tapping also toggles completion */}
      <button
        type="button"
        className="flex-1 min-w-0 text-left active:opacity-70 transition-opacity"
        onClick={handleToggle}
        disabled={isToggling || disabled}
      >
        <div className="flex items-center gap-2">
          <span
            className={`font-medium truncate ${
              item.completed ? 'line-through text-muted-foreground' : ''
            }`}
          >
            {item.name}
          </span>
          {item.completed && quantityLabel && (
            <span className="text-sm text-muted-foreground shrink-0">
              {quantityLabel}
            </span>
          )}
        </div>
        {item.brand && (
          <span className="text-xs text-muted-foreground truncate">
            {item.brand}
          </span>
        )}
      </button>

      {!item.completed && (
        <>
          <ShoppingItemAmountTrigger
            quantity={displayQty}
            unit={item.unit}
            disabled={disabled}
            onOpenDialog={() => setQtyEditorOpen(true)}
            onAdjustQuantity={(next) => {
              void commitQuantity(next);
            }}
          />

          <ShoppingItemQuantityDialog
            open={qtyEditorOpen}
            onOpenChange={setQtyEditorOpen}
            itemName={item.name}
            unit={item.unit}
            quantity={displayQty}
            disabled={disabled}
            onSave={(q) => {
              void commitQuantity(q);
            }}
          />
        </>
      )}

      {/* Edit button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={() => onEdit(item)}
        disabled={disabled}
      >
        <Pencil className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  );
}
