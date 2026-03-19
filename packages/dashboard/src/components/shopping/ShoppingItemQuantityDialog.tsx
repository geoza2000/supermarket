import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { Minus, Plus } from 'lucide-react';

function clampPositiveInt(raw: string, fallback: number): number {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return Math.max(1, fallback);
  return Math.min(9999, n);
}

export interface ShoppingItemQuantityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  unit?: string | null;
  /** Current saved quantity; used when opening and to detect changes on close */
  quantity: number;
  disabled?: boolean;
  onSave: (nextQuantity: number) => void | Promise<void>;
}

export function ShoppingItemQuantityDialog({
  open,
  onOpenChange,
  itemName,
  unit,
  quantity,
  disabled,
  onSave,
}: ShoppingItemQuantityDialogProps) {
  const [qtyInput, setQtyInput] = useState(String(quantity));
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open) {
      if (!wasOpenRef.current) {
        setQtyInput(String(quantity));
      }
      wasOpenRef.current = true;
    } else {
      wasOpenRef.current = false;
    }
  }, [open, quantity]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        const parsed = clampPositiveInt(qtyInput, quantity);
        if (parsed !== quantity && !disabled) {
          onSave(parsed);
        }
      }
      onOpenChange(nextOpen);
    },
    [qtyInput, quantity, disabled, onSave, onOpenChange]
  );

  const parsedDraft = clampPositiveInt(qtyInput, 1);

  const bumpQty = (delta: number) => {
    const next = Math.max(1, Math.min(9999, parsedDraft + delta));
    setQtyInput(String(next));
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="text-center sm:text-left">
            Amount
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="text-center sm:text-left">
            {itemName}
            {unit ? ` · ${unit}` : ''}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="flex items-center justify-center gap-3 py-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-14 w-14 shrink-0 touch-manipulation"
            disabled={disabled || parsedDraft <= 1}
            onClick={() => bumpQty(-1)}
          >
            <Minus className="h-6 w-6" />
            <span className="sr-only">Decrease amount</span>
          </Button>

          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            aria-label="Amount"
            disabled={disabled}
            className="h-14 w-[5.5rem] text-center text-lg font-semibold tabular-nums px-2"
            value={qtyInput}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '');
              setQtyInput(digits);
            }}
            onBlur={() => {
              if (qtyInput === '') {
                setQtyInput('1');
              }
            }}
          />

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-14 w-14 shrink-0 touch-manipulation"
            disabled={disabled || parsedDraft >= 9999}
            onClick={() => bumpQty(1)}
          >
            <Plus className="h-6 w-6" />
            <span className="sr-only">Increase amount</span>
          </Button>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
