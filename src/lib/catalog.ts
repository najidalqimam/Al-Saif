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

export function registerAddedCategories(list: CatalogCategory[]) {
  added = list;
}

/** Replaces the built-in tree with the database's categories; null goes back to the built-in tree. */
export function registerCatalogue(list: CatalogCategory[] | null) {
  base = list ?? CATALOG;
}

export function allCategories() {
  return added.length ? [...base, ...added] : base;
}

const BUILT_IN = new Map(CATALOG.map((item) => [item.slug, item]));

export function categoryLabel(category: CatalogCategory, lang: Lang) {
  // Urdu names cover the built-in tree; a category the admin renamed (or that has no Urdu name) keeps its Arabic name.
  if (lang === "ur") {
    const urdu = urCategoryNames[category.slug];
    return urdu && BUILT_IN.get(category.slug)?.nameAr === category.nameAr ? urdu : category.nameAr;
  }
  return lang === "en" ? category.nameEn : category.nameAr;
}

export function categoryBlurb(category: CatalogCategory, lang: Lang) {
  if (lang === "ur") {
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

export function childCategories(parentId: string, hidden: readonly string[]) {
  return allCategories().filter((item) => item.parentId === parentId && isListed(item, hidden)).sort((a, b) => a.sort - b.sort);
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
