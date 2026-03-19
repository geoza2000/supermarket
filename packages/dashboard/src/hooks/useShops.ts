import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, Collections, Subcollections } from '@/lib/firebase';
import type { ShopDocument } from '@supermarket-list/shared';
import { sortShopDocumentsByDisplayOrder } from '@supermarket-list/shared';

export function useShops(householdId: string | null) {
  const [shops, setShops] = useState<ShopDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!householdId) {
      setShops([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const shopsRef = collection(
      db,
      Collections.HOUSEHOLDS,
      householdId,
      Subcollections.SHOPS
    );
    const q = query(shopsRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const raw = snapshot.docs.map(
          (doc) => doc.data() as ShopDocument
        );
        const newShops = sortShopDocumentsByDisplayOrder(raw);
        setShops(newShops);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to shops:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [householdId]);

  const shopMap = shops.reduce<Record<string, ShopDocument>>((acc, shop) => {
    acc[shop.shopId] = shop;
    return acc;
  }, {});

  return { shops, shopMap, loading };
}
