export interface BarcodeLookupResult {
  found: boolean;
  name: string | null;
  category: string | null;
  quantity: string | null;
  brand: string | null;
}

const OPEN_FACTS_BASES = [
  'https://world.openfoodfacts.net',
  'https://world.openbeautyfacts.org',
  'https://world.openpetfoodfacts.org',
  'https://world.openproductsfacts.org',
] as const;

const NOT_FOUND: BarcodeLookupResult = {
  found: false,
  name: null,
  category: null,
  quantity: null,
  brand: null,
};

const FIELDS = 'product_name,categories_tags_en,quantity,brands';
const HEADERS = { 'User-Agent': 'SupermarketListApp/1.0' };

async function queryOpenFacts(
  baseUrl: string,
  barcode: string,
  signal: AbortSignal,
): Promise<BarcodeLookupResult> {
  const url = `${baseUrl}/api/v2/product/${encodeURIComponent(barcode)}?fields=${FIELDS}`;
  const response = await fetch(url, { headers: HEADERS, signal });

  if (!response.ok) return NOT_FOUND;

  const data = await response.json();
  if (data.status !== 1 || !data.product) return NOT_FOUND;

  const product = data.product;
  const name: string | null = product.product_name || null;
  const brand: string | null = product.brands || null;

  const categoriesTags: string[] = product.categories_tags_en || [];
  const category =
    categoriesTags.length > 0
      ? categoriesTags[categoriesTags.length - 1]
          .replace(/^en:/, '')
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase())
      : null;

  return {
    found: true,
    name,
    category,
    quantity: product.quantity || null,
    brand,
  };
}

export async function lookupBarcode(
  barcode: string,
): Promise<BarcodeLookupResult> {
  const controller = new AbortController();

  try {
    const results = await Promise.allSettled(
      OPEN_FACTS_BASES.map((base) =>
        queryOpenFacts(base, barcode, controller.signal),
      ),
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.found) {
        controller.abort();
        return result.value;
      }
    }

    return NOT_FOUND;
  } catch (err) {
    console.error('Barcode lookup failed:', err);
    return NOT_FOUND;
  }
}
