import { Prisma } from "@prisma/client";
import { Router, type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import {
  clearedCustomerCookie,
  createCustomerSession,
  customerCookie,
  revokeCustomerSession,
  revokeOtherCustomerSessions,
} from "../auth/customer-sessions.js";
import { requireCustomer } from "../auth/middleware.js";
import { dummyPasswordHash, hashPassword, verifyPassword } from "../auth/password.js";
import { prisma } from "../db.js";
import { deliver, requeueWelcome } from "../mail/outbox.js";

// /api/account: customer registration, sign-in, profile, saved addresses and the customer's own orders.
// Customers sign in with their mobile number (or their email) and password; the email also receives the
// welcome message.

const text = (min: number, max: number) => z.string().trim().min(min).max(max);
const phone = z
  .string()
  .transform((value) => value.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^05\d{8}$/, "Saudi mobile number starting with 05, 10 digits"));
const email = z.string().trim().toLowerCase().pipe(z.email().max(254));
const password = z.string().min(8, "At least 8 characters").max(128);
const personName = text(1, 60).regex(/^[\p{L}\p{M}' .-]+$/u, "Letters only");

/** Preset avatars the storefront can draw (src/lib/avatars.ts); anything else is refused. */
export const AVATARS = [
  "initials-blue",
  "initials-navy",
  "initials-green",
  "initials-orange",
  "initials-pink",
  "initials-purple",
  "gamepad",
  "laptop",
  "headphones",
  "smartphone",
  "monitor",
  "rocket",
] as const;

const RegisterBody = z
  .object({ firstName: personName, lastName: personName, phone, email, password, locale: z.enum(["ar", "en"]).optional() })
  .strict();
/** Sign in with the mobile number or the email address, whichever the customer types. */
const LoginBody = z
  .object({
    login: z.string().trim().min(1).max(254),
    password: z.string().min(1).max(128),
  })
  .strict()
  .transform(({ login, password: secret }) =>
    login.includes("@") ? { email: login.toLowerCase(), password: secret } : { phone: login.replace(/[\s-]/g, ""), password: secret },
  );
const ProfileBody = z
  .object({ firstName: personName, lastName: personName, email, avatar: z.enum(AVATARS).nullable() })
  .partial()
  .strict()
  .refine((body) => Object.keys(body).length > 0, "Nothing to change");
const PasswordBody = z.object({ current: z.string().min(1).max(128), next: password }).strict();
const AddressFields = z.object({
  label: text(0, 60).optional(),
  zoneCode: z.string().regex(/^[a-z0-9-]{1,40}$/),
  city: text(2, 80),
  line1: text(3, 200),
  notes: text(0, 500).optional(),
  isDefault: z.boolean().optional(),
});
const NewAddress = AddressFields.strict();
const AddressPatch = AddressFields.partial().strict().refine((body) => Object.keys(body).length > 0, "Nothing to change");

const limiter = (minutes: number, limit: number, skipSuccessfulRequests = false) =>
  rateLimit({ windowMs: minutes * 60 * 1000, limit, skipSuccessfulRequests, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "TOO_MANY_ATTEMPTS" } });

type Handler = (req: Request, res: Response) => Promise<void>;
const handle = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

function invalid(res: Response, error: z.ZodError) {
  res.status(400).json({ error: "INVALID_INPUT", issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) });
}

/** Which unique field a P2002 error is about (phone or email). */
function duplicateField(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return null;
  const target = JSON.stringify(error.meta?.target ?? "");
  if (target.includes("phone")) return "PHONE_TAKEN";
  if (target.includes("email")) return "EMAIL_TAKEN";
  return null;
}

async function profile(customerId: string) {
  const customer = await prisma.customer.findUniqueOrThrow({
    where: { id: customerId },
    include: { emails: { where: { kind: "WELCOME" }, select: { status: true, sentAt: true } } },
  });
  return {
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
    email: customer.email,
    avatar: customer.avatar,
    createdAt: customer.createdAt,
    welcomeEmail: customer.emails[0] ? { status: customer.emails[0].status, sentAt: customer.emails[0].sentAt } : null,
  };
}

function address(row: Prisma.AddressGetPayload<{ include: { zone: true } }>) {
  return {
    id: row.id,
    label: row.label,
    zoneCode: row.zone?.code ?? null,
    zoneName: row.zone?.nameAr ?? null,
    city: row.city,
    line1: row.line1,
    notes: row.notes ?? "",
    isDefault: row.isDefault,
  };
}

async function activeZone(code: string) {
  const zone = await prisma.shippingZone.findFirst({ where: { code, isActive: true } });
  if (!zone) throw Object.assign(new Error("ZONE_UNAVAILABLE"), { status: 422 });
  return zone;
}

export const accountRouter = Router();

// ---------------------------------------------------------------------------
// Registration and sign-in
// ---------------------------------------------------------------------------

