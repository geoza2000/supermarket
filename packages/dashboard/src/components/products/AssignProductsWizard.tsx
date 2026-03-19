import { useState, useMemo, useCallback } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowRight,
  ArrowLeft,
  Store,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Package,
} from 'lucide-react';
import { useUpdateProduct } from '@/hooks/mutations';
import type { ProductDocument, ShopDocument } from '@supermarket-list/shared';

type WizardStep = 'select-store' | 'select-products' | 'assigning';

interface AssignProductsWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shops: ShopDocument[];
  products: ProductDocument[];
  householdId: string;
}

export function AssignProductsWizard({
  open,
  onOpenChange,
  shops,
  products,
  householdId,
}: AssignProductsWizardProps) {
  const updateMutation = useUpdateProduct();

  const [step, setStep] = useState<WizardStep>('select-store');
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [assignProgress, setAssignProgress] = useState({ done: 0, total: 0, failed: 0 });
  const [isComplete, setIsComplete] = useState(false);

  const unassignedProducts = useMemo(
    () => products.filter((p) => !p.shopId),
    [products]
  );

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return unassignedProducts;
    const q = searchQuery.toLowerCase();
    return unassignedProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q)
    );
  }, [unassignedProducts, searchQuery]);

  const selectedShop = useMemo(
    () => shops.find((s) => s.shopId === selectedShopId) ?? null,
    [shops, selectedShopId]
  );

  const reset = useCallback(() => {
    setStep('select-store');
    setSelectedShopId(null);
    setSelectedProductIds(new Set());
    setSearchQuery('');
    setAssignProgress({ done: 0, total: 0, failed: 0 });
    setIsComplete(false);
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        reset();
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, reset]
  );

  const toggleProduct = useCallback((productId: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedProductIds((prev) => {
      if (prev.size === filteredProducts.length) return new Set();
      return new Set(filteredProducts.map((p) => p.productId));
    });
  }, [filteredProducts]);

  const handleAssign = useCallback(async () => {
    if (!selectedShopId || selectedProductIds.size === 0) return;
    setStep('assigning');
    const ids = Array.from(selectedProductIds);
    setAssignProgress({ done: 0, total: ids.length, failed: 0 });

    let failed = 0;
    for (let i = 0; i < ids.length; i++) {
      try {
        await updateMutation.mutateAsync({
          householdId,
          productId: ids[i],
          shopId: selectedShopId,
        });
      } catch {
        failed++;
      }
      setAssignProgress({ done: i + 1, total: ids.length, failed });
    }
    setIsComplete(true);
  }, [selectedShopId, selectedProductIds, householdId, updateMutation]);

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        {step === 'select-store' && (
          <StoreStep
            shops={shops}
            selectedShopId={selectedShopId}
            onSelect={setSelectedShopId}
            unassignedCount={unassignedProducts.length}
            onNext={() => setStep('select-products')}
            onCancel={() => handleOpenChange(false)}
          />
        )}

        {step === 'select-products' && (
          <ProductsStep
            selectedShop={selectedShop!}
            filteredProducts={filteredProducts}
            selectedProductIds={selectedProductIds}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onToggle={toggleProduct}
            onToggleAll={toggleAll}
            onBack={() => {
              setStep('select-store');
              setSearchQuery('');
              setSelectedProductIds(new Set());
            }}
            onAssign={handleAssign}
          />
        )}

        {step === 'assigning' && (
          <AssigningStep
            progress={assignProgress}
            isComplete={isComplete}
            shopName={selectedShop?.name ?? ''}
            onClose={() => handleOpenChange(false)}
          />
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function StoreStep({
  shops,
  selectedShopId,
  onSelect,
  unassignedCount,
  onNext,
  onCancel,
}: {
  shops: ShopDocument[];
  selectedShopId: string | null;
  onSelect: (id: string) => void;
  unassignedCount: number;
  onNext: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>Assign Products to Store</ResponsiveDialogTitle>
        <ResponsiveDialogDescription>
          {unassignedCount} unassigned {unassignedCount === 1 ? 'product' : 'products'}.
          Pick a store to assign them to.
        </ResponsiveDialogDescription>
      </ResponsiveDialogHeader>

      <div className="space-y-2 py-2">
        {shops.map((shop) => (
          <button
            key={shop.shopId}
            type="button"
            onClick={() => onSelect(shop.shopId)}
            className={`flex items-center gap-3 w-full rounded-lg border p-3 text-left transition-colors ${
              selectedShopId === shop.shopId
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border hover:bg-accent'
            }`}
          >
            <Store className="h-5 w-5 text-muted-foreground shrink-0" />
            <span className="font-medium">{shop.name}</span>
          </button>
        ))}
      </div>

      <ResponsiveDialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onNext} disabled={!selectedShopId}>
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </ResponsiveDialogFooter>
    </>
  );
}

function ProductsStep({
  selectedShop,
  filteredProducts,
  selectedProductIds,
  searchQuery,
  onSearchChange,
  onToggle,
  onToggleAll,
  onBack,
  onAssign,
}: {
  selectedShop: ShopDocument;
  filteredProducts: ProductDocument[];
  selectedProductIds: Set<string>;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onBack: () => void;
  onAssign: () => void;
}) {
  const allSelected =
    filteredProducts.length > 0 && selectedProductIds.size === filteredProducts.length;

  return (
    <>
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          {selectedShop.name}
        </ResponsiveDialogTitle>
        <ResponsiveDialogDescription>
          Select unassigned products to assign to this store.
        </ResponsiveDialogDescription>
      </ResponsiveDialogHeader>

      <div className="space-y-3 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {filteredProducts.length > 0 && (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onToggleAll}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Checkbox checked={allSelected} />
              <span>{allSelected ? 'Deselect all' : 'Select all'}</span>
            </button>
            {selectedProductIds.size > 0 && (
              <Badge variant="secondary" className="text-xs">
                {selectedProductIds.size} selected
              </Badge>
            )}
          </div>
        )}

        <ScrollArea className="max-h-[40vh]">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Package className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No matching products' : 'All products are already assigned'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredProducts.map((product) => (
                <button
                  key={product.productId}
                  type="button"
                  onClick={() => onToggle(product.productId)}
                  className={`flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-left transition-colors ${
                    selectedProductIds.has(product.productId)
                      ? 'bg-primary/5'
                      : 'hover:bg-accent'
                  }`}
                >
                  <Checkbox
                    checked={selectedProductIds.has(product.productId)}
                    tabIndex={-1}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-sm truncate block">
                      {product.name}
                    </span>
                    {product.brand && (
                      <span className="text-xs text-muted-foreground truncate block">
                        {product.brand}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <ResponsiveDialogFooter>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={onAssign} disabled={selectedProductIds.size === 0}>
          Assign {selectedProductIds.size > 0 ? selectedProductIds.size : ''}{' '}
          {selectedProductIds.size === 1 ? 'product' : 'products'}
        </Button>
      </ResponsiveDialogFooter>
    </>
  );
}

function AssigningStep({
  progress,
  isComplete,
  shopName,
  onClose,
}: {
  progress: { done: number; total: number; failed: number };
  isComplete: boolean;
  shopName: string;
  onClose: () => void;
}) {
  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  const allFailed = isComplete && progress.failed === progress.total;
  const someFailed = isComplete && progress.failed > 0 && progress.failed < progress.total;
  const allSuccess = isComplete && progress.failed === 0;

  return (
    <>
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>
          {isComplete
            ? allSuccess
              ? 'Products Assigned'
              : 'Assignment Complete'
            : 'Assigning Products…'}
        </ResponsiveDialogTitle>
      </ResponsiveDialogHeader>

      <div className="py-6 space-y-4">
        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          {!isComplete && <Loader2 className="h-4 w-4 animate-spin" />}
          {isComplete && allSuccess && (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          )}
          {isComplete && (someFailed || allFailed) && (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
          <span>
            {progress.done} / {progress.total} products
          </span>
        </div>

        {isComplete && allSuccess && (
          <p className="text-center text-sm">
            All products have been assigned to <strong>{shopName}</strong>.
          </p>
        )}
        {isComplete && someFailed && (
          <p className="text-center text-sm text-destructive">
            {progress.failed} {progress.failed === 1 ? 'product' : 'products'} failed to
            assign. The rest were assigned to <strong>{shopName}</strong>.
          </p>
        )}
        {isComplete && allFailed && (
          <p className="text-center text-sm text-destructive">
            Failed to assign products. Please try again.
          </p>
        )}
      </div>

      {isComplete && (
        <ResponsiveDialogFooter>
          <Button onClick={onClose} className="w-full">
            Done
          </Button>
        </ResponsiveDialogFooter>
      )}
    </>
  );
}
