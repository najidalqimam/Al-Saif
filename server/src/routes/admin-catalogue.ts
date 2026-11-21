import { randomBytes } from "node:crypto";
import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requirePermission } from "../auth/middleware.js";
import { categoryWhere, isCatalogueId, productWhere, slugify } from "../catalogue/ids.js";
import { DATA_URL, ImageError, decodeImage, saveProductImage } from "../catalogue/images.js";
import { adminCategory, adminProduct, adminShop, categoryInclude, categoryLevels, productInclude, productOrder, shopOrder } from "../catalogue/serialize.js";
import { notifyShop } from "../notifications.js";
import { prisma } from "../db.js";

// /api/admin/...: catalogue management for the dashboard. Every change is validated here and saved to the
// database; nothing the browser sends is trusted beyond the fields listed below. There is no delete:
// products and categories are archived (archived_at) and can be restored.

const INVENTORY_SETTING = "inventory";
const DEFAULT_LOW_STOCK = 5;
/** The store has main departments only: a new category can no longer be placed inside another one. Older ones stay as they are. */
const MAX_NEW_CATEGORY_LEVEL = 1;

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
  /** English and Urdu are optional; empty means "show the Arabic text". */
  nameEn: text(300),
  nameUr: text(300),
  labelAr: text(200),
  labelEn: text(200),
  labelUr: text(200),
  descriptionAr: text(4000),
  descriptionEn: text(4000),
  descriptionUr: text(4000),
  featuresAr: features,
  featuresEn: features,
  featuresUr: features,
  specsAr: specRows,
  specsEn: specRows,
  specsUr: specRows,
  categoryId: catalogueId.nullable(),
  price,
  compareAtPrice: money.nullable(),
  /** Optional wholesale price per piece; null clears it. Checked against the selling price in the routes below. */
  wholesalePrice: price.nullable(),
  isVisible: z.boolean(),
  showInHomeOffers: z.boolean(),
});

export const NewProduct = ProductFields.partial({
  nameEn: true,
  nameUr: true,
  labelAr: true,
  labelEn: true,
  labelUr: true,
  descriptionAr: true,
  descriptionEn: true,
  descriptionUr: true,
  featuresAr: true,
  featuresEn: true,
  featuresUr: true,
  specsAr: true,
  specsEn: true,
  specsUr: true,
  compareAtPrice: true,
  wholesalePrice: true,
  isVisible: true,
  showInHomeOffers: true,
})
  .extend({ categoryId: catalogueId, image: image.optional(), shopId: z.string().uuid().nullable().optional() })
  .strict();
export const ProductPatch = ProductFields.partial()
  .extend({ image: image.optional(), shopId: z.string().uuid().nullable().optional() })
  .strict()
  .refine((body) => Object.keys(body).length > 0, "Nothing to change");
/** How a shop gets paid. Shown on the shop's page in the dashboard; every part is optional. */
export const ShopPayment = z
  .object({
    bankName: text(120),
    accountHolder: text(200),
    iban: text(40).regex(/^[A-Za-z0-9 ]*$/, "Letters and digits only"),
    accountNumber: text(40).regex(/^[0-9 -]*$/, "Digits only"),
    acceptsCod: z.boolean(),
    acceptsBankTransfer: z.boolean(),
    notes: text(1000),
  })
  .partial()
  .strict();
