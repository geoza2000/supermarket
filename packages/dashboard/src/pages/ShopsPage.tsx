import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHouseholdStore } from '@/stores';
import { useShops } from '@/hooks/useShops';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { toast } from '@/hooks/useToast';
import {
  useCreateShop,
  useUpdateShop,
  useDeleteShop,
  useReorderShops,
} from '@/hooks/mutations';
import { Button } from '@/components/ui/button';
import { ShopFormDialog, DeleteShopDialog, SortableShopList } from '@/components/shops';
import type { ShopFormData } from '@/components/shops';
import { ArrowLeft, Plus, Store } from 'lucide-react';
import type { ShopDocument, VisitPeriod } from '@supermarket-list/shared';

function formatLastVisited(lastVisitedAt: string | null): string {
  if (!lastVisitedAt) return 'Never';
  const date = new Date(lastVisitedAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

function formatVisitPeriod(vp: VisitPeriod | null): string {
  if (!vp) return 'No reminder';
  return `Every ${vp.value} ${vp.unit}`;
}

const defaultForm: ShopFormData = {
  name: '',
  visitPeriodValue: '7',
  visitPeriodUnit: 'days',
  hasVisitPeriod: false,
};

export function ShopsPage() {
  const navigate = useNavigate();
  const activeHousehold = useHouseholdStore((s) => s.activeHousehold);
  const householdId = activeHousehold?.householdId ?? '';
  const { shops, loading } = useShops(householdId || null);
  const isOnline = useOnlineStatus();

  const createMutation = useCreateShop();
  const updateMutation = useUpdateShop();
  const deleteMutation = useDeleteShop();
  const reorderMutation = useReorderShops();

  const [showForm, setShowForm] = useState(false);
  const [editingShop, setEditingShop] = useState<ShopDocument | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ShopDocument | null>(null);
  const [form, setForm] = useState<ShopFormData>(defaultForm);
  const [optimisticOrder, setOptimisticOrder] = useState<string[] | null>(null);
  const reorderGenRef = useRef(0);

  useEffect(() => {
    setOptimisticOrder(null);
  }, [householdId]);

  const displayShops = useMemo(() => {
    if (!optimisticOrder || optimisticOrder.length !== shops.length) {
      return shops;
    }
    const byId = new Map(shops.map((s) => [s.shopId, s]));
    const next = optimisticOrder
      .map((id) => byId.get(id))
      .filter((s): s is ShopDocument => s != null);
    return next.length === shops.length ? next : shops;
  }, [shops, optimisticOrder]);

  useEffect(() => {
    if (!optimisticOrder) return;
    if (optimisticOrder.length !== shops.length) {
      setOptimisticOrder(null);
      return;
    }
    const serverIds = shops.map((s) => s.shopId);
    const matches = optimisticOrder.every((id, i) => id === serverIds[i]);
    if (matches) {
      setOptimisticOrder(null);
    }
  }, [shops, optimisticOrder]);

  const openCreateForm = () => {
    setEditingShop(null);
    setForm(defaultForm);
    setShowForm(true);
  };

  const openEditForm = (shop: ShopDocument) => {
    setEditingShop(shop);
    setForm({
      name: shop.name,
      visitPeriodValue: shop.visitPeriod?.value.toString() ?? '7',
      visitPeriodUnit: shop.visitPeriod?.unit ?? 'days',
      hasVisitPeriod: !!shop.visitPeriod,
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;

    const visitPeriod: VisitPeriod | null = form.hasVisitPeriod
      ? { value: parseInt(form.visitPeriodValue) || 7, unit: form.visitPeriodUnit }
      : null;

    if (editingShop) {
      await updateMutation.mutateAsync({
        householdId,
        shopId: editingShop.shopId,
        name: form.name.trim(),
        visitPeriod,
      });
    } else {
      await createMutation.mutateAsync({
        householdId,
        name: form.name.trim(),
        visitPeriod,
      });
    }

    setShowForm(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync({
      householdId,
      shopId: deleteTarget.shopId,
    });
    setDeleteTarget(null);
  };

  const handleReorder = useCallback(
    async (orderedShopIds: string[]) => {
      if (!householdId) {
        throw new Error('No household');
      }
      const gen = ++reorderGenRef.current;
      setOptimisticOrder(orderedShopIds);
      try {
        await reorderMutation.mutateAsync({ householdId, orderedShopIds });
      } catch (err) {
        if (reorderGenRef.current !== gen) return;
        setOptimisticOrder(null);
        toast({
          title: 'Failed to save order',
          description:
            err instanceof Error
              ? err.message
              : 'Could not save shop order. Check your connection and try again.',
          variant: 'destructive',
        });
      }
    },
    [householdId, reorderMutation]
  );

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-primary text-primary-foreground px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/15 hover:text-primary-foreground" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="font-display font-bold text-lg">Shops</h1>
          </div>
          <Button size="sm" className="bg-white/20 text-primary-foreground hover:bg-white/30 border-0" onClick={openCreateForm}>
            <Plus className="mr-1 h-4 w-4" />
            Add Shop
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : shops.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <Store className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No shops yet</h2>
            <p className="text-muted-foreground mb-6">
              Add shops to group your items and track visits
            </p>
            <Button onClick={openCreateForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Shop
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Drag shops by the handle to set the order they appear on your shopping list.
              {!isOnline && ' Reordering needs a connection.'}
            </p>
            <SortableShopList
              shops={displayShops}
              disabled={!isOnline}
              formatVisitPeriod={formatVisitPeriod}
              formatLastVisited={formatLastVisited}
              onEdit={openEditForm}
              onDelete={setDeleteTarget}
              onReorder={handleReorder}
            />
          </div>
        )}
      </main>

      <ShopFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        form={form}
        onFormChange={setForm}
        isEditing={!!editingShop}
        isSaving={isSaving}
        onSubmit={handleSubmit}
      />

      <DeleteShopDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        shopName={deleteTarget?.name ?? ''}
        isDeleting={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
