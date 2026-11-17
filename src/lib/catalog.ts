import { CATALOG, type CatalogCategory } from "@/data/catalog-tree";
import type { Lang } from "@/lib/i18n";
import { urCategoryBlurbs, urCategoryNames } from "@/lib/i18n-ur";

export { CATALOG };
export type { CatalogCategory };

// The category list everything reads. It is the built-in tree plus departments added in this browser, or,
// once the store's database answers, the database's own list. SiteContentProvider registers it on every
// render, so the storefront menus, category pages and the dashboard all read the same list.
let base: CatalogCategory[] = CATALOG;
let added: CatalogCategory[] = [];
// Order chosen in the dashboard while the store runs on this browser's own list: category id -> sort value.
let order: Record<string, number> = {};
let merged: CatalogCategory[] | null = null;

export function registerAddedCategories(list: CatalogCategory[]) {
  if (added !== list) merged = null;
  added = list;
}

export function registerCategoryOrder(next: Record<string, number>) {
  if (JSON.stringify(order) !== JSON.stringify(next)) merged = null;
  order = next;
}

/** Replaces the built-in tree with the database's categories; null goes back to the built-in tree. */
export function registerCatalogue(list: CatalogCategory[] | null) {
  const next = list ?? CATALOG;
  if (base !== next) merged = null;
  base = next;
}

export function allCategories() {
  if (!merged) {
    const list = added.length ? [...base, ...added] : base;
    merged = Object.keys(order).length ? list.map((item) => (order[item.id] === undefined ? item : { ...item, sort: order[item.id] })) : list;
  }
  return merged;
}

const BUILT_IN = new Map(CATALOG.map((item) => [item.slug, item]));

export function categoryLabel(category: CatalogCategory, lang: Lang) {
  // Urdu names cover the built-in tree; a category the admin renamed (or that has no Urdu name) keeps its Arabic name.
  if (lang === "ur") {
    if (category.nameUr?.trim()) return category.nameUr;
    const urdu = urCategoryNames[category.slug];
    return urdu && BUILT_IN.get(category.slug)?.nameAr === category.nameAr ? urdu : category.nameAr;
  }
  return lang === "en" ? category.nameEn : category.nameAr;
}

export function categoryBlurb(category: CatalogCategory, lang: Lang) {
  if (lang === "ur") {
    if (category.descriptionUr?.trim()) return category.descriptionUr;
    const urdu = urCategoryBlurbs[category.slug];
    return urdu && BUILT_IN.get(category.slug)?.descriptionAr === category.descriptionAr ? urdu : category.descriptionAr;
  }
  return lang === "en" ? category.descriptionEn : category.descriptionAr;
}

export function isListed(category: CatalogCategory, hidden: readonly string[]) {
  return category.active && !hidden.includes(category.id);
}

export function categoryById(id: string) {
  return allCategories().find((item) => item.id === id || item.slug === id) ?? null;
}

export function rootDepartments(hidden: readonly string[]) {
  return allCategories().filter((item) => item.level === 1 && isListed(item, hidden)).sort((a, b) => a.sort - b.sort);
}

export function featuredDepartments(hidden: readonly string[]) {
  return rootDepartments(hidden).filter((item) => item.featured);
}

/**
 * The store has main departments only: products sit straight under a department and subcategories are not shown
 * anywhere (storefront, shop dashboard or admin). The subcategories of the built-in tree stay in the data so that
 * products filed in them still belong to their main department (see categoryTrail and productInCategory).
 */
export function childCategories(_parentId: string, _hidden: readonly string[]): CatalogCategory[] {
  return [];
}

/** The main department a category belongs to (the category itself when it is one). */
export function departmentOf(id: string) {
  return categoryTrail(id)[0] ?? null;
}

export function categoryTrail(id: string) {
  const trail: CatalogCategory[] = [];
  let current = categoryById(id);
  while (current) {
    trail.unshift(current);
    current = current.parentId ? categoryById(current.parentId) : null;
  }
  return trail;
}

export function topDepartments(hidden: readonly string[], limit?: number) {
  const list = featuredDepartments(hidden);
  return limit ? list.slice(0, limit) : list;
}
