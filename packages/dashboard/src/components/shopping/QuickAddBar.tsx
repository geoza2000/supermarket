import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Camera, Plus, Check, Loader2 } from 'lucide-react';
import { useAddItem } from '@/hooks/mutations';
import { toast } from '@/hooks/useToast';
import type { ProductDocument, ShoppingItemDocument } from '@supermarket-list/shared';

interface QuickAddBarProps {
  householdId: string;
  products: ProductDocument[];
  pendingItems: ShoppingItemDocument[];
  onScanBarcode: () => void;
  onOpenFullForm: (prefillName?: string) => void;
}

const MAX_CHIPS = 20;
const MAX_SEARCH_RESULTS = 8;

export function QuickAddBar({
  householdId,
  products,
  pendingItems,
  onScanBarcode,
  onOpenFullForm,
}: QuickAddBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const addItemMutation = useAddItem();

  const pendingProductIds = useMemo(
    () => new Set(pendingItems.map((item) => item.productId)),
    [pendingItems]
  );

  const barcodelessSuggestions = useMemo(() => {
    return products
      .filter((p) => p.barcode === null && !pendingProductIds.has(p.productId))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, MAX_CHIPS);
  }, [products, pendingProductIds]);

  const searchResults = useMemo(() => {
    if (!query || query.length < 2) return [];
    const lower = query.toLowerCase();
    return products
      .filter((p) => p.name.toLowerCase().includes(lower))
      .slice(0, MAX_SEARCH_RESULTS)
      .map((p) => ({
        ...p,
        isInList: pendingProductIds.has(p.productId),
      }));
  }, [query, products, pendingProductIds]);

  const showPanel = isFocused && (barcodelessSuggestions.length > 0 || query.length >= 2);

  const handleQuickAdd = useCallback(
    async (product: ProductDocument) => {
      try {
        await addItemMutation.mutateAsync({
          householdId,
          name: product.name,
          productId: product.productId,
          barcode: product.barcode ?? null,
          quantity: product.defaultQuantity ?? null,
          unit: product.unit ?? null,
          shopId: product.shopId ?? null,
        });
        toast({ title: `${product.name} added` });
        setQuery('');
      } catch {
        toast({ title: 'Failed to add item', variant: 'destructive' });
      }
    },
    [householdId, addItemMutation]
  );

  const handleSearchResultTap = useCallback(
    (product: ProductDocument & { isInList: boolean }) => {
      if (product.isInList) {
        toast({ title: `${product.name} is already in the list` });
        return;
      }
      handleQuickAdd(product);
    },
    [handleQuickAdd]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    const exactMatch = searchResults.find(
      (r) => r.name.toLowerCase() === trimmed.toLowerCase() && !r.isInList
    );
    if (exactMatch) {
      handleQuickAdd(exactMatch);
      return;
    }

    onOpenFullForm(trimmed);
    setQuery('');
    setIsFocused(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current?.contains(e.target as Node) ||
        barRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setIsFocused(false);
    };
    if (isFocused) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside as EventListener);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as EventListener);
    };
  }, [isFocused]);

  const showChips = isFocused && !query && barcodelessSuggestions.length > 0;
  const showSearch = isFocused && query.length >= 2;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20">
      {showPanel && (
        <div
          ref={panelRef}
          className="mx-auto max-w-lg px-4 pb-1 animate-in slide-in-from-bottom-2 duration-200"
        >
          <div className="bg-background border rounded-xl shadow-lg overflow-hidden">
            {showChips && (
              <div className="p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground px-1">
                  Quick add
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {barcodelessSuggestions.map((product) => (
                    <button
                      key={product.productId}
                      type="button"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-full transition-colors active:scale-95"
                      onClick={() => handleQuickAdd(product)}
                      disabled={addItemMutation.isPending}
                    >
                      <Plus className="h-3 w-3 opacity-50" />
                      {product.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showSearch && (
              <div className="max-h-52 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    No products found — press Enter to add manually
                  </div>
                ) : (
                  searchResults.map((product) => (
                    <button
                      key={product.productId}
                      type="button"
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                        product.isInList
                          ? 'opacity-50 cursor-default'
                          : 'hover:bg-accent active:bg-accent/80'
                      }`}
                      onClick={() => handleSearchResultTap(product)}
                      disabled={addItemMutation.isPending}
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{product.name}</span>
                        {product.brand && (
                          <span className="text-muted-foreground ml-1.5">
                            — {product.brand}
                          </span>
                        )}
                      </div>
                      {product.isInList ? (
                        <Badge
                          variant="secondary"
                          className="ml-2 shrink-0 text-xs gap-1"
                        >
                          <Check className="h-3 w-3" />
                          In list
                        </Badge>
                      ) : (
                        <Plus className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div
        ref={barRef}
        className="bg-background border-t px-4 py-3 safe-area-bottom"
      >
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 max-w-lg mx-auto"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              placeholder="Add an item..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              className="pl-9 pr-3"
            />
          </div>
          {query.trim() ? (
            <Button
              type="submit"
              size="icon"
              variant="default"
              disabled={addItemMutation.isPending}
            >
              {addItemMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={onScanBarcode}
            >
              <Camera className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
