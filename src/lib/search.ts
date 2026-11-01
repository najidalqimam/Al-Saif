import { allCategories, isListed, type CatalogCategory } from "@/lib/catalog";
import { productInCategory } from "@/lib/product-categories";
import type { ProductRow } from "@/lib/site-content";

// Store search over product and department names, in Arabic and English at once, so a search typed in
// either language finds the same items whatever language the page is in.

/** Lowercases and folds Arabic spelling variants (hamza forms, taa marbuta, alef maqsura, diacritics). */
export function normalizeSearch(text: string) {
  return text
    .toLowerCase()
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function words(query: string) {
  return normalizeSearch(query)
    .split(" ")
    .filter(Boolean)
    // "ال" at the start of an Arabic word: "الشاشات" should still find "شاشات".
    .map((word) => (word.length > 3 && word.startsWith("ال") ? word.slice(2) : word))
    // Singular and plural share a stem: "شاشه" and "شاشات" both search for "شاش".
    .map((word) => (word.length > 4 && word.endsWith("ات") ? word.slice(0, -2) : word.length > 3 && word.endsWith("ه") ? word.slice(0, -1) : word));
}

function matches(haystack: string, terms: string[]) {
  const text = normalizeSearch(haystack);
  return terms.every((term) => text.includes(term));
}

export function searchStore(query: string, products: ProductRow[], hidden: readonly string[]) {
  const terms = words(query);
  if (terms.length === 0) return { categories: [] as CatalogCategory[], productIds: [] as string[] };

  const categories = allCategories().filter(
    (item) => isListed(item, hidden) && matches(`${item.nameAr} ${item.nameEn}`, terms),
  );
  const listed = products.filter((item) => !item.hidden && !item.archived);
  const byName = listed.filter((item) => matches(`${item.nameAr} ${item.nameEn} ${item.categoryAr} ${item.categoryEn}`, terms));
  // Products filed under a matching department count too, after the ones whose own name matches.
  const byCategory = listed.filter(
    (item) => !byName.includes(item) && categories.some((category) => productInCategory(item, category.id)),
  );

  return {
    categories: categories.sort((a, b) => a.level - b.level || a.sort - b.sort),
    productIds: [...byName, ...byCategory].map((item) => item.id),
  };
}
