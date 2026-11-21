import { randomBytes } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { requireShop } from "../auth/middleware.js";
import { decodeImage, saveProductImage } from "../catalogue/images.js";
import { adminCategory, adminProduct, adminShop, categoryInclude, categoryLevels, productInclude, productOrder } from "../catalogue/serialize.js";
import { prisma } from "../db.js";
import { notificationRoutes, notifyStaff } from "../notifications.js";
import { dashboardSettings } from "./checkout-settings.js";
import { ApiProblem, NewProduct, ProductPatch, ShopFields, StockBody, findProduct, handle, invalid, jsonFields, lowStockSetting, paymentColumns, usableCategory } from "./admin-catalogue.js";

// /api/shop: what a shop's own account (role SHOP) can do. Every route works on req.shopId, the shop the account
// belongs to, and nothing else: another shop's products, orders and details are never read or written here.
//   - the shop's catalogue, with the products it sent and their approval state
//   - adding a product (it waits for the admin's approval and stays hidden from the store until then)
//   - editing its own products, their stock, and its own contact and payment details
//   - the orders that contain its products, with only its own lines (read only)

export const shopRouter = Router();
shopRouter.use(requireShop());
shopRouter.use("/notifications", notificationRoutes((req) => req.shopId!));

/** Fields only the admin may set on a product. A shop sending one is refused rather than silently ignored. */
const ADMIN_ONLY = ["shopId", "showInHomeOffers"] as const;
function refuseAdminOnly(body: unknown) {
  if (body && typeof body === "object" && ADMIN_ONLY.some((key) => key in body)) throw new ApiProblem(403, "ADMIN_ONLY_FIELD");
}

/** The shop's own product, or 404: a product of another shop is indistinguishable from one that does not exist. */
async function ownProduct(id: string, shopId: string) {
  const product = await findProduct(id);
  if (product.shopId !== shopId) throw new ApiProblem(404, "PRODUCT_NOT_FOUND");
  return product;
}

