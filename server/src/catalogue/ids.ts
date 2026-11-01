import type { Prisma } from "@prisma/client";

// The frontend identifies products and categories by their legacy id ("phone", "p-mvtbrk5h", "laptops").
// API routes accept either that or the database UUID and resolve it here, on the server.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Legacy ids are short lower-case slugs; anything else is rejected before it reaches the database. */
export const LEGACY_ID = /^[a-z0-9][a-z0-9-]{0,99}$/;

export function isCatalogueId(value: string) {
  return UUID.test(value) || LEGACY_ID.test(value);
}

export function productWhere(id: string): Prisma.ProductWhereUniqueInput {
  return UUID.test(id) ? { id: id.toLowerCase() } : { legacyId: id };
}

export function categoryWhere(id: string): Prisma.CategoryWhereUniqueInput {
  return UUID.test(id) ? { id: id.toLowerCase() } : { legacyId: id };
}

/** URL-safe slug from an English name ("Gaming chairs" → "gaming-chairs"). */
export function slugify(text: string, fallback: string) {
  const slug = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || fallback;
}
