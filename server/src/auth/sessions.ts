import { createHash, randomBytes } from "node:crypto";
import type { AdminRole } from "@prisma/client";
import { config } from "../config.js";
import { prisma } from "../db.js";
import { permissionsOf, type Permission } from "./permissions.js";

// Admin sessions are random tokens kept in an httpOnly cookie. The database stores only a SHA-256 hash of
// each token, so reading the sessions table never yields a usable session.

export const SESSION_COOKIE = "alsaif_admin";
/** Shop accounts have their own cookie, so the admin and a shop can be signed in side by side in one browser. */
export const SHOP_COOKIE = "alsaif_shop";

/** The cookie that belongs to this role. */
export const cookieFor = (role: AdminRole) => (role === "SHOP" ? SHOP_COOKIE : SESSION_COOKIE);

export type SessionAdmin = { id: string; email: string; fullName: string; role: AdminRole; permissions: Permission[]; shopId: string | null; sessionId: string };

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(adminUserId: string, meta: { userAgent?: string; ip?: string }) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + config.SESSION_TTL_HOURS * 60 * 60 * 1000);
  await prisma.$transaction([
    prisma.adminSession.create({
      data: {
        adminUserId,
        tokenHash: hashToken(token),
        userAgent: meta.userAgent?.slice(0, 300),
        ipAddress: meta.ip?.slice(0, 64),
        expiresAt,
      },
    }),
    prisma.adminUser.update({ where: { id: adminUserId }, data: { lastLoginAt: new Date() } }),
  ]);
  return { token, expiresAt };
}

/** The admin behind a session token, or null if it is unknown, expired, revoked or the admin is disabled. */
export async function findSession(token: string): Promise<SessionAdmin | null> {
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { adminUser: true },
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.adminUser.isActive) return null;
  const { adminUser } = session;
  return { id: adminUser.id, email: adminUser.email, fullName: adminUser.fullName, role: adminUser.role, permissions: permissionsOf(adminUser.role, adminUser.extraPermissions), shopId: adminUser.shopId, sessionId: session.id };
}

export async function revokeSession(sessionId: string) {
  await prisma.adminSession.updateMany({ where: { id: sessionId, revokedAt: null }, data: { revokedAt: new Date() } });
}

export function sessionCookie(token: string, expiresAt: Date, name: string = SESSION_COOKIE) {
  const parts = [
    `${name}=${token}`,
    "HttpOnly",
    "SameSite=Strict",
    // /api (not /api/admin): shop accounts use the same cookie for the /api/shop routes.
    "Path=/api",
    `Expires=${expiresAt.toUTCString()}`,
  ];
  if (config.isProduction) parts.push("Secure");
  return parts.join("; ");
}

/** Clears the session cookie. The older path (/api/admin) is cleared too, so a cookie set before shop accounts existed cannot linger. */
export function clearedSessionCookie(name: string = SESSION_COOKIE) {
  const secure = config.isProduction ? "; Secure" : "";
  return ["/api", "/api/admin"].map((path) => `${name}=; HttpOnly; SameSite=Strict; Path=${path}; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}`);
}

/** Expires a cookie left at the older path, so only the new one is sent. */
export function legacyClearedCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/api/admin; Expires=Thu, 01 Jan 1970 00:00:00 GMT${config.isProduction ? "; Secure" : ""}`;
}

export function readCookie(header: string | undefined, name: string) {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=") || null;
  }
  return null;
}
