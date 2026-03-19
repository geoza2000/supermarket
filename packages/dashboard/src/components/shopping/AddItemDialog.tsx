import { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ScanBarcode, CheckCircle2, X, Search } from 'lucide-react';
import { useAddItem } from '@/hooks/mutations';
import { lookupBarcode } from '@/lib/barcodeLookup';
import type { ProductDocument, ShopDocument } from '@supermarket-list/shared';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  householdId: string;
  products: ProductDocument[];
  shops: ShopDocument[];
  onScanBarcode?: () => void;
  scannedBarcode?: string | null;
  onClearBarcode?: () => void;
}

const COMMON_UNITS = ['pcs', 'kg', 'g', 'liters', 'ml', 'pack', 'dozen'];

const UNIT_ALIASES: Record<string, string> = {
  l: 'liters',
  liter: 'liters',
  litre: 'liters',
  litres: 'liters',
  kilogram: 'kg',
  kilograms: 'kg',
  gram: 'g',
  grams: 'g',
  milliliter: 'ml',
  milliliters: 'ml',
  millilitre: 'ml',
  millilitres: 'ml',
  piece: 'pcs',
  pieces: 'pcs',
};

function parseQuantityString(raw: string): { amount: string; unit: string } {
  const match = raw.match(/^([\d.,]+)\s*(.*)$/);
  if (!match) return { amount: '', unit: '' };
  const amount = match[1].replace(',', '.');
  const rawUnit = match[2].trim().toLowerCase();
  const unit = UNIT_ALIASES[rawUnit] ?? (COMMON_UNITS.includes(rawUnit) ? rawUnit : '');
  return { amount, unit };
}

export function AddItemDialog({
  open,
  onOpenChange,
  householdId,
  products,
  shops,
  onScanBarcode,
  scannedBarcode,
  onClearBarcode,
}: AddItemDialogProps) {
  const addItemMutation = useAddItem();

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [shopId, setShopId] = useState<string>('');
  const [category, setCategory] = useState('');
  const [barcode, setBarcode] = useState('');
  const [matchedProduct, setMatchedProduct] = useState<ProductDocument | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);

  useEffect(() => {
    if (!scannedBarcode || !open) return;

    setBarcode(scannedBarcode);
    setLookupDone(false);

    const localMatch = products.find((p) => p.barcode === scannedBarcode);
    if (localMatch) {
      setName(localMatch.name);
      setBrand(localMatch.brand ?? '');
      setMatchedProduct(localMatch);
      if (localMatch.defaultQuantity) setQuantity(String(localMatch.defaultQuantity));
      if (localMatch.unit) setUnit(localMatch.unit);
      if (localMatch.shopId) setShopId(localMatch.shopId);
      if (localMatch.category) setCategory(localMatch.category);
      setLookupDone(true);
      return;
    }

    setLookingUp(true);
    lookupBarcode(scannedBarcode)
      .then((result) => {
        if (result.found) {
          if (result.name) setName(result.name);
          if (result.brand) setBrand(result.brand);
          if (result.category) setCategory(result.category);
          if (result.quantity) {
            const parsed = parseQuantityString(result.quantity);
            if (parsed.amount) setQuantity(parsed.amount);
            if (parsed.unit) setUnit(parsed.unit);
          }
        }
        setLookingUp(false);
        setLookupDone(true);
      })
      .catch(() => {
        setLookingUp(false);
        setLookupDone(true);
      });
  }, [scannedBarcode, open, products]);

  const suggestions = useMemo(() => {
    if (!name || name.length < 2 || matchedProduct) return [];
    const lower = name.toLowerCase();
    return products
      .filter((p) => p.name.toLowerCase().includes(lower))
      .slice(0, 5);
  }, [name, products, matchedProduct]);

  const handleNameChange = (value: string) => {
    setName(value);
    setMatchedProduct(null);
  };

  const handleSelectProduct = (product: ProductDocument) => {
    setName(product.name);
    setBrand(product.brand ?? '');
    setMatchedProduct(product);
    if (product.defaultQuantity) setQuantity(String(product.defaultQuantity));
    if (product.unit) setUnit(product.unit);
    if (product.shopId) setShopId(product.shopId);
    if (product.category) setCategory(product.category);
    if (product.barcode) setBarcode(product.barcode);
  };

  const resetForm = () => {
    setName('');
    setBrand('');
    setQuantity('');
    setUnit('');
    setShopId('');
    setCategory('');
    setBarcode('');
    setMatchedProduct(null);
    setLookupDone(false);
    onClearBarcode?.();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const resolvedShopId = shopId && shopId !== '__none__' ? shopId : null;
      await addItemMutation.mutateAsync({
        householdId,
        name: name.trim(),
        brand: brand.trim() || null,
        ...(matchedProduct?.productId && { productId: matchedProduct.productId }),
        barcode: barcode || null,
        quantity: quantity ? Number(quantity) : null,
        unit: unit || null,
        shopId: resolvedShopId,
        category: category.trim() || null,
      });
      resetForm();
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  const handleClearBarcode = () => {
    setBarcode('');
    setLookupDone(false);
    onClearBarcode?.();
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={handleClose}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Add Item</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto">
          {barcode && (
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg">
              {lookingUp ? (
                <>
                  <Search className="h-4 w-4 text-primary animate-pulse shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Looking up barcode...</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{barcode}</p>
                  </div>
                  <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {matchedProduct
                        ? 'Product found in catalog'
                        : lookupDone && name
                          ? 'Product identified'
                          : lookupDone
                            ? 'Not found — fill in details below'
                            : 'Barcode captured'}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{barcode}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={handleClearBarcode}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="item-name">Product Name</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="item-name"
                  placeholder="e.g. Tomatoes, Milk..."
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  autoFocus={!barcode}
                />
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {suggestions.map((product) => (
                      <button
                        key={product.productId}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                        onClick={() => handleSelectProduct(product)}
                      >
                        <span className="font-medium">{product.name}</span>
                        {product.brand && (
                          <span className="text-muted-foreground ml-1">
                            — {product.brand}
                          </span>
                        )}
                        {product.category && (
                          <span className="text-muted-foreground ml-2">
                            {product.category}
                          </span>
                        )}
                        {product.barcode && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {product.barcode}
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {onScanBarcode && (
                <Button type="button" variant="outline" size="icon" onClick={onScanBarcode}>
                  <ScanBarcode className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-brand">Brand (optional)</Label>
            <Input
              id="item-brand"
              placeholder="e.g. Nestlé, Heinz..."
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                step="any"
                min="0"
                placeholder="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {shops.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="shop">Shop (optional)</Label>
              <Select value={shopId} onValueChange={setShopId}>
                <SelectTrigger id="shop">
                  <SelectValue placeholder="No shop" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No shop</SelectItem>
                  {shops.map((shop) => (
                    <SelectItem key={shop.shopId} value={shop.shopId}>
                      {shop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="category">Category (optional)</Label>
            <Input
              id="category"
              placeholder="e.g. Dairy, Produce, Meat..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={!name.trim() || addItemMutation.isPending || lookingUp}
          >
            {addItemMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Add to List
          </Button>

          {addItemMutation.isError && (
            <p className="text-sm text-destructive text-center">
              Failed to add item. Please try again.
            </p>
          )}
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
