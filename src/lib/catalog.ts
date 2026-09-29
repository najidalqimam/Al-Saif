import { CATALOG, type CatalogCategory } from "@/data/catalog-tree";
import type { Lang } from "@/lib/i18n";

export { CATALOG };
export type { CatalogCategory };

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
  return CATALOG.find((item) => item.id === id || item.slug === id) ?? null;
}

export function rootDepartments(hidden: readonly string[]) {
  return CATALOG.filter((item) => item.level === 1 && isListed(item, hidden)).sort((a, b) => a.sort - b.sort);
}

export function featuredDepartments(hidden: readonly string[]) {
  return rootDepartments(hidden).filter((item) => item.featured);
}

export function childCategories(parentId: string, hidden: readonly string[]) {
  return CATALOG.filter((item) => item.parentId === parentId && isListed(item, hidden)).sort((a, b) => a.sort - b.sort);
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
