import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { optionalCustomer } from "../auth/middleware.js";
import { isCatalogueId } from "../catalogue/ids.js";
import { prisma } from "../db.js";
import { OrderError, placeOrder } from "../orders/place-order.js";

// POST /api/orders: the storefront checkout. The body may only say what to buy, who is buying and where to
// deliver. Prices, totals, stock and fees are rejected if sent (strict objects) and recomputed by placeOrder.

const text = (min: number, max: number) => z.string().trim().min(min).max(max);

const OrderBody = z
  .object({
    customer: z
      .object({
        fullName: text(2, 120),
        phone: z
          .string()
          .transform((value) => value.replace(/[\s-]/g, ""))
          .pipe(z.string().regex(/^05\d{8}$/, "Saudi mobile number starting with 05, 10 digits")),
        email: z.email().max(200).optional(),
      })
      .strict(),
    address: z
      .object({
        zoneCode: z.string().regex(/^[a-z0-9-]{1,40}$/),
        city: text(2, 80),
        line1: text(3, 200),
        notes: text(0, 500).optional(),
      })
      .strict(),
    shippingMethodCode: z.string().regex(/^[a-z0-9-]{1,40}$/),
    paymentMethod: z.enum(["COD", "BANK_TRANSFER"]),
    items: z
      // The storefront's own product ids ("phone", "demo-tv") or database UUIDs; placeOrder maps them.
      .array(z.object({ productId: z.string().refine(isCatalogueId, "Unknown product id"), quantity: z.number().int().min(1).max(99) }).strict())
      .min(1)
      .max(50),
    locale: z.enum(["ar", "en"]).optional(),
    /** Signed-in customers only: also keep this delivery address in the account. */
    saveAddress: z.object({ label: text(0, 60).optional(), makeDefault: z.boolean().optional() }).strict().optional(),
  })
  .strict();

const ORDER_ERROR_STATUS: Record<OrderError["code"], number> = {
  EMPTY_CART: 400,
  INVALID_QUANTITY: 400,
  PRODUCT_UNAVAILABLE: 409,
  OUT_OF_STOCK: 409,
  ZONE_UNAVAILABLE: 422,
  SHIPPING_UNAVAILABLE: 422,
  BELOW_MINIMUM: 422,
  PAYMENT_UNAVAILABLE: 422,
};

export const ordersRouter = Router();

ordersRouter.post(
  "/",
  rateLimit({ windowMs: 10 * 60 * 1000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "TOO_MANY_REQUESTS" } }),
  optionalCustomer(),
  async (req, res) => {
    const body = OrderBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: "INVALID_ORDER", issues: body.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) });
      return;
    }
    const { saveAddress, ...input } = body.data;
    try {
      const order = await placeOrder({ ...input, customerId: req.customer?.id });
      if (req.customer && saveAddress) await keepAddress(req.customer.id, input.address, saveAddress);
      // The order number is for the store's staff (dashboard); the customer follows orders from the account.
      res.status(201).json({
        order: {
          id: order.id,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          currency: order.currency,
          subtotal: order.subtotal.toFixed(2),
          shippingFee: order.shippingFee.toFixed(2),
          paymentFee: order.paymentFee.toFixed(2),
          total: order.total.toFixed(2),
          placedAt: order.placedAt,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          city: order.city,
          addressLine: order.addressLine,
          zoneName: order.zoneName,
          shippingMethodName: order.shippingMethodName,
          linkedToAccount: order.customerId !== null,
          items: order.items.map((item) => ({
            productId: item.productId,
            id: item.product?.legacyId ?? item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toFixed(2),
            lineTotal: item.lineTotal.toFixed(2),
          })),
        },
      });
    } catch (error) {
      if (error instanceof OrderError) {
        res.status(ORDER_ERROR_STATUS[error.code]).json({ error: error.code, message: error.message });
        return;
      }
      throw error;
    }
  },
);

/** Saves the order's delivery address in the account unless the same one is already there. Best effort: the
 * order is already placed, so a problem here is logged rather than reported as a failed order. */
async function keepAddress(
  customerId: string,
  address: { zoneCode: string; city: string; line1: string; notes?: string },
  options: { label?: string; makeDefault?: boolean },
) {
  try {
    const zone = await prisma.shippingZone.findUnique({ where: { code: address.zoneCode } });
    if (!zone) return;
    await prisma.$transaction(async (tx) => {
      const existing = await tx.address.findMany({ where: { customerId } });
      const same = existing.find((row) => row.zoneId === zone.id && row.city === address.city.trim() && row.line1 === address.line1.trim());
      const isDefault = existing.length === 0 || options.makeDefault === true;
      if (isDefault) await tx.address.updateMany({ where: { customerId, isDefault: true }, data: { isDefault: false } });
      if (same) {
        if (isDefault) await tx.address.update({ where: { id: same.id }, data: { isDefault: true } });
        return;
      }
      if (existing.length >= 20) return;
      await tx.address.create({
        data: { customerId, zoneId: zone.id, label: options.label ?? "", city: address.city.trim(), line1: address.line1.trim(), notes: address.notes?.trim() || null, isDefault },
      });
    });
  } catch (error) {
    console.error("Saving the order address to the account failed:", error instanceof Error ? error.message : error);
  }
}
