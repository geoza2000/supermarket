const SHOP_GROUP_EXPANDED_PREFIX = 'stl:shopGroupExpanded';

export function readShopGroupExpanded(householdId: string, sectionKey: string): boolean {
  try {
    const raw = localStorage.getItem(`${SHOP_GROUP_EXPANDED_PREFIX}:${householdId}:${sectionKey}`);
    if (raw === null) return true;
    return raw === 'true';
  } catch {
    return true;
  }
}

export function writeShopGroupExpanded(
  householdId: string,
  sectionKey: string,
  expanded: boolean
): void {
  try {
    localStorage.setItem(
      `${SHOP_GROUP_EXPANDED_PREFIX}:${householdId}:${sectionKey}`,
      String(expanded)
    );
  } catch {
    // ignore quota / private mode
  }
}
