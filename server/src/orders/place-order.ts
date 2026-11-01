import { Prisma, type PaymentMethodCode } from "@prisma/client";
import { prisma, withTransactionRetry } from "../db.js";

// Server-side order placement. Prices, fees and totals are always recomputed from the database; the
// browser only sends what it wants to buy and where. Everything runs in one transaction, so an order is
// either saved completely (order, items, history, stock) or not at all. Called by POST /api/orders.

export type PlaceOrderInput = {
  /** The signed-in account placing the order; absent for guest checkout. */
  customerId?: string;
  customer: { fullName: string; phone: string; email?: string };
  address: { zoneCode: string; city: string; line1: string; notes?: string };
  shippingMethodCode: string;
  paymentMethod: Exclude<PaymentMethodCode, "ONLINE">;
  items: Array<{ productId: string; quantity: number }>;
  locale?: "ar" | "en";
};

export class OrderError extends Error {
  constructor(
    readonly code:
      | "EMPTY_CART"
      | "INVALID_QUANTITY"
      | "PRODUCT_UNAVAILABLE"
      | "OUT_OF_STOCK"
      | "ZONE_UNAVAILABLE"
      | "SHIPPING_UNAVAILABLE"
      | "BELOW_MINIMUM"
      | "PAYMENT_UNAVAILABLE",
    message: string,
  ) {
    super(message);
  }
}

const D = Prisma.Decimal;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function placeOrder(input: PlaceOrderInput) {
  if (!input.items.length) throw new OrderError("EMPTY_CART", "The cart is empty.");

  for (const item of input.items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
      throw new OrderError("INVALID_QUANTITY", "Quantities must be whole numbers between 1 and 99.");
    }
  }

  // The storefront sends its own product ids ("phone", "demo-tv"); database UUIDs work too. Map each one to the
  // product row, then merge repeated lines for the same product.
  const keys = [...new Set(input.items.map((item) => item.productId))];
  const found = await prisma.product.findMany({
    where: { OR: [{ id: { in: keys.filter((key) => UUID.test(key)).map((key) => key.toLowerCase()) } }, { legacyId: { in: keys } }] },
    select: { id: true, legacyId: true },
  });
  const quantities = new Map<string, number>();
  for (const item of input.items) {
    const key = item.productId.toLowerCase();
    const product = found.find((row) => row.id === key || row.legacyId?.toLowerCase() === key);
    if (!product) throw new OrderError("PRODUCT_UNAVAILABLE", "A product in the cart is no longer available.");
    quantities.set(product.id, (quantities.get(product.id) ?? 0) + item.quantity);
  }

  // A deadlock aborts the whole transaction, so it is simply run again.
  return withTransactionRetry(() => placeOrderOnce(input, quantities));
}

function placeOrderOnce(input: PlaceOrderInput, quantities: Map<string, number>) {
  return prisma.$transaction(
    async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: [...quantities.keys()] }, isVisible: true, archivedAt: null },
        // Stock rows are locked in this order below. A fixed order means two carts with the same products
        // wait for each other instead of deadlocking.
        orderBy: { id: "asc" },
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      });
      if (products.length !== quantities.size) throw new OrderError("PRODUCT_UNAVAILABLE", "A product in the cart is no longer available.");

      const zone = await tx.shippingZone.findFirst({ where: { code: input.address.zoneCode, isActive: true } });
      if (!zone) throw new OrderError("ZONE_UNAVAILABLE", "We do not deliver to this region.");

      const method = await tx.shippingMethod.findFirst({
        where: { code: input.shippingMethodCode, isActive: true, zones: { some: { zoneId: zone.id } } },
      });
      if (!method) throw new OrderError("SHIPPING_UNAVAILABLE", "This shipping method is not available for the region.");

      const payment = await tx.paymentMethod.findFirst({ where: { code: input.paymentMethod, isActive: true } });
      if (!payment) throw new OrderError("PAYMENT_UNAVAILABLE", "This payment method is not available.");

      const lines = products.map((product) => {
        const quantity = quantities.get(product.id)!;
        return { product, quantity, lineTotal: product.price.mul(quantity) };
      });
      const subtotal = lines.reduce((sum, line) => sum.add(line.lineTotal), new D(0));

      if (method.minOrderAmount && subtotal.lt(method.minOrderAmount)) {
        throw new OrderError("BELOW_MINIMUM", "The order is below the minimum for this shipping method.");
      }
      const shippingFee = method.freeOverAmount && subtotal.gte(method.freeOverAmount) ? new D(0) : method.fee;
      const paymentFee = payment.extraFee;
      const total = subtotal.add(shippingFee).add(paymentFee);

      // Take tracked stock with a conditional update, so two orders can never sell the same last unit.
      for (const line of lines) {
        if (line.product.stockQuantity === null || line.product.allowBackorder) continue;
        const taken = await tx.product.updateMany({
          where: { id: line.product.id, stockQuantity: { gte: line.quantity } },
          data: { stockQuantity: { decrement: line.quantity } },
        });
        if (taken.count === 0) throw new OrderError("OUT_OF_STOCK", `Not enough stock for ${line.product.nameEn}.`);
      }

      // The contact details are copied onto the order. A guest order has no customer link, so creating an
      // account later with the same phone number never exposes it.
      const phone = input.customer.phone.replace(/\D/g, "");
      const locale = input.locale ?? "ar";
      const order = await tx.order.create({
        data: {
          customerId: input.customerId ?? null,
          paymentMethod: payment.code,
          customerName: input.customer.fullName.trim(),
          customerPhone: phone,
          customerEmail: input.customer.email?.trim().toLowerCase() || null,
          zoneCode: zone.code,
          zoneName: locale === "en" && zone.nameEn ? zone.nameEn : zone.nameAr,
          city: input.address.city.trim(),
          addressLine: input.address.line1.trim(),
          notes: input.address.notes?.trim() || null,
          shippingMethodId: method.id,
          shippingMethodName: locale === "en" ? method.nameEn : method.nameAr,
          subtotal,
          shippingFee,
          paymentFee,
          total,
          locale,
          items: {
            create: lines.map((line) => ({
              productId: line.product.id,
              productName: locale === "en" ? line.product.nameEn : line.product.nameAr,
              productSku: line.product.sku,
              imageUrl: line.product.images[0]?.url ?? null,
              unitPrice: line.product.price,
              quantity: line.quantity,
              lineTotal: line.lineTotal,
            })),
          },
          statusHistory: { create: { toStatus: "NEW", note: "Order placed" } },
          paymentHistory: { create: { toStatus: "PENDING" } },
        },
        include: { items: { include: { product: { select: { legacyId: true } } } } },
      });

      const tracked = lines.filter((line) => line.product.stockQuantity !== null && !line.product.allowBackorder);
      if (tracked.length) {
        await tx.stockMovement.createMany({
          data: tracked.map((line) => ({ productId: line.product.id, delta: -line.quantity, reason: "ORDER_PLACED" as const, orderId: order.id })),
        });
      }

      return order;
    },
    // READ COMMITTED (PostgreSQL's default; MySQL defaults to REPEATABLE READ) is enough: each stock
    // decrement is a single conditional UPDATE that locks the row and re-checks the latest committed
    // quantity, and any failure rolls the whole order back. It also avoids MySQL's gap locks.
    { timeout: 15_000, isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
  );
}
