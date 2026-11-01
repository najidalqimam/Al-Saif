import type { Category, Prisma, Product, ProductImage } from "@prisma/client";

// Shapes the storefront and dashboard read. Products and categories are identified by their legacy id
// ("phone", "demo-tv", "laptops"), the id the frontend, carts, favourites and links have always used; the
// database UUID is included for reference only. Money is sent as exact decimal strings.

export const productInclude = {
  category: { select: { legacyId: true, slug: true } },
  images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Product & { category: Pick<Category, "legacyId" | "slug"> | null; images: ProductImage[] };

export const productOrder: Prisma.ProductOrderByWithRelationInput[] = [{ sortOrder: "asc" }, { createdAt: "asc" }];

const money = (value: Prisma.Decimal | null) => (value === null ? null : value.toFixed(2));

export function publicId(record: { legacyId: string | null; id: string }) {
  return record.legacyId ?? record.id;
}

/** Highlights saved as JSON; anything that is not a list of strings reads as "not set". */
function lines(value: Prisma.JsonValue | null) {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? (value as string[]) : null;
}

/** Spec rows saved as JSON; anything that is not a list of { label, value } reads as "not set". */
function specs(value: Prisma.JsonValue | null) {
  if (!Array.isArray(value)) return null;
  const rows = value.filter(
    (item): item is { label: string; value: string } =>
      typeof item === "object" && item !== null && !Array.isArray(item) && typeof item.label === "string" && typeof item.value === "string",
  );
  return rows.length === value.length ? rows.map(({ label, value: text }) => ({ label, value: text })) : null;
}

export function publicProduct(product: ProductWithRelations) {
  return {
    id: publicId(product),
    slug: product.slug,
    nameAr: product.nameAr,
    nameEn: product.nameEn,
    labelAr: product.labelAr,
    labelEn: product.labelEn,
    descriptionAr: product.descriptionAr,
    descriptionEn: product.descriptionEn,
    featuresAr: lines(product.featuresAr),
    featuresEn: lines(product.featuresEn),
    specsAr: specs(product.specsAr),
    specsEn: specs(product.specsEn),
    price: money(product.price)!,
    compareAtPrice: money(product.compareAtPrice),
    currency: product.currency,
    categoryId: product.category ? (product.category.legacyId ?? product.category.slug) : null,
    showInHomeOffers: product.showInHomeOffers,
    ratingAverage: product.ratingAverage === null ? null : product.ratingAverage.toFixed(1),
    reviewCount: product.reviewCount,
    images: product.images.map((image) => ({ url: image.url, altAr: image.altAr, altEn: image.altEn })),
  };
}

export function adminProduct(product: ProductWithRelations) {
  return {
    ...publicProduct(product),
    uuid: product.id,
    isVisible: product.isVisible,
    archivedAt: product.archivedAt,
    stockQuantity: product.stockQuantity,
    allowBackorder: product.allowBackorder,
    sortOrder: product.sortOrder,
    updatedAt: product.updatedAt,
  };
}

type CategoryWithParent = Category & { parent: Pick<Category, "legacyId" | "slug"> | null };

export const categoryInclude = { parent: { select: { legacyId: true, slug: true } } } satisfies Prisma.CategoryInclude;

/** Depth of each category (1 = main department), computed from the parent links. */
export function categoryLevels(categories: Array<Pick<Category, "id" | "parentId">>) {
  const byId = new Map(categories.map((item) => [item.id, item]));
  const levels = new Map<string, number>();
  const levelOf = (id: string, seen = new Set<string>()): number => {
    const known = levels.get(id);
    if (known) return known;
    const item = byId.get(id);
    // A missing or looping parent counts as the top level rather than failing the whole list.
    const level = item?.parentId && byId.has(item.parentId) && !seen.has(item.parentId) ? levelOf(item.parentId, seen.add(id)) + 1 : 1;
    levels.set(id, level);
    return level;
  };
  for (const item of categories) levelOf(item.id);
  return levels;
}

export function publicCategory(category: CategoryWithParent, level: number) {
  return {
    id: publicId(category),
    slug: category.slug,
    nameAr: category.nameAr,
    nameEn: category.nameEn,
    descriptionAr: category.descriptionAr,
    descriptionEn: category.descriptionEn,
    imageUrl: category.imageUrl,
    icon: category.icon,
    parentId: category.parent ? (category.parent.legacyId ?? category.parent.slug) : null,
    level,
    sortOrder: category.sortOrder,
    isFeatured: category.isFeatured,
    isVisible: category.isVisible,
  };
}

export function adminCategory(category: CategoryWithParent, level: number) {
  return { ...publicCategory(category, level), uuid: category.id, archivedAt: category.archivedAt, updatedAt: category.updatedAt };
}
