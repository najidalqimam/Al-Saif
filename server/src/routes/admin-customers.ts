import { Prisma } from "@prisma/client";
import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { requireAdmin } from "../auth/middleware.js";
import { prisma } from "../db.js";
import { deliver, requeueWelcome } from "../mail/outbox.js";

// /api/admin/customers: registered store accounts for the staff who handle orders. Read-only apart from
// re-queuing the welcome email; passwords and session tokens are never part of an answer.

const CUSTOMER_ROLES = ["OWNER", "MANAGER", "SUPPORT"] as const;

const ListQuery = z.object({
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

type Handler = (req: Request, res: Response) => Promise<void>;
const handle = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

const summarySelect = {
  id: true,
  firstName: true,
  lastName: true,
  phone: true,
  email: true,
  avatar: true,
  createdAt: true,
  lastLoginAt: true,
  emails: { where: { kind: "WELCOME" }, select: { status: true, sentAt: true, lastError: true, attempts: true } },
  _count: { select: { orders: true, addresses: true } },
} satisfies Prisma.CustomerSelect;

type Summary = Prisma.CustomerGetPayload<{ select: typeof summarySelect }>;

async function totals(ids: string[]) {
  // Money spent: orders that were not cancelled.
  const rows = await prisma.order.groupBy({
    by: ["customerId"],
    where: { customerId: { in: ids }, status: { not: "CANCELLED" } },
    _sum: { total: true },
    _max: { placedAt: true },
  });
  return new Map(rows.map((row) => [row.customerId, { spent: row._sum.total, lastOrderAt: row._max.placedAt }]));
}

function summary(customer: Summary, money: Map<string | null, { spent: Prisma.Decimal | null; lastOrderAt: Date | null }>) {
  const welcome = customer.emails[0];
  const spent = money.get(customer.id);
  return {
    id: customer.id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
    email: customer.email,
    avatar: customer.avatar,
    createdAt: customer.createdAt,
    lastLoginAt: customer.lastLoginAt,
    orders: customer._count.orders,
    addresses: customer._count.addresses,
    spent: (spent?.spent ?? new Prisma.Decimal(0)).toFixed(2),
    lastOrderAt: spent?.lastOrderAt ?? null,
    welcomeEmail: welcome ? { status: welcome.status, sentAt: welcome.sentAt, attempts: welcome.attempts, lastError: welcome.lastError } : null,
  };
}

export const adminCustomersRouter = Router();
adminCustomersRouter.use(requireAdmin([...CUSTOMER_ROLES]));

adminCustomersRouter.get(
  "/",
  handle(async (req, res) => {
    const query = ListQuery.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: "INVALID_QUERY" });
      return;
    }
    const needle = query.data.q;
    const where: Prisma.CustomerWhereInput | undefined = needle
      ? {
          OR: [
            { firstName: { contains: needle } },
            { lastName: { contains: needle } },
            { fullName: { contains: needle } },
            { email: { contains: needle.toLowerCase() } },
            { phone: { contains: needle.replace(/[\s-]/g, "") } },
          ],
        }
      : undefined;
    const [customers, total, guestOrders] = await Promise.all([
      prisma.customer.findMany({ where, orderBy: { createdAt: "desc" }, take: query.data.limit, select: summarySelect }),
      prisma.customer.count(),
      prisma.order.count({ where: { customerId: null } }),
    ]);
    const money = await totals(customers.map((customer) => customer.id));
    res.setHeader("Cache-Control", "no-store");
    res.json({ customers: customers.map((customer) => summary(customer, money)), total, guestOrders });
  }),
);

adminCustomersRouter.get(
  "/:id",
  handle(async (req, res) => {
    const id = String(req.params.id);
    const customer = await prisma.customer.findUnique({ where: { id }, select: summarySelect });
    if (!customer) {
      res.status(404).json({ error: "CUSTOMER_NOT_FOUND" });
      return;
    }
    const [addresses, orders, money] = await Promise.all([
      prisma.address.findMany({ where: { customerId: id }, include: { zone: { select: { nameAr: true } } }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] }),
      prisma.order.findMany({
        where: { customerId: id },
        orderBy: { placedAt: "desc" },
        take: 50,
        select: { number: true, status: true, paymentStatus: true, paymentMethod: true, total: true, placedAt: true, _count: { select: { items: true } } },
      }),
      totals([id]),
    ]);
    res.setHeader("Cache-Control", "no-store");
    res.json({
      customer: summary(customer, money),
      addresses: addresses.map((row) => ({ id: row.id, label: row.label, zoneName: row.zone?.nameAr ?? null, city: row.city, line1: row.line1, notes: row.notes ?? "", isDefault: row.isDefault })),
      orders: orders.map((order) => ({
        number: order.number,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        total: order.total.toFixed(2),
        placedAt: order.placedAt,
        lines: order._count.items,
      })),
    });
  }),
);

adminCustomersRouter.post(
  "/:id/welcome-email",
  handle(async (req, res) => {
    const id = String(req.params.id);
    if (!(await requeueWelcome(id))) {
      res.status(409).json({ error: "ALREADY_SENT" });
      return;
    }
    const row = await prisma.emailOutbox.findFirstOrThrow({ where: { customerId: id, kind: "WELCOME" } });
    const outcome = await deliver(row.id);
    res.json({ outcome });
  }),
);
