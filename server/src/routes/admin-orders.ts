import { Router } from "express";
import { z } from "zod";
import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { requireAdmin } from "../auth/middleware.js";
import { prisma, withTransactionRetry } from "../db.js";

// /api/admin/orders: order list and status changes for staff who handle orders.

const ORDER_ROLES = ["OWNER", "MANAGER", "SUPPORT"] as const;

const ListQuery = z.object({
  status: z.enum(OrderStatus).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const StatusBody = z
  .object({
    status: z.enum(OrderStatus).optional(),
    paymentStatus: z.enum(PaymentStatus).optional(),
    note: z.string().trim().max(500).optional(),
  })
  .strict()
  .refine((body) => body.status || body.paymentStatus, "Send status, paymentStatus or both");

export const adminOrdersRouter = Router();
adminOrdersRouter.use(requireAdmin([...ORDER_ROLES]));

adminOrdersRouter.get("/", async (req, res) => {
  const query = ListQuery.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "INVALID_QUERY" });
    return;
  }
  const orders = await prisma.order.findMany({
    where: query.data.status ? { status: query.data.status } : undefined,
    orderBy: { placedAt: "desc" },
    take: query.data.limit,
    include: {
      items: { select: { productName: true, quantity: true, unitPrice: true, lineTotal: true, product: { select: { legacyId: true } } } },
      shippingMethod: { select: { code: true } },
    },
  });
  res.setHeader("Cache-Control", "no-store");
  res.json({ orders });
});

adminOrdersRouter.patch("/:number/status", async (req, res) => {
  const number = Number(req.params.number);
  const body = StatusBody.safeParse(req.body);
  if (!Number.isInteger(number) || number < 1 || !body.success) {
    res.status(400).json({ error: "INVALID_STATUS_CHANGE" });
    return;
  }
  const adminId = req.admin!.id;

  const result = await withTransactionRetry(() =>
    prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({ where: { number } });
        if (!order) return { ok: false as const, status: 404, code: "ORDER_NOT_FOUND" };
        // A cancelled order has had its stock put back; reopening it would need that stock taken again.
        if (order.status === "CANCELLED" && body.data.status && body.data.status !== "CANCELLED") return { ok: false as const, status: 409, code: "ORDER_CANCELLED" };

        const { status, paymentStatus, note } = body.data;
        // Claim the change first: the update only matches if nobody changed the order since it was read. It
        // also locks the row, so a second admin cancelling at the same moment waits, then matches nothing and
        // can never put the stock back twice.
        const claimed = await tx.order.updateMany({
          where: { id: order.id, status: order.status, paymentStatus: order.paymentStatus },
          data: { status: status ?? undefined, paymentStatus: paymentStatus ?? undefined },
        });
        if (claimed.count === 0) return { ok: false as const, status: 409, code: "ORDER_CHANGED" };

        if (status && status !== order.status) {
          await tx.orderStatusHistory.create({ data: { orderId: order.id, fromStatus: order.status, toStatus: status, note, changedById: adminId } });
          if (status === "CANCELLED") {
            // Return exactly what this order took from tracked stock, locking products in a fixed order.
            const taken = await tx.stockMovement.groupBy({
              by: ["productId"],
              where: { orderId: order.id, reason: "ORDER_PLACED" },
              _sum: { delta: true },
              orderBy: { productId: "asc" },
            });
            for (const row of taken) {
              const quantity = -(row._sum.delta ?? 0);
              if (quantity <= 0) continue;
              await tx.product.update({ where: { id: row.productId }, data: { stockQuantity: { increment: quantity } } });
              await tx.stockMovement.create({ data: { productId: row.productId, delta: quantity, reason: "ORDER_CANCELLED", orderId: order.id, adminUserId: adminId } });
            }
          }
        }
        if (paymentStatus && paymentStatus !== order.paymentStatus) {
          await tx.paymentStatusHistory.create({ data: { orderId: order.id, fromStatus: order.paymentStatus, toStatus: paymentStatus, note, changedById: adminId } });
        }
        const updated = await tx.order.findUniqueOrThrow({ where: { id: order.id } });
        return { ok: true as const, order: updated };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    ),
  );

  if (!result.ok) {
    res.status(result.status).json({ error: result.code });
    return;
  }
  res.json({ order: { number: result.order.number, status: result.order.status, paymentStatus: result.order.paymentStatus } });
});
