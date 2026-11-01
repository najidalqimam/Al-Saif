import { randomBytes } from "node:crypto";
import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { Prisma, type AdminRole } from "@prisma/client";
import { requireAdmin } from "../auth/middleware.js";
import { categoryWhere, isCatalogueId, productWhere, slugify } from "../catalogue/ids.js";
import { DATA_URL, ImageError, decodeImage, saveProductImage } from "../catalogue/images.js";
import { adminCategory, adminProduct, categoryInclude, categoryLevels, productInclude, productOrder } from "../catalogue/serialize.js";
import { prisma } from "../db.js";

// /api/admin/...: catalogue management for the dashboard. Every change is validated here and saved to the
// database; nothing the browser sends is trusted beyond the fields listed below. There is no delete:
// products and categories are archived (archived_at) and can be restored.

const READ_ROLES: AdminRole[] = ["OWNER", "MANAGER", "EDITOR", "SUPPORT"];
const WRITE_ROLES: AdminRole[] = ["OWNER", "MANAGER", "EDITOR"];
const INVENTORY_SETTING = "inventory";
const DEFAULT_LOW_STOCK = 5;
/** New categories go at most two levels deep, like the dashboard form; older deeper ones stay as they are. */
const MAX_NEW_CATEGORY_LEVEL = 2;

const text = (max: number) => z.string().trim().max(max);
const name = (max: number) => text(max).min(1);
/** Prices as numbers or decimal strings with at most 2 decimals, up to the DECIMAL(12,2) limit. */
const money = z
  .union([z.number(), z.string().trim()])
  .transform((value) => (typeof value === "number" ? value : value === "" ? NaN : Number(value)))
  .refine((value) => Number.isFinite(value) && value >= 0 && value <= 9_999_999_999.99 && Math.abs(Math.round(value * 100) - value * 100) < 1e-6, "A price with at most 2 decimals")
  .transform((value) => new Prisma.Decimal(value.toFixed(2)));
const price = money.refine((value) => value.gt(0), "The price must be more than 0");
const catalogueId = z.string().refine(isCatalogueId, "Unknown id");
const image = z.string().max(1_500_000).regex(DATA_URL, "A PNG, JPEG or WebP data URL");

/** Product page highlights and spec rows; null clears them back to the storefront's built-in copy. */
const features = z.array(text(200).min(1)).max(20).nullable();
const specRows = z.array(z.object({ label: text(80).min(1), value: text(200).min(1) }).strict()).max(30).nullable();

const ProductFields = z.object({
  nameAr: name(300),
  nameEn: name(300),
  labelAr: text(200),
  labelEn: text(200),
  descriptionAr: text(4000),
  descriptionEn: text(4000),
  featuresAr: features,
  featuresEn: features,
  specsAr: specRows,
  specsEn: specRows,
  categoryId: catalogueId.nullable(),
  price,
  compareAtPrice: money.nullable(),
  isVisible: z.boolean(),
  showInHomeOffers: z.boolean(),
});

const NewProduct = ProductFields.partial({
  labelAr: true,
  labelEn: true,
  descriptionAr: true,
  descriptionEn: true,
  featuresAr: true,
  featuresEn: true,
  specsAr: true,
  specsEn: true,
  compareAtPrice: true,
  isVisible: true,
  showInHomeOffers: true,
})
  .extend({ categoryId: catalogueId, image: image.optional() })
  .strict();
const ProductPatch = ProductFields.partial()
  .extend({ image: image.optional() })
  .strict()
  .refine((body) => Object.keys(body).length > 0, "Nothing to change");
/** Prisma writes a JSON column's SQL NULL as Prisma.DbNull, not as a plain null. */
function jsonFields<T extends { featuresAr?: unknown; featuresEn?: unknown; specsAr?: unknown; specsEn?: unknown }>(fields: T) {
  const out: Record<string, unknown> = { ...fields };
  for (const key of ["featuresAr", "featuresEn", "specsAr", "specsEn"] as const) {
    if (fields[key] === null) out[key] = Prisma.DbNull;
  }
  return out as Omit<T, "featuresAr" | "featuresEn" | "specsAr" | "specsEn"> & Record<"featuresAr" | "featuresEn" | "specsAr" | "specsEn", Prisma.InputJsonValue | typeof Prisma.DbNull | undefined>;
}

