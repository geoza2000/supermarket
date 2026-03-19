import { useRef } from 'react';
import { cn } from '@/lib/utils';

const TAP_MAX_PX = 14;
/** Horizontal distance required to count as a swipe (each swipe changes quantity by at most 1). */
const SWIPE_MIN_PX = 28;

function clampQty(n: number): number {
  return Math.max(1, Math.min(9999, n));
}

export interface ShoppingItemAmountTriggerProps {
  quantity: number;
  unit?: string | null;
  disabled?: boolean;
  onOpenDialog: () => void;
  onAdjustQuantity: (next: number) => void | Promise<void>;
  className?: string;
}

/**
 * Amount chip: tap opens the quantity dialog; horizontal swipe adjusts by exactly ±1
 * for that gesture (distance does not stack multiple steps).
 */
export function ShoppingItemAmountTrigger({
  quantity,
  unit,
  disabled,
  onOpenDialog,
  onAdjustQuantity,
  className,
}: ShoppingItemAmountTriggerProps) {
  const amountDisplay = `${quantity}${unit ? ` ${unit}` : ''}`;

  const gestureRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    baseQty: number;
  } | null>(null);
  const suppressClickRef = useRef(false);

  const endGesture = (el: HTMLElement, pointerId: number) => {
    try {
      if (el.hasPointerCapture(pointerId)) {
        el.releasePointerCapture(pointerId);
      }
    } catch {
      /* ignore */
    }
    gestureRef.current = null;
  };

  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'shrink-0 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium tabular-nums active:bg-accent disabled:opacity-40 min-h-10 min-w-[3.25rem] text-center touch-none select-none cursor-ew-resize',
        className
      )}
      aria-label={`Amount ${amountDisplay}. Tap to edit. Swipe horizontally to add or subtract one.`}
      onPointerDown={(e) => {
        if (disabled || e.button !== 0) return;
        suppressClickRef.current = false;
        (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
        gestureRef.current = {
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          baseQty: quantity,
        };
      }}
      onPointerUp={(e) => {
        const g = gestureRef.current;
        if (!g || e.pointerId !== g.pointerId) return;

        const el = e.currentTarget as HTMLButtonElement;
        const dx = e.clientX - g.startX;
        const dy = e.clientY - g.startY;
        const isTap = Math.hypot(dx, dy) < TAP_MAX_PX;

        if (isTap && !disabled) {
          onOpenDialog();
          suppressClickRef.current = true;
        } else if (
          !disabled &&
          Math.abs(dx) >= SWIPE_MIN_PX &&
          Math.abs(dx) >= Math.abs(dy)
        ) {
          const delta = dx > 0 ? 1 : -1;
          const next = clampQty(g.baseQty + delta);
          if (next !== g.baseQty) {
            onAdjustQuantity(next);
          }
          suppressClickRef.current = true;
        } else if (!isTap) {
          suppressClickRef.current = true;
        }

        endGesture(el, e.pointerId);
      }}
      onPointerCancel={(e) => {
        const g = gestureRef.current;
        if (!g || e.pointerId !== g.pointerId) return;
        endGesture(e.currentTarget as HTMLButtonElement, e.pointerId);
      }}
      onClick={(e) => {
        if (suppressClickRef.current) {
          suppressClickRef.current = false;
          e.preventDefault();
          return;
        }
        if (!disabled) {
          onOpenDialog();
        }
      }}
    >
      {amountDisplay}
    </button>
  );
}
