import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { hashPassword, passwordProblem } from "../auth/password.js";
import { prisma } from "../db.js";
import { notifyStaff } from "../notifications.js";

// POST /api/shop-signup: a seller joins by itself. This makes the shop and its login in one go and the seller can sign in
// right away (to an empty dashboard). The shop is marked PENDING = "new": the admin sees a notification mark on it until
// the admin opens it.

const text = (min: number, max: number) => z.string().trim().min(min).max(max);
const Body = z
  .object({
    shopName: text(2, 200),
    ownerName: text(2, 200),
    phone: z.string().trim().min(5).max(40).regex(/^[0-9+\s-]+$/),
    email: z.string().trim().toLowerCase().email().max(200),
    city: text(1, 120),
    address: text(1, 500),
    description: text(0, 2000).optional(),
    password: z.string().min(1).max(256),
  })
  .strict();

export const shopSignupRouter = Router();

shopSignupRouter.post(
  "/",
  rateLimit({ windowMs: 60 * 60 * 1000, limit: 8, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "TOO_MANY_ATTEMPTS" } }),
  async (req, res) => {
    const body = Body.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: "INVALID_INPUT", issues: body.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) });
      return;
    }
    const problem = passwordProblem(body.data.password);
    if (problem) {
      res.status(400).json({ error: "WEAK_PASSWORD", message: problem });
      return;
    }
    if (await prisma.adminUser.findUnique({ where: { email: body.data.email }, select: { id: true } })) {
      res.status(409).json({ error: "EMAIL_TAKEN" });
      return;
    }
    const passwordHash = await hashPassword(body.data.password);
    await prisma.$transaction(async (tx) => {
      const shop = await tx.shop.create({
        data: { name: body.data.shopName, ownerName: body.data.ownerName, phone: body.data.phone, email: body.data.email, city: body.data.city, address: body.data.address, description: body.data.description ?? "", approvalStatus: "PENDING" },
      });
      await tx.adminUser.create({ data: { email: body.data.email, fullName: body.data.ownerName, phone: body.data.phone, role: "SHOP", shopId: shop.id, extraPermissions: [], passwordHash } });
    });
    await notifyStaff({ kind: "shop_joined", title: "محل جديد انضم", body: `${body.data.shopName} (${body.data.city})`, link: "shops" });
    res.status(201).json({ ok: true });
  },
);
