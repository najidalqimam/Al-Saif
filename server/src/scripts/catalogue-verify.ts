import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "../db.js";
import { checkImageFiles, readManifest, targetDatabase } from "./catalogue-import.js";

// Compares the database with a catalogue manifest after an import:
//
//   pnpm catalogue:verify --manifest catalogue-data/<manifest>.json
//
// Every manifest category and product must exist with the same values, every image path it references must be
// attached once, and every image path stored in the database must exist as a file. Rows added later in the
// dashboard are listed but are not errors. Read-only.

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const PUBLIC = path.join(ROOT, "public");

function arg(name: string) {
  const index = process.argv.indexOf(name);
  return index > 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const manifestPath = arg("--manifest");
  if (!manifestPath) throw new Error("Usage: --manifest <file>");
  const manifest = readManifest(manifestPath);
  const errors: string[] = [];
  const mismatch = (what: string, field: string, db: unknown, expected: unknown) => {
    if (db !== expected) errors.push(`${what}.${field}: database ${JSON.stringify(db)}, manifest ${JSON.stringify(expected)}`);
  };

  const categories = await prisma.category.findMany({ include: { parent: { select: { legacyId: true } } } });
  const products = await prisma.product.findMany({ include: { category: { select: { legacyId: true } }, images: true } });
  const byCategory = new Map(categories.map((item) => [item.legacyId?.toLowerCase(), item]));
  const byProduct = new Map(products.map((item) => [item.legacyId?.toLowerCase(), item]));

  for (const expected of manifest.categories) {
    const row = byCategory.get(expected.legacyId.toLowerCase());
    if (!row) {
      errors.push(`category ${expected.legacyId} missing`);
      continue;
    }
    const what = `category ${expected.legacyId}`;
    mismatch(what, "slug", row.slug, expected.slug);
    mismatch(what, "parent", row.parent?.legacyId ?? null, expected.parentLegacyId);
    mismatch(what, "nameAr", row.nameAr, expected.nameAr);
    mismatch(what, "nameEn", row.nameEn, expected.nameEn);
    mismatch(what, "descriptionAr", row.descriptionAr, expected.descriptionAr);
    mismatch(what, "descriptionEn", row.descriptionEn, expected.descriptionEn);
    mismatch(what, "imageUrl", row.imageUrl, expected.imageUrl);
    mismatch(what, "icon", row.icon, expected.icon);
    mismatch(what, "sortOrder", row.sortOrder, expected.sortOrder);
    mismatch(what, "isFeatured", row.isFeatured, expected.isFeatured);
    mismatch(what, "isVisible", row.isVisible, expected.isVisible);
    mismatch(what, "archived", row.archivedAt !== null, expected.archived);
  }

  for (const expected of manifest.products) {
    const row = byProduct.get(expected.legacyId.toLowerCase());
    if (!row) {
      errors.push(`product ${expected.legacyId} missing`);
      continue;
    }
    const what = `product ${expected.legacyId}`;
    mismatch(what, "slug", row.slug, expected.slug);
    mismatch(what, "nameAr", row.nameAr, expected.nameAr);
    mismatch(what, "nameEn", row.nameEn, expected.nameEn);
    mismatch(what, "labelAr", row.labelAr, expected.labelAr);
    mismatch(what, "labelEn", row.labelEn, expected.labelEn);
    mismatch(what, "price", row.price.toFixed(2), expected.price);
    mismatch(what, "compareAtPrice", row.compareAtPrice?.toFixed(2) ?? null, expected.compareAtPrice);
    mismatch(what, "category", row.category?.legacyId ?? null, expected.categoryLegacyId);
    mismatch(what, "isVisible", row.isVisible, expected.isVisible);
    mismatch(what, "showInHomeOffers", row.showInHomeOffers, expected.showInHomeOffers);
    mismatch(what, "archived", row.archivedAt !== null, expected.archived);
    mismatch(what, "ratingAverage", row.ratingAverage?.toFixed(1) ?? null, expected.ratingAverage);
    mismatch(what, "reviewCount", row.reviewCount, expected.reviewCount);
    mismatch(what, "stockQuantity", row.stockQuantity, expected.stockQuantity);
    mismatch(what, "descriptionAr", row.descriptionAr, "");
    mismatch(what, "descriptionEn", row.descriptionEn, "");
    for (const image of expected.images) {
      const attached = row.images.filter((item) => item.url === image.url);
      if (attached.length !== 1) errors.push(`${what}: image ${image.url} attached ${attached.length} times`);
    }
  }

  // Every stored path must point at a real file, whether it came from the import or the dashboard.
  for (const product of products) for (const image of product.images) if (!existsSync(path.join(PUBLIC, image.url))) errors.push(`product ${product.legacyId}: file missing for ${image.url}`);
  for (const category of categories) if (category.imageUrl && !existsSync(path.join(PUBLIC, category.imageUrl))) errors.push(`category ${category.legacyId}: file missing for ${category.imageUrl}`);
  errors.push(...checkImageFiles(manifest).map((problem) => `image file ${problem} since the manifest was built`));

  const manifestProducts = new Set(manifest.products.map((item) => item.legacyId.toLowerCase()));
  const manifestCategories = new Set(manifest.categories.map((item) => item.legacyId.toLowerCase()));
  const [{ migrations }] = await prisma.$queryRaw<Array<{ migrations: bigint }>>`SELECT COUNT(*) AS migrations FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`;
  const result = {
    database: targetDatabase().name,
    manifest: path.basename(manifestPath),
    ok: errors.length === 0,
    counts: {
      categories: categories.length,
      products: products.length,
      productImages: products.reduce((sum, item) => sum + item.images.length, 0),
      categoryImages: categories.filter((item) => item.imageUrl).length,
      appliedMigrations: Number(migrations),
    },
    addedAfterImport: {
      categories: categories.filter((item) => !manifestCategories.has(item.legacyId?.toLowerCase() ?? "")).map((item) => item.legacyId ?? item.id),
      products: products.filter((item) => !manifestProducts.has(item.legacyId?.toLowerCase() ?? "")).map((item) => item.legacyId ?? item.id),
    },
    errors,
  };
  const reportPath = path.join(path.dirname(manifestPath), `verify-report-${result.database}-${Date.now()}.json`);
  writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`, { flag: "wx", mode: 0o600 });
  console.log(JSON.stringify({ ...result, errors: errors.slice(0, 20), report: reportPath }, null, 2));
  if (errors.length) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