/** The payment block as table columns (notes is stored as payment_notes). */
export function paymentColumns(payment: z.infer<typeof ShopPayment> | undefined) {
  if (!payment) return {};
  const { notes, ...rest } = payment;
  return { ...rest, ...(notes === undefined ? {} : { paymentNotes: notes }) };
}
export const ShopFields = z.object({
  name: name(200),
  ownerName: text(200),
  phone: text(40),
  email: text(200),
  city: text(120),
  address: text(500),
  description: text(2000),
  payment: ShopPayment,
});
/** A new shop needs a name; the contact details are optional. */
const ShopBody = ShopFields.partial({ ownerName: true, phone: true, email: true, city: true, address: true, description: true, payment: true }).strict();
const ShopPatch = ShopFields.partial().strict().refine((body) => Object.keys(body).length > 0, "Nothing to change");
/** Prisma writes a JSON column's SQL NULL as Prisma.DbNull, not as a plain null. */
export function jsonFields<T extends { featuresAr?: unknown; featuresEn?: unknown; featuresUr?: unknown; specsAr?: unknown; specsEn?: unknown; specsUr?: unknown }>(fields: T) {
  const out: Record<string, unknown> = { ...fields };
  for (const key of ["featuresAr", "featuresEn", "featuresUr", "specsAr", "specsEn", "specsUr"] as const) {
    if (fields[key] === null) out[key] = Prisma.DbNull;
  }
  return out as Omit<T, "featuresAr" | "featuresEn" | "featuresUr" | "specsAr" | "specsEn" | "specsUr"> &
    Record<"featuresAr" | "featuresEn" | "featuresUr" | "specsAr" | "specsEn" | "specsUr", Prisma.InputJsonValue | typeof Prisma.DbNull | undefined>;
}

export const StockBody = z
  .object({
    quantity: z.number().int().min(0).max(1_000_000).nullable(),
    /** The quantity the dashboard last saw; the change is refused if it moved meanwhile (an order, another admin). */
    expected: z.number().int().min(0).nullable(),
  })
  .strict();

const CategoryFields = z.object({
  nameAr: name(200),
  nameEn: name(200),
  /** Urdu is optional; empty means the built-in Urdu name or the Arabic one. */
  nameUr: text(200),
  descriptionAr: text(2000),
  descriptionEn: text(2000),
  descriptionUr: text(2000),
  isVisible: z.boolean(),
  isFeatured: z.boolean(),
  /** One of the storefront's icon names (see catalog-icons.tsx); the storefront falls back to the grid icon for an unknown one. */
  icon: z.string().trim().regex(/^[a-z0-9-]{1,40}$/),
});
const NewCategory = CategoryFields.partial({ nameUr: true, descriptionAr: true, descriptionEn: true, descriptionUr: true, isVisible: true, isFeatured: true, icon: true })
  .extend({ parentId: catalogueId.nullable().optional() })
  .strict();
const CategoryPatch = CategoryFields.partial()
  .strict()
  .refine((body) => Object.keys(body).length > 0, "Nothing to change");
/** The new order of sibling categories (same parent): the first id gets sort 1, and so on. */
const CategoryOrder = z.object({ ids: z.array(catalogueId).min(1).max(200) }).strict();
const InventoryBody = z.object({ lowStock: z.number().int().min(0).max(100_000) }).strict();

export class ApiProblem extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(code);
  }
}

export function invalid(res: Response, error: z.ZodError) {
  res.status(400).json({ error: "INVALID_INPUT", issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) });
}

