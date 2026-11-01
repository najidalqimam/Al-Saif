import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

// Imports a catalogue manifest (see catalogue-manifest.ts) into the database.
//
//   pnpm catalogue:import --manifest catalogue-data/<manifest>.json                       # dry run (default)
//   pnpm catalogue:import --manifest catalogue-data/<manifest>.json --apply --database <name>
//
// Safe to run again: categories and products are matched by legacy_id, images by (product, path) and settings
// by key. Anything that already exists is left exactly as it is, so edits made in the dashboard after an
// import are never overwritten. Nothing is ever deleted. Everything is written in one transaction.

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const PUBLIC = path.join(ROOT, "public");
const INVENTORY_SETTING = "inventory";

type Manifest = {
  snapshot: { file: string; sha256: string };
  settings: { inventory: { lowStock: number | null } };
  categories: Array<{
    legacyId: string;
    slug: string;
    parentLegacyId: string | null;
    nameAr: string;
    nameEn: string;
    descriptionAr: string;
    descriptionEn: string;
    imageUrl: string | null;
    imageSha256: string | null;
    icon: string;
    sortOrder: number;
    isFeatured: boolean;
    isVisible: boolean;
    archived: boolean;
  }>;
  products: Array<{
    legacyId: string;
    slug: string;
    sortOrder: number;
    nameAr: string;
    nameEn: string;
    labelAr: string;
    labelEn: string;
    price: string;
    compareAtPrice: string | null;
    categoryLegacyId: string;
    isVisible: boolean;
    showInHomeOffers: boolean;
    archived: boolean;
    ratingAverage: string | null;
    reviewCount: number;
    stockQuantity: number | null;
    images: Array<{ url: string; sortOrder: number; sha256: string }>;
  }>;
};

function arg(name: string) {
  const index = process.argv.indexOf(name);
  return index > 0 ? process.argv[index + 1] : undefined;
}

