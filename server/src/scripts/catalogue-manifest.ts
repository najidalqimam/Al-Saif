import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { decodeImage } from "../catalogue/images.js";

// Builds the catalogue import manifest from a read-only browser snapshot plus the storefront's own files.
//
//   pnpm catalogue:manifest --snapshot catalogue-data/<snapshot>.json --out catalogue-data/manifest.json [--write-images]
//
// The snapshot is what the dashboard shows today (the code catalogue with this browser's edits on top), so it
// wins where it has a value; the code supplies categories, default product placements and photo paths.
// Nothing is invented: missing descriptions stay empty and unrecorded stock stays untracked (null).
// --write-images saves images that exist only inside the snapshot (data URLs) as new files under
// public/uploads/products. An existing file is never replaced; if one is there it must be byte-identical.

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const PUBLIC = path.join(ROOT, "public");

type Category = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  image: string;
  icon: string;
  parentId: string | null;
  level: number;
  sort: number;
  active: boolean;
  featured: boolean;
};
type Row = {
  id: string;
  price: number;
  compareAt: number;
  rating: number;
  reviews: number;
  hidden: boolean;
  onHome: boolean;
  nameAr: string;
  nameEn: string;
  categoryAr: string;
  categoryEn: string;
  archived?: boolean;
  categoryId?: string;
  image?: string;
  source?: "demo" | "added";
};

