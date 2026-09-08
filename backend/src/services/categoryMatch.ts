import { FALLBACK_CATEGORY } from "../defaults/categories.js";
import type { CategoryConfigRecord } from "../types.js";

export { FALLBACK_CATEGORY };

/**
 * Longest keyword wins. If nothing matches, keep the current category only
 * when it already exists in the user's config (or is the fallback bucket).
 * Unknown labels — including Pierre/Pluggy Open Finance categories — become
 * Sem Categoria instead of creating new dashboard groups.
 */
export function matchCategory(
  description: string,
  config: CategoryConfigRecord,
  currentCategory?: string,
): string {
  const desc = description.toLowerCase();

  let bestMatch = "";
  let bestCategory = "";

  for (const [catName, entry] of Object.entries(config.categories)) {
    for (const kw of entry.keywords) {
      const kwLower = kw.toLowerCase();
      if (desc.includes(kwLower) && kwLower.length > bestMatch.length) {
        bestMatch = kwLower;
        bestCategory = catName;
      }
    }
  }

  if (bestCategory) return bestCategory;
  if (
    currentCategory &&
    (currentCategory === FALLBACK_CATEGORY || config.categories[currentCategory])
  ) {
    return currentCategory;
  }
  return FALLBACK_CATEGORY;
}
