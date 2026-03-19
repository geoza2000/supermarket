import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHouseholdStore } from '@/stores';
import { useShoppingList } from '@/hooks/useShoppingList';
import { useProducts } from '@/hooks/useProducts';
import { useShops } from '@/hooks/useShops';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import {
  useAddItem,
  useUpdateItem,
  useCompleteItem,
  useUncompleteItem,
  useCloseShoppingSession,
} from '@/hooks/mutations';
import { toast } from '@/hooks/useToast';
import {
  AddItemDialog,
  EditItemDialog,
  ShopGroup,
  BarcodeScannerDialog,
  CloseAllSessionsDialog,
  QuickAddBar,
} from '@/components/shopping';
import type { ShoppingItemDocument } from '@supermarket-list/shared';
import { sortShopDocumentsByDisplayOrder } from '@supermarket-list/shared';
import { InstallPWABanner } from '@/components/pwa';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  ShoppingCart,
  Settings,
  CheckCircle2,
  Store,
  Camera,
  Package,
} from 'lucide-react';

export function ShoppingListPage() {
  const navigate = useNavigate();
  const activeHousehold = useHouseholdStore((s) => s.activeHousehold);
  const householdId = activeHousehold?.householdId ?? null;

  const isOnline = useOnlineStatus();

  const { items, pendingItems, completedItems, itemsByShop, loading } =
    useShoppingList(householdId);
  const { products } = useProducts(householdId);
  const { shops, shopMap } = useShops(householdId);

  const addItemMutation = useAddItem();
  const updateItemMutation = useUpdateItem();
  const completeMutation = useCompleteItem();
  const uncompleteMutation = useUncompleteItem();
  const closeSessionMutation = useCloseShoppingSession();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [prefillName, setPrefillName] = useState('');
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null);
  const [showCloseAll, setShowCloseAll] = useState(false);
  const [isClosingAll, setIsClosingAll] = useState(false);

  const handleOpenFullForm = useCallback((name?: string) => {
    setPrefillName(name ?? '');
    setAddDialogOpen(true);
  }, []);

  const handleComplete = useCallback(
    async (itemId: string) => {
      if (!householdId) return;
      setTogglingItemId(itemId);
      try {
        await completeMutation.mutateAsync({ householdId, itemId });
      } finally {
        setTogglingItemId(null);
      }
    },
    [householdId, completeMutation]
  );

  const handleUncomplete = useCallback(
    async (itemId: string) => {
      if (!householdId) return;
      setTogglingItemId(itemId);
      try {
        await uncompleteMutation.mutateAsync({ householdId, itemId });
      } finally {
        setTogglingItemId(null);
      }
    },
    [householdId, uncompleteMutation]
  );

  const handleUpdateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (!householdId) {
        throw new Error('No household');
      }
      await updateItemMutation.mutateAsync({ householdId, itemId, quantity });
    },
    [householdId, updateItemMutation]
  );

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItemDocument | null>(null);

  const handleEdit = useCallback((item: ShoppingItemDocument) => {
    setEditingItem(item);
    setEditDialogOpen(true);
  }, []);

  const handleCloseSession = useCallback(
    async (shopId: string | null) => {
      if (!householdId) return;
      await closeSessionMutation.mutateAsync({
        householdId,
        shopId,
      });
    },
    [householdId, closeSessionMutation]
  );

  const handleCloseAll = async () => {
    if (!householdId) return;
    setIsClosingAll(true);
    try {
      await closeSessionMutation.mutateAsync({
        householdId,
        closeAll: true,
      });
    } finally {
      setIsClosingAll(false);
      setShowCloseAll(false);
    }
  };

  const shopIdsOrdered = useMemo(() => {
    const keysWithItems = Object.keys(itemsByShop);
    const assignedKeys = keysWithItems.filter((k) => k !== '__unassigned__');
    const withDisplayOrder = sortShopDocumentsByDisplayOrder(
      shops.filter((s) => assignedKeys.includes(s.shopId))
    );
    const orderedAssigned = withDisplayOrder.map((s) => s.shopId);
    const orphanAssigned = assignedKeys.filter((id) => !orderedAssigned.includes(id));
    orphanAssigned.sort((a, b) =>
      (shopMap[a]?.name ?? a).localeCompare(shopMap[b]?.name ?? b)
    );
    const tail = keysWithItems.includes('__unassigned__') ? ['__unassigned__'] : [];
    return [...orderedAssigned, ...orphanAssigned, ...tail];
  }, [itemsByShop, shops, shopMap]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-primary text-primary-foreground px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            className="text-left"
            onClick={() => navigate('/household/select')}
          >
            <h1 className="font-display font-bold text-lg">{activeHousehold?.name}</h1>
            <p className="text-xs opacity-75">
              {pendingItems.length} item{pendingItems.length !== 1 ? 's' : ''} to buy
            </p>
          </button>
          <div className="flex items-center gap-1">
            {completedItems.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary-foreground hover:bg-white/15 hover:text-primary-foreground"
                onClick={() => setShowCloseAll(true)}
                disabled={!isOnline}
              >
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                Close All
              </Button>
            )}
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/15 hover:text-primary-foreground" onClick={() => navigate('/products')}>
              <Package className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/15 hover:text-primary-foreground" onClick={() => navigate('/shops')}>
              <Store className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/15 hover:text-primary-foreground" onClick={() => navigate('/household/settings')}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 pb-28 max-w-lg mx-auto w-full">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No items yet</h2>
            <p className="text-muted-foreground mb-6">
              Scan a barcode or type manually to add items
            </p>
            <div className="flex gap-3">
              <Button onClick={() => setScannerOpen(true)} disabled={!isOnline}>
                <Camera className="mr-2 h-4 w-4" />
                Scan Barcode
              </Button>
              <Button variant="outline" onClick={() => setAddDialogOpen(true)} disabled={!isOnline}>
                <Plus className="mr-2 h-4 w-4" />
                Add Manually
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {shopIdsOrdered.map((key) => {
              const isUnassigned = key === '__unassigned__';
              const groupItems = itemsByShop[key];
              const allItems = [
                ...groupItems,
                ...completedItems.filter((i) =>
                  isUnassigned ? !i.shopId : i.shopId === key
                ),
              ];

              if (allItems.length === 0) return null;

              return (
                <ShopGroup
                  key={key}
                  householdId={householdId}
                  sectionKey={key}
                  shopId={isUnassigned ? null : key}
                  shopName={isUnassigned ? 'Unassigned' : (shopMap[key]?.name ?? key)}
                  items={allItems}
                  onComplete={handleComplete}
                  onUncomplete={handleUncomplete}
                  onEdit={handleEdit}
                  onUpdateQuantity={handleUpdateQuantity}
                  onCloseSession={handleCloseSession}
                  togglingItemId={togglingItemId}
                  disabled={!isOnline}
                />
              );
            })}

            {completedItems
              .filter((i) => {
                const key = i.shopId || '__unassigned__';
                return !itemsByShop[key];
              })
              .length > 0 && (
              <ShopGroup
                householdId={householdId}
                sectionKey="__completed_only__"
                shopId={null}
                shopName="Completed"
                items={completedItems.filter((i) => {
                  const key = i.shopId || '__unassigned__';
                  return !itemsByShop[key];
                })}
                onComplete={handleComplete}
                onUncomplete={handleUncomplete}
                onEdit={handleEdit}
                onUpdateQuantity={handleUpdateQuantity}
                onCloseSession={handleCloseSession}
                togglingItemId={togglingItemId}
                disabled={!isOnline}
              />
            )}
          </div>
        )}

        <div className="mt-4">
          <InstallPWABanner variant="shopping-list" />
        </div>
      </main>

      {householdId && (
        <QuickAddBar
          householdId={householdId}
          products={products}
          currentItems={items}
          onScanBarcode={() => setScannerOpen(true)}
          onOpenFullForm={handleOpenFullForm}
          disabled={!isOnline}
        />
      )}

      <AddItemDialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) setPrefillName('');
        }}
        householdId={householdId!}
        products={products}
        shops={shops}
        onScanBarcode={() => {
          setAddDialogOpen(false);
          setScannerOpen(true);
        }}
        scannedBarcode={scannedBarcode}
        onClearBarcode={() => setScannedBarcode(null)}
        prefillName={prefillName}
      />

      <EditItemDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        item={editingItem}
        householdId={householdId!}
        shops={shops}
      />

      <BarcodeScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={async (barcode) => {
          setScannerOpen(false);

          const catalogMatch = products.find((p) => p.barcode === barcode);
          if (catalogMatch && householdId) {
            try {
              await addItemMutation.mutateAsync({
                householdId,
                name: catalogMatch.name,
                productId: catalogMatch.productId,
                barcode,
                quantity: catalogMatch.defaultQuantity ?? null,
                unit: catalogMatch.unit ?? null,
                shopId: catalogMatch.shopId ?? null,
              });
              toast({ title: `${catalogMatch.name} added` });
            } catch {
              toast({ title: 'Failed to add item', variant: 'destructive' });
            }
            return;
          }

          setScannedBarcode(barcode);
          setAddDialogOpen(true);
        }}
        onManualEntry={() => {
          setScannerOpen(false);
          setScannedBarcode(null);
          setAddDialogOpen(true);
        }}
      />

      <CloseAllSessionsDialog
        open={showCloseAll}
        onOpenChange={setShowCloseAll}
        completedCount={completedItems.length}
        pendingCount={pendingItems.length}
        isClosing={isClosingAll}
        onConfirm={handleCloseAll}
      />
    </div>
  );
}