function arg(name: string) {
  const index = process.argv.indexOf(name);
  return index > 0 ? process.argv[index + 1] : undefined;
}
const sha256 = (data: Buffer | string) => createHash("sha256").update(data).digest("hex");
const money = (value: number) => {
  if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid price ${value}`);
  return value.toFixed(2);
};

async function main() {
  const snapshotPath = arg("--snapshot");
  const outPath = arg("--out");
  const writeImages = process.argv.includes("--write-images");
  if (!snapshotPath || !outPath) throw new Error("Usage: --snapshot <file> --out <file> [--write-images]");
  if (existsSync(outPath)) throw new Error(`${outPath} already exists; choose a new name (manifests are never overwritten).`);

  const snapshotRaw = readFileSync(snapshotPath);
  const snapshot = JSON.parse(snapshotRaw.toString("utf8")) as { capturedAt: string; origin: string; localStorage: Record<string, string | null> };
  const content = JSON.parse(snapshot.localStorage["alsaif-home-content"] ?? "null") as {
    products: Row[];
    addedCategories?: Category[];
    categoryHidden?: string[];
    categoryArchived?: string[];
  } | null;
  if (!content?.products?.length) throw new Error("The snapshot has no catalogue (alsaif-home-content.products).");
  const ops = JSON.parse(snapshot.localStorage["alsaif-admin-ops"] ?? "null") as { stock?: Record<string, number>; lowStock?: number } | null;

  // Code catalogue. catalog-tree.ts and demo-products.ts have no imports, so they load directly.
  const { CATALOG } = (await import(pathToFileURL(path.join(ROOT, "src/data/catalog-tree.ts")).href)) as { CATALOG: Category[] };
  const { DEMO_PRODUCTS } = (await import(pathToFileURL(path.join(ROOT, "src/data/demo-products.ts")).href)) as { DEMO_PRODUCTS: Array<Row & { categoryId: string; image: string }> };
  // products.ts and product-categories.ts use the "@/" alias, so their plain data tables are read as text.
  const productsSource = readFileSync(path.join(ROOT, "src/lib/products.ts"), "utf8");
  const builtIn = new Map(
    [...productsSource.matchAll(/\{ id: "([^"]+)", mark: "[^"]+", price: (\d+(?:\.\d+)?), compareAt: (\d+(?:\.\d+)?), rating: ([\d.]+), reviews: (\d+) \}/g)].map((m) => [
      m[1]!,
      { price: Number(m[2]), compareAt: Number(m[3]), rating: Number(m[4]), reviews: Number(m[5]) },
    ]),
  );
  const placementSource = readFileSync(path.join(ROOT, "src/lib/product-categories.ts"), "utf8");
  const placementBlock = /PRODUCT_CATEGORY[^=]*=\s*\{([\s\S]*?)\};/.exec(placementSource)?.[1] ?? "";
  const placement = new Map([...placementBlock.matchAll(/"?([a-z0-9-]+)"?:\s*"([a-z0-9-]+)"/g)].map((m) => [m[1]!, m[2]!]));
  if (builtIn.size !== 20 || placement.size !== 20) throw new Error(`Could not read the built-in tables (${builtIn.size} products, ${placement.size} placements).`);

  const differences: string[] = [];
  const warnings: string[] = [];

  // ---------------------------------------------------------------- categories
  const hidden = new Set(content.categoryHidden ?? []);
  const archived = new Set(content.categoryArchived ?? []);
  const sourceCategories = [...CATALOG, ...(content.addedCategories ?? [])];
  const categoryIds = new Set<string>();
  const categories = sourceCategories.map((category) => {
    if (categoryIds.has(category.id.toLowerCase())) throw new Error(`Duplicate category id ${category.id}`);
    categoryIds.add(category.id.toLowerCase());
    if (category.image && !existsSync(path.join(PUBLIC, category.image))) throw new Error(`Missing category image ${category.image}`);
    return {
      legacyId: category.id,
      slug: category.slug,
      parentLegacyId: category.parentId,
      nameAr: category.nameAr,
      nameEn: category.nameEn,
      descriptionAr: category.descriptionAr ?? "",
      descriptionEn: category.descriptionEn ?? "",
      imageUrl: category.image || null,
      imageSha256: category.image ? sha256(readFileSync(path.join(PUBLIC, category.image))) : null,
      icon: category.icon || "grid",
      sortOrder: category.sort,
      isFeatured: Boolean(category.featured),
      isVisible: category.active && !hidden.has(category.id),
      archived: archived.has(category.id),
      source: CATALOG.includes(category) ? "code" : "dashboard",
    };
  });
  for (const category of categories) {
    if (category.parentLegacyId && !categoryIds.has(category.parentLegacyId.toLowerCase())) throw new Error(`Category ${category.legacyId} has an unknown parent`);
  }

  // ---------------------------------------------------------------- products
  const productIds = new Set<string>();
  const products = content.products.map((row, index) => {
    if (productIds.has(row.id.toLowerCase())) throw new Error(`Duplicate product id ${row.id}`);
    productIds.add(row.id.toLowerCase());
    const code = builtIn.get(row.id);
    const demo = DEMO_PRODUCTS.find((item) => item.id === row.id);
    const source = code ? "built-in" : demo ? "demo" : "dashboard";

    // Report every place the browser differs from the code; the browser value is the one imported.
    const compare = (field: string, browser: unknown, fromCode: unknown) => {
      if (fromCode !== undefined && browser !== fromCode) differences.push(`${row.id}.${field}: browser ${JSON.stringify(browser)}, code ${JSON.stringify(fromCode)} (browser value kept)`);
    };
    if (code) {
      compare("price", row.price, code.price);
      compare("compareAt", row.compareAt, code.compareAt);
      compare("rating", row.rating, code.rating);
      compare("reviews", row.reviews, code.reviews);
    }
    if (demo) {
      for (const field of ["nameAr", "nameEn", "categoryAr", "categoryEn", "categoryId", "price", "compareAt", "image"] as const) compare(field, row[field], demo[field]);
    }

    const categoryLegacyId = row.categoryId ?? placement.get(row.id) ?? null;
    if (!categoryLegacyId || !categoryIds.has(categoryLegacyId.toLowerCase())) throw new Error(`Product ${row.id} has no known category (${categoryLegacyId})`);

    // Photos: built-in products use a card photo and a dashboard thumbnail; "case" uses one file for both.
    const images: Array<{ url: string; sortOrder: number; sha256: string; fromDataUrl?: boolean }> = [];
    const addFile = (url: string) => {
      if (images.some((image) => image.url === url)) return;
      const file = path.join(PUBLIC, url);
      if (!existsSync(file)) throw new Error(`Missing product image ${url} for ${row.id}`);
      images.push({ url, sortOrder: images.length, sha256: sha256(readFileSync(file)) });
    };
    if (row.image?.startsWith("data:")) {
      const { bytes, ext } = decodeImage(row.image);
      const url = `/uploads/products/${row.id}.${ext}`;
      const file = path.join(PUBLIC, url);
      if (existsSync(file)) {
        if (!readFileSync(file).equals(bytes)) throw new Error(`${url} exists with different content; it is never replaced.`);
      } else if (writeImages) {
        mkdirSync(path.dirname(file), { recursive: true });
        writeFileSync(file, bytes, { flag: "wx" });
      } else {
        throw new Error(`${row.id} has an embedded image; run again with --write-images to save it as ${url}.`);
      }
      images.push({ url, sortOrder: 0, sha256: sha256(bytes), fromDataUrl: true });
    } else if (row.image) {
      addFile(row.image);
    } else if (code) {
      addFile(row.id === "case" ? "/card-photos/product-case.png" : `/showcase/${row.id}.png`);
      addFile(`/card-photos/product-${row.id}.png`);
    } else {
      warnings.push(`${row.id} has no image`);
    }

    const stock = ops?.stock?.[row.id];
    return {
      legacyId: row.id,
      slug: row.id,
      sortOrder: index + 1,
      source,
      nameAr: row.nameAr,
      nameEn: row.nameEn,
      labelAr: row.categoryAr ?? "",
      labelEn: row.categoryEn ?? "",
      price: money(row.price),
      // Kept exactly as saved, even when it equals the price (the storefront then shows no discount).
      compareAtPrice: Number.isFinite(row.compareAt) ? money(row.compareAt) : null,
      categoryLegacyId,
      isVisible: !row.hidden,
      showInHomeOffers: Boolean(row.onHome),
      archived: Boolean(row.archived),
      ratingAverage: row.rating > 0 ? row.rating.toFixed(1) : null,
      reviewCount: row.reviews ?? 0,
      stockQuantity: typeof stock === "number" ? stock : null,
      images,
    };
  });

  const manifest = {
    generatedAt: new Date().toISOString(),
    snapshot: { file: path.basename(snapshotPath), sha256: sha256(snapshotRaw), capturedAt: snapshot.capturedAt, origin: snapshot.origin },
    settings: { inventory: { lowStock: typeof ops?.lowStock === "number" ? ops.lowStock : null } },
    counts: {
      categories: categories.length,
      products: products.length,
      productsBySource: products.reduce<Record<string, number>>((acc, item) => ({ ...acc, [item.source]: (acc[item.source] ?? 0) + 1 }), {}),
      productImages: products.reduce((sum, item) => sum + item.images.length, 0),
      categoryImages: categories.filter((item) => item.imageUrl).length,
    },
    differences,
    warnings,
    categories,
    products,
  };
  writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx", mode: 0o600 });
  console.log(JSON.stringify({ written: outPath, counts: manifest.counts, differences, warnings }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
