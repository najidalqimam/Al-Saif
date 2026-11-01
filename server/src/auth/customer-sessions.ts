import { randomBytes } from "node:crypto";
import { config } from "../config.js";
import { prisma } from "../db.js";
import { hashToken } from "./sessions.js";

// Customer sessions work like admin sessions: a random token in an httpOnly cookie, only its SHA-256 hash in
// the database. The cookie is scoped to /api so the account, checkout and order routes all receive it.

export const CUSTOMER_COOKIE = "alsaif_customer";

export type SessionCustomer = { id: string; firstName: string; lastName: string; fullName: string; phone: string; email: string; sessionId: string };

export async function createCustomerSession(customerId: string, meta: { userAgent?: string; ip?: string }) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + config.CUSTOMER_SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.$transaction([
    prisma.customerSession.create({
      data: { customerId, tokenHash: hashToken(token), userAgent: meta.userAgent?.slice(0, 300), ipAddress: meta.ip?.slice(0, 64), expiresAt },
    }),
    prisma.customer.update({ where: { id: customerId }, data: { lastLoginAt: new Date() } }),
  ]);
  return { token, expiresAt };
}

/** The customer behind a session token, or null if it is unknown, expired or revoked. */
export async function findCustomerSession(token: string): Promise<SessionCustomer | null> {
  const session = await prisma.customerSession.findUnique({ where: { tokenHash: hashToken(token) }, include: { customer: true } });
  if (!session || session.revokedAt || session.expiresAt <= new Date()) return null;
  const { customer } = session;
  return {
    id: customer.id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    fullName: customer.fullName,
    phone: customer.phone,
    email: customer.email,
    sessionId: session.id,
  };
}

export async function revokeCustomerSession(sessionId: string) {
  await prisma.customerSession.updateMany({ where: { id: sessionId, revokedAt: null }, data: { revokedAt: new Date() } });
}

/** Signs the customer out everywhere except the given session (after a password change). */
export async function revokeOtherCustomerSessions(customerId: string, keepSessionId: string) {
  await prisma.customerSession.updateMany({ where: { customerId, revokedAt: null, id: { not: keepSessionId } }, data: { revokedAt: new Date() } });
}

export function customerCookie(token: string, expiresAt: Date) {
  const parts = [`${CUSTOMER_COOKIE}=${token}`, "HttpOnly", "SameSite=Strict", "Path=/api", `Expires=${expiresAt.toUTCString()}`];
  if (config.isProduction) parts.push("Secure");
  return parts.join("; ");
}

export function clearedCustomerCookie() {
  return `${CUSTOMER_COOKIE}=; HttpOnly; SameSite=Strict; Path=/api; Expires=Thu, 01 Jan 1970 00:00:00 GMT${config.isProduction ? "; Secure" : ""}`;
}
