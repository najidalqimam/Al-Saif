import { categoryById, categoryTrail, childCategories, rootDepartments } from "@/lib/catalog";
import type { BuiltInProductId } from "@/lib/products";

// Default department for each product in the catalog tree (src/data/catalog-tree.ts). Products only
// carry a display label, so this links them; a department picked in the product editor overrides it.
// Moves to a category_id column on the products table with the database in stage 3.
export const PRODUCT_CATEGORY: Record<BuiltInProductId, string> = {
  phone: "phones",
  "phone-mini": "phones",
  case: "phone-accessories",
  charger: "phone-accessories",
  cable: "phone-accessories",
  dock: "phone-accessories",
  power: "phone-accessories",
  console: "consoles",
  game: "gaming",
  controller: "gaming-accessories",
  "controller-extra": "gaming-accessories",
  headset: "gaming-accessories",
  "gaming-earbuds": "gaming-accessories",
  earbuds: "headphones",
  speaker: "speakers",
  storage: "external-storage",
  "drive-512": "external-storage",
  screen: "monitors",
  "screen-24": "monitors",
  bag: "pc-accessories",
};

type Placed = { id: string; categoryId?: string };

/** The department a product sits in: the one picked in the dashboard if it still exists, else the default. */
export function productCategoryOf(product: Placed) {
  if (product.categoryId && categoryById(product.categoryId)) return product.categoryId;
  return PRODUCT_CATEGORY[product.id as BuiltInProductId] ?? null;
}

/** True when the product sits in the department or anywhere below it. */
export function productInCategory(product: Placed, categoryId: string) {
  const own = productCategoryOf(product);
  return own ? categoryTrail(own).some((item) => item.id === categoryId) : false;
}

/** Every listed main department followed by its subcategories, in storefront menu order (two levels). */
export function departmentTree(hidden: readonly string[]) {
  return rootDepartments(hidden).flatMap((item) => [item, ...childCategories(item.id, hidden)]);
}
