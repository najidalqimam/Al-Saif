import { Router } from "express";
import { z } from "zod";
import { prisma } from "./db.js";

// The dashboard's bell. Messages are written when something happens (a shop joins, sends a product, the admin answers)
// and read by the staff (shopId null) or by one shop. A failure here never breaks the action that caused it.

type Message = { kind: string; title: string; body?: string; link?: string };

/** For the store's staff. */
export async function notifyStaff(message: Message) {
  await prisma.notification.create({ data: { shopId: null, ...message } }).catch(() => undefined);
}

/** For one shop's account. */
export async function notifyShop(shopId: string, message: Message) {
  await prisma.notification.create({ data: { shopId, ...message } }).catch(() => undefined);
}

const ReadBody = z.object({ ids: z.array(z.string().uuid()).max(100).optional(), all: z.boolean().optional(), link: z.string().max(200).optional() }).strict();

/** The list and "mark as read" routes, for staff (shopId null) or for the shop the caller passes in. */
export function notificationRoutes(scope: (req: Parameters<Parameters<Router["get"]>[1]>[0]) => string | null) {
  const router = Router();
  router.get("/", async (req, res) => {
    const where = { shopId: scope(req) };
    const [items, unread, unreadOrders, unreadOrderLinks] = await Promise.all([
      prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, take: 30 }),
      prisma.notification.count({ where: { ...where, readAt: null } }),
      prisma.notification.count({ where: { ...where, readAt: null, kind: "order_placed" } }),
      prisma.notification.findMany({ where: { ...where, readAt: null, kind: "order_placed" }, select: { link: true }, take: 500 }),
    ]);
    res.setHeader("Cache-Control", "no-store");
    res.json({ unread, unreadOrders, unreadOrderLinks: unreadOrderLinks.map((row) => row.link), items: items.map((item) => ({ id: item.id, kind: item.kind, title: item.title, body: item.body, link: item.link, read: item.readAt !== null, createdAt: item.createdAt.toISOString() })) });
  });
  router.post("/read", async (req, res) => {
    const body = ReadBody.safeParse(req.body);
    if (!body.success || (!body.data.all && !body.data.ids?.length && !body.data.link)) {
      res.status(400).json({ error: "INVALID_INPUT" });
      return;
    }
    await prisma.notification.updateMany({ where: { shopId: scope(req), readAt: null, ...(body.data.all ? {} : body.data.link ? { link: body.data.link } : { id: { in: body.data.ids } }) }, data: { readAt: new Date() } });
    res.status(204).end();
  });
  return router;
}