const StockBody = z
  .object({
    quantity: z.number().int().min(0).max(1_000_000).nullable(),
    /** The quantity the dashboard last saw; the change is refused if it moved meanwhile (an order, another admin). */
    expected: z.number().int().min(0).nullable(),
  })
  .strict();

const CategoryFields = z.object({
  nameAr: name(200),
  nameEn: name(200),
  descriptionAr: text(2000),
  descriptionEn: text(2000),
  isVisible: z.boolean(),
  isFeatured: z.boolean(),
});
const NewCategory = CategoryFields.partial({ descriptionAr: true, descriptionEn: true, isVisible: true, isFeatured: true })
  .extend({ parentId: catalogueId.nullable().optional() })
  .strict();
const CategoryPatch = CategoryFields.partial()
  .strict()
  .refine((body) => Object.keys(body).length > 0, "Nothing to change");
const InventoryBody = z.object({ lowStock: z.number().int().min(0).max(100_000) }).strict();

class ApiProblem extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(code);
  }
}

function invalid(res: Response, error: z.ZodError) {
  res.status(400).json({ error: "INVALID_INPUT", issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) });
}

/** Runs a handler and turns known problems into JSON errors; anything else goes to the app's 500 handler. */
function handle(run: (req: Request, res: Response) => Promise<void>) {
  return async (req: Request, res: Response) => {
    try {
      await run(req, res);
    } catch (error) {
      if (error instanceof ApiProblem) {
        res.status(error.status).json({ error: error.code, ...error.details });
        return;
      }
      if (error instanceof ImageError) {
        res.status(400).json({ error: "INVALID_IMAGE", message: error.message });
        return;
      }
      throw error;
    }
  };
}

async function findProduct(id: string) {
  if (!isCatalogueId(id)) throw new ApiProblem(404, "PRODUCT_NOT_FOUND");
  const product = await prisma.product.findUnique({ where: productWhere(id), include: productInclude });
  if (!product) throw new ApiProblem(404, "PRODUCT_NOT_FOUND");
  return product;
}

async function findCategory(id: string) {
  if (!isCatalogueId(id)) throw new ApiProblem(404, "CATEGORY_NOT_FOUND");
  const category = await prisma.category.findUnique({ where: categoryWhere(id), include: categoryInclude });
  if (!category) throw new ApiProblem(404, "CATEGORY_NOT_FOUND");
  return category;
}

/** A category products can be placed in: it must exist and not be archived. */
async function usableCategory(id: string) {
  const category = await findCategory(id);
  if (category.archivedAt) throw new ApiProblem(409, "CATEGORY_ARCHIVED");
  return category;
}

async function levelOf(categoryId: string) {
  const all = await prisma.category.findMany({ select: { id: true, parentId: true } });
  return categoryLevels(all).get(categoryId) ?? 1;
}

async function sendCategory(res: Response, id: string, status = 200) {
  const category = await prisma.category.findUniqueOrThrow({ where: { id }, include: categoryInclude });
  res.status(status).json({ category: adminCategory(category, await levelOf(id)) });
}

async function lowStockSetting() {
  const setting = await prisma.storeSetting.findUnique({ where: { key: INVENTORY_SETTING } });
  const value = setting?.value as { lowStock?: unknown } | undefined;
  return typeof value?.lowStock === "number" ? value.lowStock : DEFAULT_LOW_STOCK;
}

export const adminCatalogueRouter = Router();

// ---------------------------------------------------------------------------
// Whole catalogue for the dashboard, including hidden and archived items and stock
// ---------------------------------------------------------------------------

