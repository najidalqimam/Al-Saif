import type { AdminRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { config } from "../config.js";
import type { Permission } from "./permissions.js";
import { CUSTOMER_COOKIE, findCustomerSession, type SessionCustomer } from "./customer-sessions.js";
import { SESSION_COOKIE, SHOP_COOKIE, findSession, readCookie, type SessionAdmin } from "./sessions.js";

declare global {
  namespace Express {
    interface Request {
      admin?: SessionAdmin;
      customer?: SessionCustomer;
      shopId?: string;
    }
  }
}

/**
 * Lets the request through only with a valid admin session cookie and, when given, one of the allowed roles.
 * Changing requests must also come from an allowed frontend origin (defence in depth next to SameSite=Strict).
 */
/**
 * Which cookie this request carries its session in: a shop's own cookie for the shop routes, and for the shared
 * "who am I" / sign-out routes when the shop dashboard says so (X-Dashboard: shop); otherwise the admin cookie.
 */
export function sessionCookieName(req: Request, roles?: AdminRole[]) {
  return (roles?.length === 1 && roles[0] === "SHOP") || req.get("x-dashboard") === "shop" ? SHOP_COOKIE : SESSION_COOKIE;
}

export function requireAdmin(roles?: AdminRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      const origin = req.get("origin");
      if (origin && !config.corsOrigins.includes(origin)) {
        res.status(403).json({ error: "FORBIDDEN_ORIGIN" });
        return;
      }
    }
    const token = readCookie(req.get("cookie"), sessionCookieName(req, roles));
    const admin = token ? await findSession(token) : null;
    if (!admin) {
      res.status(401).json({ error: "UNAUTHENTICATED" });
      return;
    }
    if (roles && !roles.includes(admin.role)) {
      res.status(403).json({ error: "FORBIDDEN_ROLE" });
      return;
    }
    req.admin = admin;
    next();
  };
}

/** Like requireAdmin, but by permission: passes when the account has any of the given permissions (its role's or its own extras). */
export function requirePermission(...keys: Permission[]) {
  const check = requireAdmin();
  return async (req: Request, res: Response, next: NextFunction) => {
    await check(req, res, () => {
      if (!keys.some((key) => req.admin!.permissions.includes(key))) {
        res.status(403).json({ error: "FORBIDDEN_ROLE" });
        return;
      }
      next();
    });
  };
}

/** Changing requests from a browser must come from one of the configured frontends. */
function allowedOrigin(req: Request) {
  if (req.method === "GET" || req.method === "HEAD") return true;
  const origin = req.get("origin");
  return !origin || config.corsOrigins.includes(origin);
}

/** Attaches the signed-in customer when there is one; guests pass through (checkout allows both). */
export function optionalCustomer() {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!allowedOrigin(req)) {
      res.status(403).json({ error: "FORBIDDEN_ORIGIN" });
      return;
    }
    const token = readCookie(req.get("cookie"), CUSTOMER_COOKIE);
    const customer = token ? await findCustomerSession(token) : null;
    if (customer) req.customer = customer;
    next();
  };
}

/** Lets the request through only with a valid customer session cookie. */
export function requireCustomer() {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!allowedOrigin(req)) {
      res.status(403).json({ error: "FORBIDDEN_ORIGIN" });
      return;
    }
    const token = readCookie(req.get("cookie"), CUSTOMER_COOKIE);
    const customer = token ? await findCustomerSession(token) : null;
    if (!customer) {
      res.status(401).json({ error: "UNAUTHENTICATED" });
      return;
    }
    req.customer = customer;
    next();
  };
}

/** A shop account (role SHOP) tied to one shop. Everything behind it is limited to that shop: req.shopId is the only shop it may touch. */
export function requireShop() {
  const check = requireAdmin(["SHOP"]);
  return async (req: Request, res: Response, next: NextFunction) => {
    await check(req, res, () => {
      if (!req.admin!.shopId) {
        res.status(403).json({ error: "SHOP_NOT_LINKED" });
        return;
      }
      req.shopId = req.admin!.shopId;
      next();
    });
  };
}
