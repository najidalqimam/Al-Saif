import type { AdminRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { config } from "../config.js";
import { CUSTOMER_COOKIE, findCustomerSession, type SessionCustomer } from "./customer-sessions.js";
import { SESSION_COOKIE, findSession, readCookie, type SessionAdmin } from "./sessions.js";

declare global {
  namespace Express {
    interface Request {
      admin?: SessionAdmin;
      customer?: SessionCustomer;
    }
  }
}

/**
 * Lets the request through only with a valid admin session cookie and, when given, one of the allowed roles.
 * Changing requests must also come from an allowed frontend origin (defence in depth next to SameSite=Strict).
 */
export function requireAdmin(roles?: AdminRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      const origin = req.get("origin");
      if (origin && !config.corsOrigins.includes(origin)) {
        res.status(403).json({ error: "FORBIDDEN_ORIGIN" });
        return;
      }
    }
    const token = readCookie(req.get("cookie"), SESSION_COOKIE);
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