accountRouter.post(
  "/register",
  limiter(60, 10),
  handle(async (req, res) => {
    const body = RegisterBody.safeParse(req.body);
    if (!body.success) return invalid(res, body.error);
    const { firstName, lastName, phone: mobile, email: address, password: secret, locale = "ar" } = body.data;

    const taken = await prisma.customer.findFirst({ where: { OR: [{ phone: mobile }, { email: address }] }, select: { phone: true } });
    if (taken) {
      res.status(409).json({ error: taken.phone === mobile ? "PHONE_TAKEN" : "EMAIL_TAKEN" });
      return;
    }
    const passwordHash = await hashPassword(secret);
    let created: { customerId: string; emailId: string };
    try {
      // The account and its welcome email are written together: the email can then be sent and retried
      // later without ever creating the account twice.
      created = await prisma.$transaction(async (tx) => {
        const customer = await tx.customer.create({
          data: { firstName, lastName, fullName: `${firstName} ${lastName}`, phone: mobile, email: address, passwordHash },
        });
        const queued = await tx.emailOutbox.create({ data: { customerId: customer.id, kind: "WELCOME", toAddress: address, locale } });
        return { customerId: customer.id, emailId: queued.id };
      });
    } catch (error) {
      // Two registrations for the same phone or email at the same moment: the unique index stops the second.
      const field = duplicateField(error);
      if (field) {
        res.status(409).json({ error: field });
        return;
      }
      throw error;
    }

    const { token, expiresAt } = await createCustomerSession(created.customerId, { userAgent: req.get("user-agent"), ip: req.ip });
    res.setHeader("Set-Cookie", customerCookie(token, expiresAt));
    res.status(201).json({ customer: await profile(created.customerId) });
    // Sent after the answer: a slow or failing mail server never holds up or undoes the registration.
    void deliver(created.emailId).catch((error) => console.error("Welcome email failed to start:", error instanceof Error ? error.message : error));
  }),
);

accountRouter.post(
  "/login",
  limiter(15, 10, true),
  handle(async (req, res) => {
    const body = LoginBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: "INVALID_LOGIN" });
      return;
    }
    const where = "email" in body.data ? { email: body.data.email } : { phone: body.data.phone };
    const customer = await prisma.customer.findUnique({ where });
    // Always run one hash check so unknown numbers and wrong passwords take the same time and get the same answer.
    const valid = await verifyPassword(body.data.password, customer?.passwordHash ?? (await dummyPasswordHash()));
    if (!customer || !valid) {
      res.status(401).json({ error: "INVALID_CREDENTIALS" });
      return;
    }
    const { token, expiresAt } = await createCustomerSession(customer.id, { userAgent: req.get("user-agent"), ip: req.ip });
    res.setHeader("Set-Cookie", customerCookie(token, expiresAt));
    res.json({ customer: await profile(customer.id) });
  }),
);

accountRouter.post(
  "/logout",
  requireCustomer(),
  handle(async (req, res) => {
    await revokeCustomerSession(req.customer!.sessionId);
    res.setHeader("Set-Cookie", clearedCustomerCookie());
    res.status(204).end();
  }),
);

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

accountRouter.get(
  "/me",
  requireCustomer(),
  handle(async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({ customer: await profile(req.customer!.id) });
  }),
);

accountRouter.patch(
  "/me",
  requireCustomer(),
  handle(async (req, res) => {
    const body = ProfileBody.safeParse(req.body);
    if (!body.success) return invalid(res, body.error);
    const current = await prisma.customer.findUniqueOrThrow({ where: { id: req.customer!.id } });
    const firstName = body.data.firstName ?? current.firstName;
    const lastName = body.data.lastName ?? current.lastName;
    try {
      await prisma.customer.update({
        where: { id: current.id },
        data: { firstName, lastName, fullName: `${firstName} ${lastName}`, email: body.data.email ?? undefined, avatar: body.data.avatar },
      });
    } catch (error) {
      const field = duplicateField(error);
      if (field) {
        res.status(409).json({ error: field });
        return;
      }
      throw error;
    }
    res.json({ customer: await profile(current.id) });
  }),
);

accountRouter.post(
  "/password",
  requireCustomer(),
  limiter(15, 10, true),
  handle(async (req, res) => {
    const body = PasswordBody.safeParse(req.body);
    if (!body.success) return invalid(res, body.error);
    const customer = await prisma.customer.findUniqueOrThrow({ where: { id: req.customer!.id } });
    if (!(await verifyPassword(body.data.current, customer.passwordHash))) {
      res.status(401).json({ error: "WRONG_PASSWORD" });
      return;
    }
    await prisma.customer.update({ where: { id: customer.id }, data: { passwordHash: await hashPassword(body.data.next) } });
    // Other devices signed in with the old password are signed out; this one stays.
    await revokeOtherCustomerSessions(customer.id, req.customer!.sessionId);
    res.status(204).end();
  }),
);

accountRouter.post(
  "/welcome-email/resend",
  requireCustomer(),
  limiter(60, 3),
  handle(async (req, res) => {
    const queued = await requeueWelcome(req.customer!.id);
    if (!queued) {
      res.status(409).json({ error: "ALREADY_SENT" });
      return;
    }
    const row = await prisma.emailOutbox.findFirstOrThrow({ where: { customerId: req.customer!.id, kind: "WELCOME" } });
    await deliver(row.id);
    res.json({ customer: await profile(req.customer!.id) });
  }),
);

