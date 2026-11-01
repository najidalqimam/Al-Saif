import { CATALOG, type CatalogCategory } from "@/data/catalog-tree";
import type { Lang } from "@/lib/i18n";

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

export function categoryLabel(category: CatalogCategory, lang: Lang) {
  return lang === "ar" ? category.nameAr : category.nameEn;
}

export function categoryBlurb(category: CatalogCategory, lang: Lang) {
  return lang === "ar" ? category.descriptionAr : category.descriptionEn;
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