adminCatalogueRouter.get(
  "/catalogue",
  requireAdmin(READ_ROLES),
  handle(async (req, res) => {
    const [categories, products, lowStock] = await Promise.all([
      prisma.category.findMany({ include: categoryInclude, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
      prisma.product.findMany({ include: productInclude, orderBy: productOrder }),
      lowStockSetting(),
    ]);
    const levels = categoryLevels(categories);
    res.setHeader("Cache-Control", "no-store");
    res.json({
      categories: categories.map((category) => adminCategory(category, levels.get(category.id) ?? 1)),
      products: products.map(adminProduct),
      settings: { lowStock },
      canEdit: WRITE_ROLES.includes(req.admin!.role),
    });
  }),
);

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

adminCatalogueRouter.post(
  "/products",
  requireAdmin(WRITE_ROLES),
  handle(async (req, res) => {
    const body = NewProduct.safeParse(req.body);
    if (!body.success) return invalid(res, body.error);
    const { image: upload, categoryId, ...fields } = body.data;
    const category = await usableCategory(categoryId);
    if (upload) decodeImage(upload); // refuse a bad image before anything is written
    const legacyId = `p-${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
    const last = await prisma.product.aggregate({ _max: { sortOrder: true } });
    const url = upload ? await saveProductImage(upload, legacyId) : null;
    const product = await prisma.product.create({
      data: {
        ...jsonFields(fields),
        legacyId,
        slug: legacyId,
        categoryId: category.id,
        sortOrder: (last._max.sortOrder ?? 0) + 1,
        images: url ? { create: { url, altAr: fields.nameAr, altEn: fields.nameEn } } : undefined,
      },
      include: productInclude,
    });
    res.status(201).json({ product: adminProduct(product) });
  }),
);

adminCatalogueRouter.patch(
  "/products/:id",
  requireAdmin(WRITE_ROLES),
  handle(async (req, res) => {
    const body = ProductPatch.safeParse(req.body);
    if (!body.success) return invalid(res, body.error);
    const product = await findProduct(String(req.params.id));
    const { image: upload, categoryId, ...fields } = body.data;
    let categoryUuid: string | null | undefined;
    if (categoryId !== undefined) categoryUuid = categoryId === null ? null : (await usableCategory(categoryId)).id;
    if (upload) decodeImage(upload);
    const url = upload ? await saveProductImage(upload, product.legacyId ?? product.id) : null;
    // A new photo goes in front of the existing ones; older photos and their files are kept.
    const first = product.images[0]?.sortOrder ?? 0;
    const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        ...jsonFields(fields),
        categoryId: categoryUuid,
        images: url ? { create: { url, sortOrder: first - 1, altAr: fields.nameAr ?? product.nameAr, altEn: fields.nameEn ?? product.nameEn } } : undefined,
      },
      include: productInclude,
    });
    res.json({ product: adminProduct(updated) });
  }),
);

adminCatalogueRouter.post(
  "/products/:id/archive",
  requireAdmin(WRITE_ROLES),
  handle(async (req, res) => {
    const product = await findProduct(String(req.params.id));
    // Images, stock history and past orders stay linked to the product; it only leaves the storefront.
    const updated = await prisma.product.update({ where: { id: product.id }, data: { archivedAt: product.archivedAt ?? new Date() }, include: productInclude });
    res.json({ product: adminProduct(updated) });
  }),
);

adminCatalogueRouter.post(
  "/products/:id/restore",
  requireAdmin(WRITE_ROLES),
  handle(async (req, res) => {
    const product = await findProduct(String(req.params.id));
    if (product.categoryId) {
      const category = await prisma.category.findUniqueOrThrow({ where: { id: product.categoryId } });
      if (category.archivedAt) throw new ApiProblem(409, "CATEGORY_ARCHIVED");
    }
    const updated = await prisma.product.update({ where: { id: product.id }, data: { archivedAt: null }, include: productInclude });
    res.json({ product: adminProduct(updated) });
  }),
);

adminCatalogueRouter.put(
  "/products/:id/stock",
  requireAdmin(WRITE_ROLES),
  handle(async (req, res) => {
    const body = StockBody.safeParse(req.body);
    if (!body.success) return invalid(res, body.error);
    const product = await findProduct(String(req.params.id));
    const { quantity, expected } = body.data;
    const adminUserId = req.admin!.id;
    await prisma.$transaction(async (tx) => {
      // Conditional update: if an order or another admin changed the quantity since the dashboard read it,
      // nothing is written and the dashboard reloads instead of silently undoing that change.
      const changed = await tx.product.updateMany({ where: { id: product.id, stockQuantity: expected }, data: { stockQuantity: quantity } });
      if (changed.count === 0) throw new ApiProblem(409, "STOCK_CHANGED");
      const delta = (quantity ?? 0) - (expected ?? 0);
      if (delta !== 0) {
        await tx.stockMovement.create({
          data: { productId: product.id, delta, reason: "MANUAL_ADJUSTMENT", adminUserId, note: quantity === null ? "Stock tracking switched off" : expected === null ? "Stock tracking switched on" : null },
        });
      }
    });
    const updated = await prisma.product.findUniqueOrThrow({ where: { id: product.id }, include: productInclude });
    res.json({ product: adminProduct(updated) });
  }),
);

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

adminCatalogueRouter.post(
  "/categories",
  requireAdmin(WRITE_ROLES),
  handle(async (req, res) => {
    const body = NewCategory.safeParse(req.body);
    if (!body.success) return invalid(res, body.error);
    const { parentId, isFeatured, ...fields } = body.data;
    const parent = parentId ? await usableCategory(parentId) : null;
    if (parent && (await levelOf(parent.id)) + 1 > MAX_NEW_CATEGORY_LEVEL) throw new ApiProblem(422, "CATEGORY_TOO_DEEP");
    // Slugs compare case-insensitively in MySQL, so the uniqueness check matches what the database enforces.
    const base = slugify(fields.nameEn, "department");
    let slug = base;
    for (let n = 2; await prisma.category.findFirst({ where: { OR: [{ slug }, { legacyId: slug }] }, select: { id: true } }); n += 1) slug = `${base}-${n}`;
    const last = await prisma.category.aggregate({ where: { parentId: parent?.id ?? null }, _max: { sortOrder: true } });
    const category = await prisma.category.create({
      data: { ...fields, slug, legacyId: slug, parentId: parent?.id ?? null, isFeatured: !parent && Boolean(isFeatured), sortOrder: (last._max.sortOrder ?? 0) + 1 },
    });
    await sendCategory(res, category.id, 201);
  }),
);

adminCatalogueRouter.patch(
  "/categories/:id",
  requireAdmin(WRITE_ROLES),
  handle(async (req, res) => {
    const body = CategoryPatch.safeParse(req.body);
    if (!body.success) return invalid(res, body.error);
    const category = await findCategory(String(req.params.id));
    const { isFeatured, ...fields } = body.data;
    // Only main departments appear in the home page grid.
    await prisma.category.update({ where: { id: category.id }, data: { ...fields, isFeatured: isFeatured === undefined ? undefined : !category.parentId && isFeatured } });
    await sendCategory(res, category.id);
  }),
);

adminCatalogueRouter.post(
  "/categories/:id/archive",
  requireAdmin(WRITE_ROLES),
  handle(async (req, res) => {
    const category = await findCategory(String(req.params.id));
    // Archiving a category that still holds live subcategories or products would strand them, so it is refused
    // until they are moved or archived first.
    const [children, products] = await Promise.all([
      prisma.category.count({ where: { parentId: category.id, archivedAt: null } }),
      prisma.product.count({ where: { categoryId: category.id, archivedAt: null } }),
    ]);
    if (children || products) throw new ApiProblem(409, "CATEGORY_NOT_EMPTY", { children, products });
    await prisma.category.update({ where: { id: category.id }, data: { archivedAt: category.archivedAt ?? new Date() } });
    await sendCategory(res, category.id);
  }),
);

adminCatalogueRouter.post(
  "/categories/:id/restore",
  requireAdmin(WRITE_ROLES),
  handle(async (req, res) => {
    const category = await findCategory(String(req.params.id));
    if (category.parentId) {
      const parent = await prisma.category.findUniqueOrThrow({ where: { id: category.parentId } });
      if (parent.archivedAt) throw new ApiProblem(409, "PARENT_ARCHIVED");
    }
    await prisma.category.update({ where: { id: category.id }, data: { archivedAt: null } });
    await sendCategory(res, category.id);
  }),
);

// ---------------------------------------------------------------------------
// Inventory settings
// ---------------------------------------------------------------------------

adminCatalogueRouter.put(
  "/settings/inventory",
  requireAdmin(WRITE_ROLES),
  handle(async (req, res) => {
    const body = InventoryBody.safeParse(req.body);
    if (!body.success) return invalid(res, body.error);
    await prisma.storeSetting.upsert({
      where: { key: INVENTORY_SETTING },
      create: { key: INVENTORY_SETTING, value: { lowStock: body.data.lowStock } },
      update: { value: { lowStock: body.data.lowStock } },
    });
    res.json({ settings: { lowStock: body.data.lowStock } });
  }),
);