shopRouter.get(
  "/catalogue",
  handle(async (req, res) => {
    const shopId = req.shopId!;
    const [categories, products, lowStock, shop] = await Promise.all([
      prisma.category.findMany({ include: categoryInclude, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
      prisma.product.findMany({ where: { shopId }, include: productInclude, orderBy: productOrder }),
      lowStockSetting(),
      prisma.shop.findUniqueOrThrow({ where: { id: shopId } }),
    ]);
    const levels = categoryLevels(categories);
    res.setHeader("Cache-Control", "no-store");
    res.json({
      categories: categories.map((category) => adminCategory(category, levels.get(category.id) ?? 1)),
      products: products.map(adminProduct),
      shops: [adminShop(shop, products.length)],
      settings: { lowStock },
      canEdit: true,
    });
  }),
);

// The shop's own details, including how it gets paid.
shopRouter.patch(
  "/shop",
  handle(async (req, res) => {
    const body = ShopFields.partial().strict().safeParse(req.body);
    if (!body.success) return invalid(res, body.error);
    if (Object.keys(body.data).length === 0) {
      res.status(400).json({ error: "INVALID_INPUT" });
      return;
    }
    const { payment, ...fields } = body.data;
    const shop = await prisma.shop.update({ where: { id: req.shopId! }, data: { ...fields, ...paymentColumns(payment) }, include: { _count: { select: { products: true } } } });
    res.json({ shop: adminShop(shop, shop._count.products) });
  }),
);

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

shopRouter.post(
  "/products",
  handle(async (req, res) => {
    refuseAdminOnly(req.body);
    const body = NewProduct.safeParse(req.body);
    if (!body.success) return invalid(res, body.error);
    const { image: upload, categoryId, shopId: _shopId, showInHomeOffers: _home, isVisible: _visible, ...fields } = body.data;
    if (fields.wholesalePrice && fields.wholesalePrice.gte(fields.price)) throw new ApiProblem(400, "INVALID_WHOLESALE_PRICE");
    const category = await usableCategory(categoryId);
    if (upload) decodeImage(upload);
    const legacyId = `p-${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
    const first = await prisma.product.aggregate({ _min: { sortOrder: true } });
    const url = upload ? await saveProductImage(upload, legacyId) : null;
    const product = await prisma.product.create({
      data: {
        ...jsonFields(fields),
        legacyId,
        slug: legacyId,
        categoryId: category.id,
        // The shop is the account's own, never the one in the request. The product waits for the admin and stays hidden until then.
        shopId: req.shopId!,
        isVisible: false,
        showInHomeOffers: false,
        approvalStatus: "PENDING",
        submittedAt: new Date(),
        sortOrder: (first._min.sortOrder ?? 1) - 1,
        images: url ? { create: { url, altAr: fields.nameAr, altEn: fields.nameEn || fields.nameAr } } : undefined,
      },
      include: productInclude,
    });
    const shopRow = await prisma.shop.findUnique({ where: { id: req.shopId! }, select: { name: true } });
    await notifyStaff({ kind: "product_submitted", title: "منتج جديد بانتظار الموافقة", body: `${shopRow?.name ?? "محل"}: ${product.nameAr}`, link: `productRequests/${product.legacyId ?? product.id}` });
    res.status(201).json({ product: adminProduct(product) });
  }),
);

shopRouter.patch(
  "/products/:id",
  handle(async (req, res) => {
    refuseAdminOnly(req.body);
    const body = ProductPatch.safeParse(req.body);
    if (!body.success) return invalid(res, body.error);
    const product = await ownProduct(String(req.params.id), req.shopId!);
    const { image: upload, categoryId, shopId: _shopId, showInHomeOffers: _home, ...fields } = body.data;
    if (fields.wholesalePrice && fields.wholesalePrice.gte(fields.price ?? product.price)) throw new ApiProblem(400, "INVALID_WHOLESALE_PRICE");
    let categoryUuid: string | null | undefined;
    if (categoryId !== undefined) categoryUuid = categoryId === null ? null : (await usableCategory(categoryId)).id;
    if (upload) decodeImage(upload);
    const url = upload ? await saveProductImage(upload, product.legacyId ?? product.id) : null;
    const first = product.images[0]?.sortOrder ?? 0;
    // A product the admin has not published stays hidden; editing a refused one sends it back for review.
    const unpublished = product.approvalStatus !== null;
    const resubmit = product.approvalStatus === "REJECTED";
    const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        ...jsonFields(fields),
        isVisible: unpublished ? false : fields.isVisible,
        categoryId: categoryUuid,
        ...(resubmit ? { approvalStatus: "PENDING" as const, rejectReason: null, submittedAt: new Date() } : {}),
        images: url ? { create: { url, sortOrder: first - 1, altAr: fields.nameAr ?? product.nameAr, altEn: fields.nameEn || product.nameEn || fields.nameAr || product.nameAr } } : undefined,
      },
      include: productInclude,
    });
    if (resubmit) {
      const shopRow = await prisma.shop.findUnique({ where: { id: req.shopId! }, select: { name: true } });
      await notifyStaff({ kind: "product_submitted", title: "منتج معدّل بانتظار الموافقة", body: `${shopRow?.name ?? "محل"}: ${updated.nameAr}`, link: `productRequests/${updated.legacyId ?? updated.id}` });
    }
    res.json({ product: adminProduct(updated) });
  }),
);

shopRouter.post(
  "/products/:id/archive",
  handle(async (req, res) => {
    const product = await ownProduct(String(req.params.id), req.shopId!);
    const updated = await prisma.product.update({ where: { id: product.id }, data: { archivedAt: product.archivedAt ?? new Date() }, include: productInclude });
    res.json({ product: adminProduct(updated) });
  }),
);

shopRouter.post(
  "/products/:id/restore",
  handle(async (req, res) => {
    const product = await ownProduct(String(req.params.id), req.shopId!);
    if (product.categoryId) {
      const category = await prisma.category.findUniqueOrThrow({ where: { id: product.categoryId } });
      if (category.archivedAt) throw new ApiProblem(409, "CATEGORY_ARCHIVED");
    }
    const updated = await prisma.product.update({ where: { id: product.id }, data: { archivedAt: null }, include: productInclude });
    res.json({ product: adminProduct(updated) });
  }),
);

shopRouter.put(
  "/products/:id/stock",
  handle(async (req, res) => {
    const body = StockBody.safeParse(req.body);
    if (!body.success) return invalid(res, body.error);
    const product = await ownProduct(String(req.params.id), req.shopId!);
    const { quantity, expected } = body.data;
    const adminUserId = req.admin!.id;
    await prisma.$transaction(async (tx) => {
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
// Orders and settings (read only)
// ---------------------------------------------------------------------------

const OrdersQuery = z.object({ limit: z.coerce.number().int().min(1).max(100).default(50) });

/**
 * The orders that contain this shop's products. Each order shows only the shop's own lines, and its amounts are
 * those lines' totals: another shop's lines, the shipping and the customer's email are not part of what a shop sees.
 */
shopRouter.get(
  "/orders",
  handle(async (req, res) => {
    const query = OrdersQuery.safeParse(req.query);
    if (!query.success) return invalid(res, query.error);
    const shopId = req.shopId!;
    const orders = await prisma.order.findMany({
      where: { items: { some: { product: { shopId } } } },
      orderBy: { placedAt: "desc" },
      take: query.data.limit,
      include: {
        items: { where: { product: { shopId } }, select: { productName: true, quantity: true, unitPrice: true, lineTotal: true, product: { select: { legacyId: true } } } },
        shippingMethod: { select: { code: true } },
      },
    });
    res.setHeader("Cache-Control", "no-store");
    res.json({
      orders: orders.map((order) => {
        const own = order.items.reduce((sum, item) => sum + Number(item.lineTotal), 0);
        return { ...order, customerEmail: null, subtotal: own.toFixed(2), shippingFee: "0.00", paymentFee: "0.00", discountTotal: "0.00", taxTotal: "0.00", total: own.toFixed(2) };
      }),
    });
  }),
);

shopRouter.get(
  "/checkout-settings",
  handle(async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(await dashboardSettings());
  }),
);