/** Runs a handler and turns known problems into JSON errors; anything else goes to the app's 500 handler. */
export function handle(run: (req: Request, res: Response) => Promise<void>) {
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

export async function findProduct(id: string) {
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
export async function usableCategory(id: string) {
  const category = await findCategory(id);
  if (category.archivedAt) throw new ApiProblem(409, "CATEGORY_ARCHIVED");
  return category;
}

/** A shop products can be linked to: it must exist. Null unlinks the product. */
async function shopRef(id: string | null | undefined) {
  if (id === undefined || id === null) return id;
  const shop = await prisma.shop.findUnique({ where: { id }, select: { id: true } });
  if (!shop) throw new ApiProblem(404, "SHOP_NOT_FOUND");
  return shop.id;
}

async function levelOf(categoryId: string) {
  const all = await prisma.category.findMany({ select: { id: true, parentId: true } });
  return categoryLevels(all).get(categoryId) ?? 1;
}

async function sendCategory(res: Response, id: string, status = 200) {
  const category = await prisma.category.findUniqueOrThrow({ where: { id }, include: categoryInclude });
  res.status(status).json({ category: adminCategory(category, await levelOf(id)) });
}

export async function lowStockSetting() {
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
  requirePermission("catalogue.view"),
  handle(async (req, res) => {
    const [categories, products, lowStock, shops] = await Promise.all([
      prisma.category.findMany({ include: categoryInclude, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
      prisma.product.findMany({ include: productInclude, orderBy: productOrder }),
      lowStockSetting(),
      prisma.shop.findMany({ orderBy: shopOrder, include: { _count: { select: { products: true } } } }),
    ]);
    const levels = categoryLevels(categories);
    res.setHeader("Cache-Control", "no-store");
    res.json({
      categories: categories.map((category) => adminCategory(category, levels.get(category.id) ?? 1)),
      products: products.map(adminProduct),
      shops: shops.map((shop) => adminShop(shop, shop._count.products)),
      settings: { lowStock },
      canEdit: req.admin!.permissions.includes("catalogue.edit"),
    });
  }),
);

// ---------------------------------------------------------------------------
// Shops: list, add and rename. No delete in this phase.
// ---------------------------------------------------------------------------

adminCatalogueRouter.get(
  "/shops",
  requirePermission("catalogue.view"),
  handle(async (_req, res) => {
    const shops = await prisma.shop.findMany({ orderBy: shopOrder, include: { _count: { select: { products: true } } } });
    res.setHeader("Cache-Control", "no-store");
    res.json({ shops: shops.map((shop) => adminShop(shop, shop._count.products)) });
  }),
);

adminCatalogueRouter.post(
  "/shops",
  requirePermission("catalogue.edit"),
  handle(async (req, res) => {
    const body = ShopBody.safeParse(req.body);
    if (!body.success) return invalid(res, body.error);
    const { payment, ...shopFields } = body.data;
    const shop = await prisma.shop.create({ data: { ...shopFields, ...paymentColumns(payment) } });
    res.status(201).json({ shop: adminShop(shop, 0) });
  }),
);

adminCatalogueRouter.patch(
  "/shops/:id",
  requirePermission("catalogue.edit"),
  handle(async (req, res) => {
    const body = ShopPatch.safeParse(req.body);
    if (!body.success) return invalid(res, body.error);
    const id = z.string().uuid().safeParse(req.params.id);
    if (!id.success || !(await prisma.shop.findUnique({ where: { id: id.data }, select: { id: true } }))) throw new ApiProblem(404, "SHOP_NOT_FOUND");
    const { payment, ...shopFields } = body.data;
    const shop = await prisma.shop.update({ where: { id: id.data }, data: { ...shopFields, ...paymentColumns(payment) }, include: { _count: { select: { products: true } } } });
    res.json({ shop: adminShop(shop, shop._count.products) });
  }),
);

const ShopState = z.object({ isActive: z.boolean().optional(), archived: z.boolean().optional() }).strict().refine((body) => body.isActive !== undefined || body.archived !== undefined, "Nothing to change");

/** Suspend / reactivate a shop, or move it to the archive / restore it. Its products follow: hidden from the store while it is suspended or archived. */
adminCatalogueRouter.patch(
  "/shops/:id/state",
  requirePermission("catalogue.edit"),
  handle(async (req, res) => {
    const body = ShopState.safeParse(req.body);
    if (!body.success) return invalid(res, body.error);
    const id = z.string().uuid().safeParse(req.params.id);
    if (!id.success || !(await prisma.shop.findUnique({ where: { id: id.data }, select: { id: true } }))) throw new ApiProblem(404, "SHOP_NOT_FOUND");
    const data = { ...(body.data.isActive === undefined ? {} : { isActive: body.data.isActive }), ...(body.data.archived === undefined ? {} : { archivedAt: body.data.archived ? new Date() : null }) };
    const shop = await prisma.$transaction(async (tx) => {
      const updated = await tx.shop.update({ where: { id: id.data }, data, include: { _count: { select: { products: true } } } });
      // A suspended or archived shop cannot stay signed in.
      if (!updated.isActive || updated.archivedAt) await tx.adminSession.updateMany({ where: { adminUser: { shopId: updated.id }, revokedAt: null }, data: { revokedAt: new Date() } });
      return updated;
    });
    res.json({ shop: adminShop(shop, shop._count.products) });
  }),
);

const ShopReview = z.discriminatedUnion("decision", [z.object({ decision: z.literal("approve") }).strict(), z.object({ decision: z.literal("reject"), reason: z.string().trim().min(1).max(500) }).strict()]);

/** The admin answers a seller's request to join: approve (the shop and its login go live) or refuse with a reason. */
adminCatalogueRouter.post(
  "/shops/:id/review",
  requirePermission("catalogue.edit"),
  handle(async (req, res) => {
    const body = ShopReview.safeParse(req.body);
    if (!body.success) return invalid(res, body.error);
    const id = z.string().uuid().safeParse(req.params.id);
    if (!id.success || !(await prisma.shop.findUnique({ where: { id: id.data }, select: { id: true } }))) throw new ApiProblem(404, "SHOP_NOT_FOUND");
    const data = body.data.decision === "approve" ? { approvalStatus: null, rejectReason: null } : { approvalStatus: "REJECTED" as const, rejectReason: body.data.reason };
    const shop = await prisma.shop.update({ where: { id: id.data }, data, include: { _count: { select: { products: true } } } });
    res.json({ shop: adminShop(shop, shop._count.products) });
  }),
);

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

adminCatalogueRouter.post(
  "/products",
  requirePermission("catalogue.edit"),
  handle(async (req, res) => {
    const body = NewProduct.safeParse(req.body);
    if (!body.success) return invalid(res, body.error);
    const { image: upload, categoryId, shopId, ...fields } = body.data;
    // A wholesale price is a positive number below the selling price; empty means none (null), never zero.
    if (fields.wholesalePrice && fields.wholesalePrice.gte(fields.price)) throw new ApiProblem(400, "INVALID_WHOLESALE_PRICE");
    const category = await usableCategory(categoryId);
    const shopUuid = await shopRef(shopId);
    if (upload) decodeImage(upload); // refuse a bad image before anything is written
    const legacyId = `p-${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
    // A new product goes first: one place before the current first product (lists are ordered by sort_order).
    const first = await prisma.product.aggregate({ _min: { sortOrder: true } });
    const url = upload ? await saveProductImage(upload, legacyId) : null;
    const product = await prisma.product.create({
      data: {
        ...jsonFields(fields),
        legacyId,
        slug: legacyId,
        categoryId: category.id,
        shopId: shopUuid,
        sortOrder: (first._min.sortOrder ?? 1) - 1,
        images: url ? { create: { url, altAr: fields.nameAr, altEn: fields.nameEn || fields.nameAr } } : undefined,
      },
      include: productInclude,
    });
    res.status(201).json({ product: adminProduct(product) });
  }),
);

adminCatalogueRouter.patch(
  "/products/:id",
  requirePermission("catalogue.edit"),
  handle(async (req, res) => {
    const body = ProductPatch.safeParse(req.body);
    if (!body.success) return invalid(res, body.error);
    const product = await findProduct(String(req.params.id));
    const { image: upload, categoryId, shopId, ...fields } = body.data;
    // Checked against the selling price this change will leave in place. Lowering the price later never blocks the save;
    // an order simply ignores a wholesale price that is no longer below the price.
    if (fields.wholesalePrice && fields.wholesalePrice.gte(fields.price ?? product.price)) throw new ApiProblem(400, "INVALID_WHOLESALE_PRICE");
    const shopUuid = await shopRef(shopId);
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
        shopId: shopUuid,
        images: url ? { create: { url, sortOrder: first - 1, altAr: fields.nameAr ?? product.nameAr, altEn: fields.nameEn || product.nameEn || fields.nameAr || product.nameAr } } : undefined,
      },
      include: productInclude,
    });
    res.json({ product: adminProduct(updated) });
  }),
);

/** A product a shop sent: publishing it makes it visible in the store; refusing it keeps it hidden and stores the reason for the shop. */
adminCatalogueRouter.post(
  "/products/:id/approve",
  requirePermission("catalogue.edit"),
  handle(async (req, res) => {
    const product = await findProduct(String(req.params.id));
    if (!product.approvalStatus) throw new ApiProblem(409, "NOT_PENDING");
    const updated = await prisma.product.update({ where: { id: product.id }, data: { approvalStatus: null, rejectReason: null, isVisible: true }, include: productInclude });
    if (updated.shopId) await notifyShop(updated.shopId, { kind: "product_approved", title: "تمت الموافقة على منتجك", body: `${updated.nameAr} صار ظاهر في المتجر.`, link: "products" });
    res.json({ product: adminProduct(updated) });
  }),
);

adminCatalogueRouter.post(
  "/products/:id/reject",
  requirePermission("catalogue.edit"),
  handle(async (req, res) => {
    const body = z.object({ reason: text(500).min(1) }).strict().safeParse(req.body);
    if (!body.success) return invalid(res, body.error);
    const product = await findProduct(String(req.params.id));
    if (!product.approvalStatus) throw new ApiProblem(409, "NOT_PENDING");
    const updated = await prisma.product.update({ where: { id: product.id }, data: { approvalStatus: "REJECTED", rejectReason: body.data.reason, isVisible: false }, include: productInclude });
    if (updated.shopId) await notifyShop(updated.shopId, { kind: "product_rejected", title: "تم رفض منتجك", body: `${updated.nameAr}: ${body.data.reason}`, link: "productRequests" });
    res.json({ product: adminProduct(updated) });
  }),
);

adminCatalogueRouter.post(
  "/products/:id/archive",
  requirePermission("catalogue.edit"),
  handle(async (req, res) => {
    const product = await findProduct(String(req.params.id));
    // Images, stock history and past orders stay linked to the product; it only leaves the storefront.
    const updated = await prisma.product.update({ where: { id: product.id }, data: { archivedAt: product.archivedAt ?? new Date() }, include: productInclude });
    res.json({ product: adminProduct(updated) });
  }),
);

adminCatalogueRouter.post(
  "/products/:id/restore",
  requirePermission("catalogue.edit"),
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
  requirePermission("catalogue.edit"),
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
  requirePermission("catalogue.edit"),
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
    // A new category goes first among its siblings: one place before the current first one.
    const first = await prisma.category.aggregate({ where: { parentId: parent?.id ?? null }, _min: { sortOrder: true } });
    const category = await prisma.category.create({
      data: { ...fields, slug, legacyId: slug, parentId: parent?.id ?? null, isFeatured: !parent && Boolean(isFeatured), sortOrder: (first._min.sortOrder ?? 1) - 1 },
    });
    await sendCategory(res, category.id, 201);
  }),
);

adminCatalogueRouter.put(
  "/categories/order",
  requirePermission("catalogue.edit"),
  handle(async (req, res) => {
    const body = CategoryOrder.safeParse(req.body);
    if (!body.success) return invalid(res, body.error);
    const found = await Promise.all(body.data.ids.map((id) => findCategory(id)));
    // One list only: the same parent, and no category twice.
    if (new Set(found.map((item) => item.parentId ?? "")).size !== 1 || new Set(found.map((item) => item.id)).size !== found.length) throw new ApiProblem(400, "INVALID_ORDER");
    await prisma.$transaction(found.map((item, index) => prisma.category.update({ where: { id: item.id }, data: { sortOrder: index + 1 } })));
    res.json({ ok: true });
  }),
);

adminCatalogueRouter.patch(
  "/categories/:id",
  requirePermission("catalogue.edit"),
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
  requirePermission("catalogue.edit"),
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
  requirePermission("catalogue.edit"),
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
  requirePermission("catalogue.edit"),
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
