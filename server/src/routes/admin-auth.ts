import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { requireAdmin, sessionCookieName } from "../auth/middleware.js";
import { permissionsOf } from "../auth/permissions.js";
import { dummyPasswordHash, verifyPassword } from "../auth/password.js";
import { clearedSessionCookie, cookieFor, createSession, legacyClearedCookie, revokeSession, sessionCookie } from "../auth/sessions.js";
import { prisma } from "../db.js";

// /api/admin/auth: login, logout and "who am I" for the dashboard.

const LoginBody = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email().max(200)),
    password: z.string().min(1).max(256),
  })
  .strict();

export const adminAuthRouter = Router();

adminAuthRouter.post(
  "/login",
  // Slows down password guessing from one address. Successful logins don't count.
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, skipSuccessfulRequests: true, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "TOO_MANY_ATTEMPTS" } }),
  async (req, res) => {
    const body = LoginBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: "INVALID_LOGIN" });
      return;
    }
    const admin = await prisma.adminUser.findUnique({ where: { email: body.data.email } });
    // Always run one hash check so unknown emails and wrong passwords take the same time and get the same answer.
    const valid = await verifyPassword(body.data.password, admin?.passwordHash ?? (await dummyPasswordHash()));
    if (!admin || !admin.isActive || !valid) {
      res.status(401).json({ error: "INVALID_CREDENTIALS" });
      return;
    }
    // A suspended or deleted shop cannot sign in.
    if (admin.role === "SHOP" && admin.shopId) {
      const shop = await prisma.shop.findUnique({ where: { id: admin.shopId }, select: { isActive: true, archivedAt: true } });
      if (!shop || !shop.isActive || shop.archivedAt) {
        res.status(403).json({ error: "SHOP_SUSPENDED" });
        return;
      }
    }
    const { token, expiresAt } = await createSession(admin.id, { userAgent: req.get("user-agent"), ip: req.ip });
    res.setHeader("Set-Cookie", [sessionCookie(token, expiresAt, cookieFor(admin.role)), legacyClearedCookie()]);
    res.json({ admin: { email: admin.email, fullName: admin.fullName, role: admin.role, shopId: admin.shopId, permissions: permissionsOf(admin.role, admin.extraPermissions) }, expiresAt });
  },
);

adminAuthRouter.post("/logout", requireAdmin(), async (req, res) => {
  await revokeSession(req.admin!.sessionId);
  res.setHeader("Set-Cookie", clearedSessionCookie(sessionCookieName(req)));
  res.status(204).end();
});

adminAuthRouter.get("/me", requireAdmin(), (req, res) => {
  const { email, fullName, role, permissions, shopId } = req.admin!;
  res.json({ admin: { email, fullName, role, shopId, permissions } });
});