/** Name of the database DATABASE_URL points at, so --apply can require it explicitly. */
export function targetDatabase() {
  const url = new URL(process.env.DATABASE_URL ?? "");
  return { name: decodeURIComponent(url.pathname.replace(/^\//, "")), host: `${url.hostname}:${url.port || "3306"}` };
}

/** Checks every image file the manifest references still exists with the same content. */
export function checkImageFiles(manifest: Manifest) {
  const problems: string[] = [];
  const check = (url: string, expected: string) => {
    const file = path.join(PUBLIC, url);
    if (!existsSync(file)) problems.push(`missing ${url}`);
    else if (createHash("sha256").update(readFileSync(file)).digest("hex") !== expected) problems.push(`changed ${url}`);
  };
  for (const category of manifest.categories) if (category.imageUrl && category.imageSha256) check(category.imageUrl, category.imageSha256);
  for (const product of manifest.products) for (const image of product.images) check(image.url, image.sha256);
  return problems;
}

export function readManifest(file: string) {
  return JSON.parse(readFileSync(file, "utf8")) as Manifest;
}

async function main() {
  const manifestPath = arg("--manifest");
  const apply = process.argv.includes("--apply");
  if (!manifestPath) throw new Error("Usage: --manifest <file> [--apply --database <name>]");
  const manifest = readManifest(manifestPath);
  const target = targetDatabase();
  if (apply && arg("--database") !== target.name) {
    throw new Error(`--apply needs --database ${target.name} to confirm the target (DATABASE_URL points at "${target.name}" on ${target.host}).`);
  }

  const imageProblems = checkImageFiles(manifest);
  if (imageProblems.length) throw new Error(`Image files do not match the manifest: ${imageProblems.join(", ")}`);

  const report = {
    mode: apply ? "apply" : "dry-run",
    database: target.name,
    manifest: path.basename(manifestPath),
    snapshot: manifest.snapshot.file,
    startedAt: new Date().toISOString(),
    categories: { create: 0, existing: 0 },
    products: { create: 0, existing: 0 },
    images: { create: 0, existing: 0 },
    settings: { create: 0, existing: 0 },
    conflicts: [] as string[],
  };

  const run = async (tx: Prisma.TransactionClient) => {
    // Categories: parents before children. Existing ones are only looked up, never changed.
    const categoryIds = new Map<string, string>();
    for (const row of await tx.category.findMany({ select: { id: true, legacyId: true, slug: true } })) {
      if (row.legacyId) categoryIds.set(row.legacyId.toLowerCase(), row.id);
    }
    const pending = [...manifest.categories];
    while (pending.length) {
      const index = pending.findIndex((item) => !item.parentLegacyId || categoryIds.has(item.parentLegacyId.toLowerCase()) || !manifest.categories.some((c) => c.legacyId === item.parentLegacyId));
      if (index < 0) throw new Error("Category parents form a loop");
      const item = pending.splice(index, 1)[0]!;
      if (categoryIds.has(item.legacyId.toLowerCase())) {
        report.categories.existing += 1;
        continue;
      }
      const slugTaken = await tx.category.findFirst({ where: { slug: item.slug }, select: { legacyId: true } });
      if (slugTaken) {
        report.conflicts.push(`category slug ${item.slug} is already used by ${slugTaken.legacyId ?? "another category"}`);
        continue;
      }
      report.categories.create += 1;
      const parentId = item.parentLegacyId ? categoryIds.get(item.parentLegacyId.toLowerCase()) : null;
      if (!apply) {
        categoryIds.set(item.legacyId.toLowerCase(), `dry-run:${item.legacyId}`);
        continue;
      }
      const created = await tx.category.create({
        data: {
          legacyId: item.legacyId,
          slug: item.slug,
          parentId: parentId ?? null,
          nameAr: item.nameAr,
          nameEn: item.nameEn,
          descriptionAr: item.descriptionAr,
          descriptionEn: item.descriptionEn,
          imageUrl: item.imageUrl,
          icon: item.icon,
          sortOrder: item.sortOrder,
          isFeatured: item.isFeatured,
          isVisible: item.isVisible,
          archivedAt: item.archived ? new Date() : null,
        },
        select: { id: true },
      });
      categoryIds.set(item.legacyId.toLowerCase(), created.id);
    }

    // Products, then their images. An existing product keeps all its fields; only missing images are added.
    for (const item of manifest.products) {
      let product = await tx.product.findUnique({ where: { legacyId: item.legacyId }, select: { id: true } });
      if (product) {
        report.products.existing += 1;
      } else {
        const slugTaken = await tx.product.findUnique({ where: { slug: item.slug }, select: { legacyId: true } });
        if (slugTaken) {
          report.conflicts.push(`product slug ${item.slug} is already used by ${slugTaken.legacyId ?? "another product"}`);
          continue;
        }
        const categoryId = categoryIds.get(item.categoryLegacyId.toLowerCase());
        if (!categoryId) {
          report.conflicts.push(`product ${item.legacyId}: category ${item.categoryLegacyId} not found`);
          continue;
        }
        report.products.create += 1;
        if (apply) {
          product = await tx.product.create({
            data: {
              legacyId: item.legacyId,
              slug: item.slug,
              sortOrder: item.sortOrder,
              categoryId,
              nameAr: item.nameAr,
              nameEn: item.nameEn,
              labelAr: item.labelAr,
              labelEn: item.labelEn,
              price: new Prisma.Decimal(item.price),
              compareAtPrice: item.compareAtPrice === null ? null : new Prisma.Decimal(item.compareAtPrice),
              stockQuantity: item.stockQuantity,
              isVisible: item.isVisible,
              showInHomeOffers: item.showInHomeOffers,
              ratingAverage: item.ratingAverage === null ? null : new Prisma.Decimal(item.ratingAverage),
              reviewCount: item.reviewCount,
              archivedAt: item.archived ? new Date() : null,
            },
            select: { id: true },
          });
        }
      }
      for (const image of item.images) {
        const exists = product ? await tx.productImage.findFirst({ where: { productId: product.id, url: image.url }, select: { id: true } }) : null;
        if (exists) {
          report.images.existing += 1;
          continue;
        }
        report.images.create += 1;
        if (apply && product) await tx.productImage.create({ data: { productId: product.id, url: image.url, sortOrder: image.sortOrder, altAr: item.nameAr, altEn: item.nameEn } });
      }
    }

    // The low-stock alert level saved in the dashboard, if there was one.
    const lowStock = manifest.settings.inventory.lowStock;
    if (lowStock !== null) {
      if (await tx.storeSetting.findUnique({ where: { key: INVENTORY_SETTING } })) {
        report.settings.existing += 1;
      } else {
        report.settings.create += 1;
        if (apply) await tx.storeSetting.create({ data: { key: INVENTORY_SETTING, value: { lowStock } } });
      }
    }

    if (report.conflicts.length && apply) throw new Error(`Stopped without writing anything: ${report.conflicts.join("; ")}`);
  };

  if (apply) await prisma.$transaction(run, { timeout: 120_000, maxWait: 10_000 });
  else await run(prisma);

  const finished = { ...report, finishedAt: new Date().toISOString() };
  const reportPath = path.join(path.dirname(manifestPath), `import-report-${target.name}-${report.mode}-${Date.now()}.json`);
  writeFileSync(reportPath, `${JSON.stringify(finished, null, 2)}\n`, { flag: "wx", mode: 0o600 });
  console.log(JSON.stringify({ ...finished, report: reportPath }, null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main()
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