// ---------------------------------------------------------------------------
// Saved addresses
// ---------------------------------------------------------------------------

async function listAddresses(customerId: string) {
  const rows = await prisma.address.findMany({ where: { customerId }, include: { zone: true }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] });
  return rows.map(address);
}

async function ownAddress(req: Request) {
  const row = await prisma.address.findFirst({ where: { id: String(req.params.id), customerId: req.customer!.id } });
  if (!row) throw Object.assign(new Error("ADDRESS_NOT_FOUND"), { status: 404 });
  return row;
}

accountRouter.get(
  "/addresses",
  requireCustomer(),
  handle(async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({ addresses: await listAddresses(req.customer!.id) });
  }),
);

accountRouter.post(
  "/addresses",
  requireCustomer(),
  handle(async (req, res) => {
    const body = NewAddress.safeParse(req.body);
    if (!body.success) return invalid(res, body.error);
    const customerId = req.customer!.id;
    const zone = await activeZone(body.data.zoneCode);
    await prisma.$transaction(async (tx) => {
      const count = await tx.address.count({ where: { customerId } });
      if (count >= 20) throw Object.assign(new Error("TOO_MANY_ADDRESSES"), { status: 409 });
      // The first address is the default; a new default replaces the old one.
      const isDefault = count === 0 || body.data.isDefault === true;
      if (isDefault) await tx.address.updateMany({ where: { customerId, isDefault: true }, data: { isDefault: false } });
      await tx.address.create({
        data: { customerId, zoneId: zone.id, label: body.data.label ?? "", city: body.data.city, line1: body.data.line1, notes: body.data.notes || null, isDefault },
      });
    });
    res.status(201).json({ addresses: await listAddresses(customerId) });
  }),
);

accountRouter.patch(
  "/addresses/:id",
  requireCustomer(),
  handle(async (req, res) => {
    const body = AddressPatch.safeParse(req.body);
    if (!body.success) return invalid(res, body.error);
    const row = await ownAddress(req);
    const zone = body.data.zoneCode ? await activeZone(body.data.zoneCode) : null;
    await prisma.$transaction(async (tx) => {
      if (body.data.isDefault === true) await tx.address.updateMany({ where: { customerId: row.customerId, isDefault: true }, data: { isDefault: false } });
      await tx.address.update({
        where: { id: row.id },
        data: {
          zoneId: zone?.id,
          label: body.data.label,
          city: body.data.city,
          line1: body.data.line1,
          notes: body.data.notes === undefined ? undefined : body.data.notes || null,
          // The default can be moved to another address, not switched off leaving none.
          isDefault: body.data.isDefault === true ? true : undefined,
        },
      });
    });
    res.json({ addresses: await listAddresses(row.customerId) });
  }),
);

accountRouter.delete(
  "/addresses/:id",
  requireCustomer(),
  handle(async (req, res) => {
    const row = await ownAddress(req);
    await prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id: row.id } });
      if (row.isDefault) {
        // Another saved address becomes the default, so there is always one while any exist.
        const next = await tx.address.findFirst({ where: { customerId: row.customerId }, orderBy: { createdAt: "asc" } });
        if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    });
    res.json({ addresses: await listAddresses(row.customerId) });
  }),
);

// ---------------------------------------------------------------------------
// The customer's own orders (the order number stays in the dashboard)
// ---------------------------------------------------------------------------

accountRouter.get(
  "/orders",
  requireCustomer(),
  handle(async (req, res) => {
    const orders = await prisma.order.findMany({
      where: { customerId: req.customer!.id },
      orderBy: { placedAt: "desc" },
      take: 50,
      include: {
        items: { include: { product: { select: { legacyId: true } } } },
        statusHistory: { orderBy: { createdAt: "asc" }, select: { toStatus: true, createdAt: true } },
      },
    });
    res.setHeader("Cache-Control", "no-store");
    res.json({
      orders: orders.map((order) => ({
        id: order.id,
        placedAt: order.placedAt,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        currency: order.currency,
        subtotal: order.subtotal.toFixed(2),
        shippingFee: order.shippingFee.toFixed(2),
        paymentFee: order.paymentFee.toFixed(2),
        total: order.total.toFixed(2),
        shippingMethodName: order.shippingMethodName,
        zoneName: order.zoneName,
        city: order.city,
        addressLine: order.addressLine,
        items: order.items.map((item) => ({
          id: item.product?.legacyId ?? item.productId,
          name: item.productName,
          imageUrl: item.imageUrl,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toFixed(2),
          lineTotal: item.lineTotal.toFixed(2),
        })),
        history: order.statusHistory.map((step) => ({ status: step.toStatus, at: step.createdAt })),
      })),
    });
  }),
);

// Errors thrown above with a status (zone unavailable, address not found...) become JSON answers.
accountRouter.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  const status = (error as { status?: number })?.status;
  if (status && error instanceof Error && /^[A-Z_]+$/.test(error.message)) {
    res.status(status).json({ error: error.message });
    return;
  }
  next(error);
});
