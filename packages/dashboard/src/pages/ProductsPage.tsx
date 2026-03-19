import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHouseholdStore } from '@/stores';
import { useProducts } from '@/hooks/useProducts';
import { useShops } from '@/hooks/useShops';
import { useDeleteProduct } from '@/hooks/mutations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EditProductDialog, DeleteProductDialog } from '@/components/products';
import {
  ArrowLeft,
  Search,
  Package,
  Pencil,
  Trash2,
  ScanBarcode,
} from 'lucide-react';
import type { ProductDocument } from '@supermarket-list/shared';

export function ProductsPage() {
  const navigate = useNavigate();
  const activeHousehold = useHouseholdStore((s) => s.activeHousehold);
  const householdId = activeHousehold?.householdId ?? '';
  const { products, loading } = useProducts(householdId || null);
  const { shops, shopMap } = useShops(householdId || null);

  const deleteMutation = useDeleteProduct();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<ProductDocument | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductDocument | null>(null);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync({
        householdId,
        productId: deleteTarget.productId,
      });
      setDeleteTarget(null);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="font-bold text-lg">Products</h1>
          <Badge variant="secondary" className="ml-auto text-xs">
            {products.length}
          </Badge>
        </div>
      </header>

      <div className="sticky top-[57px] z-10 bg-background border-b px-4 py-2">
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, brand, or barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <main className="flex-1 max-w-lg mx-auto w-full">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {searchQuery ? 'No matches' : 'No products yet'}
            </h2>
            <p className="text-muted-foreground">
              {searchQuery
                ? 'Try a different search term'
                : 'Products are created automatically when you add items to your list'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((product) => {
              const shop = product.shopId ? shopMap[product.shopId] : null;
              const qty = [
                product.defaultQuantity != null ? String(product.defaultQuantity) : null,
                product.unit,
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <div
                  key={product.productId}
                  className="flex items-center py-3 px-4 gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{product.name}</span>
                      {product.brand && (
                        <span className="text-sm text-muted-foreground truncate">
                          {product.brand}
                        </span>
                      )}
                      {qty && (
                        <span className="text-sm text-muted-foreground shrink-0">
                          {qty}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {shop && (
                        <Badge variant="outline" className="text-xs">
                          {shop.name}
                        </Badge>
                      )}
                      {product.barcode && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <ScanBarcode className="h-3 w-3" />
                          {product.barcode}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setEditingProduct(product)}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setDeleteTarget(product)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <EditProductDialog
        open={!!editingProduct}
        onOpenChange={(open) => { if (!open) setEditingProduct(null); }}
        product={editingProduct}
        householdId={householdId}
        shops={shops}
      />

      <DeleteProductDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        productName={deleteTarget?.name ?? ''}
        isDeleting={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
