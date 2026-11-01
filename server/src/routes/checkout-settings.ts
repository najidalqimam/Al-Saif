import { Prisma, type PaymentMethodCode } from "@prisma/client";
import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { requireAdmin } from "../auth/middleware.js";
import { prisma } from "../db.js";

// Shipping zones, shipping methods and payment options, kept in the database so the checkout on every device
// and the server's order totals use the same settings.
//   GET /api/checkout/options          what the storefront checkout offers (active entries only)
//   GET /api/admin/checkout-settings   everything, for the dashboard's shipping and payment pages
//   PUT /api/admin/checkout-settings   saves them (OWNER and MANAGER)
// The dashboard uses its own ids for payments ("cod", "bank", "online"); they map to the database codes below.

const PAYMENT_CODES: Record<"cod" | "bank" | "online", PaymentMethodCode> = { cod: "COD", bank: "BANK_TRANSFER", online: "ONLINE" };
const PAYMENT_IDS = Object.fromEntries(Object.entries(PAYMENT_CODES).map(([id, code]) => [code, id])) as Record<PaymentMethodCode, "cod" | "bank" | "online">;
const PAYMENT_NAMES: Record<PaymentMethodCode, { ar: string; en: string }> = {
  COD: { ar: "الدفع عند الاستلام", en: "Cash on delivery" },
  BANK_TRANSFER: { ar: "تحويل بنكي", en: "Bank transfer" },
  ONLINE: { ar: "الدفع الإلكتروني", en: "Online payment" },
};

const code = z.string().regex(/^[a-z0-9-]{1,40}$/);
const amount = z.number().min(0).max(1_000_000).multipleOf(0.01);
const text = (max: number) => z.string().trim().max(max);

const SettingsBody = z
  .object({
    zones: z.array(z.object({ id: code, nameAr: text(120).min(1), cities: text(1000), enabled: z.boolean() }).strict()).min(1).max(50),
    shipping: z
      .array(
        z
          .object({
            id: code,
            nameAr: text(120).min(1),
            nameEn: text(120).min(1),
            enabled: z.boolean(),
            fee: amount,
            freeOver: amount.nullable(),
            minOrder: amount.nullable(),
            etaMin: z.number().int().min(0).max(90),
            etaMax: z.number().int().min(0).max(90),
            zones: z.array(code).max(50),
          })
          .strict(),
      )
      .min(1)
      .max(30),
    payments: z.array(z.object({ id: z.enum(["cod", "bank", "online"]), enabled: z.boolean(), fee: amount, note: text(2000) }).strict()).max(3),
    bank: z.object({ bankName: text(120), holder: text(120) }).strict(),
  })
  .strict();

type Handler = (req: Request, res: Response) => Promise<void>;
const handle = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);
const money = (value: Prisma.Decimal | null) => (value === null ? null : Number(value.toFixed(2)));

function bankDetails(config: Prisma.JsonValue) {
  const value = config && typeof config === "object" && !Array.isArray(config) ? config : {};
  return { bankName: typeof value.bankName === "string" ? value.bankName : "", holder: typeof value.holder === "string" ? value.holder : "" };
}

async function readAll() {
  const [zones, methods, payments] = await Promise.all([
    prisma.shippingZone.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.shippingMethod.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], include: { zones: { include: { zone: { select: { code: true } } } } } }),
    prisma.paymentMethod.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return { zones, methods, payments };
}

// ---------------------------------------------------------------------------
// Storefront
// ---------------------------------------------------------------------------

export const checkoutRouter = Router();

checkoutRouter.get(
  "/options",
  handle(async (_req, res) => {
    const { zones, methods, payments } = await readAll();
    const activeZones = zones.filter((zone) => zone.isActive);
    const activeCodes = new Set(activeZones.map((zone) => zone.code));
    res.setHeader("Cache-Control", "no-store");
    res.json({
      zones: activeZones.map((zone) => ({ code: zone.code, nameAr: zone.nameAr, nameEn: zone.nameEn, cities: zone.citiesAr })),
      shipping: methods
        .filter((method) => method.isActive)
        .map((method) => ({
          code: method.code,
          nameAr: method.nameAr,
          nameEn: method.nameEn,
          fee: money(method.fee),
          freeOver: money(method.freeOverAmount),
          minOrder: money(method.minOrderAmount),
          etaMin: method.etaMinDays,
          etaMax: method.etaMaxDays,
          zones: method.zones.map((link) => link.zone.code).filter((zone) => activeCodes.has(zone)),
        })),
      // Online payment needs a real gateway, so it is never offered from here.
      payments: payments
        .filter((payment) => payment.isActive && payment.code !== "ONLINE")
        .map((payment) => ({
          id: PAYMENT_IDS[payment.code],
          code: payment.code,
          fee: money(payment.extraFee),
          note: payment.instructionsAr,
          bank: payment.code === "BANK_TRANSFER" ? bankDetails(payment.publicConfig) : undefined,
        })),
    });
  }),
);

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export const adminCheckoutRouter = Router();

adminCheckoutRouter.get(
  "/checkout-settings",
  requireAdmin(["OWNER", "MANAGER", "EDITOR", "SUPPORT"]),
  handle(async (_req, res) => {
    const { zones, methods, payments } = await readAll();
    const bank = payments.find((payment) => payment.code === "BANK_TRANSFER");
    res.setHeader("Cache-Control", "no-store");
    res.json({
      configured: zones.length > 0 && methods.length > 0,
      settings: {
        zones: zones.map((zone) => ({ id: zone.code, nameAr: zone.nameAr, cities: zone.citiesAr, enabled: zone.isActive })),
        shipping: methods.map((method) => ({
          id: method.code,
          nameAr: method.nameAr,
          nameEn: method.nameEn,
          enabled: method.isActive,
          fee: money(method.fee),
          freeOver: money(method.freeOverAmount),
          minOrder: money(method.minOrderAmount),
          etaMin: method.etaMinDays,
          etaMax: method.etaMaxDays,
          zones: method.zones.map((link) => link.zone.code),
        })),
        payments: payments.map((payment) => ({ id: PAYMENT_IDS[payment.code], enabled: payment.isActive, fee: money(payment.extraFee) ?? 0, note: payment.instructionsAr })),
        bank: bank ? bankDetails(bank.publicConfig) : { bankName: "", holder: "" },
      },
    });
  }),
);

adminCheckoutRouter.put(
  "/checkout-settings",
  requireAdmin(["OWNER", "MANAGER"]),
  handle(async (req, res) => {
    const body = SettingsBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: "INVALID_INPUT", issues: body.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) });
      return;
    }
    const { zones, shipping, payments, bank } = body.data;
    const known = new Set(zones.map((zone) => zone.id));
    if (shipping.some((method) => method.zones.some((zone) => !known.has(zone)))) {
      res.status(400).json({ error: "UNKNOWN_ZONE" });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Zones and methods are matched by code. A zone missing from the list was deleted in the dashboard and is
      // removed: past orders keep their own copy of the zone name, saved addresses lose the link (zone_id is set
      // to NULL) and the customer picks a region again. Missing shipping methods are only switched off.
      const zoneIds = new Map<string, string>();
      for (const [index, zone] of zones.entries()) {
        const row = await tx.shippingZone.upsert({
          where: { code: zone.id },
          create: { code: zone.id, nameAr: zone.nameAr, citiesAr: zone.cities, isActive: zone.enabled, sortOrder: index },
          update: { nameAr: zone.nameAr, citiesAr: zone.cities, isActive: zone.enabled, sortOrder: index },
        });
        zoneIds.set(zone.id, row.id);
      }
      await tx.shippingZone.deleteMany({ where: { code: { notIn: [...known] } } });

      for (const [index, method] of shipping.entries()) {
        const data = {
          nameAr: method.nameAr,
          nameEn: method.nameEn,
          isActive: method.enabled,
          fee: new Prisma.Decimal(method.fee.toFixed(2)),
          freeOverAmount: method.freeOver === null ? null : new Prisma.Decimal(method.freeOver.toFixed(2)),
          minOrderAmount: method.minOrder === null ? null : new Prisma.Decimal(method.minOrder.toFixed(2)),
          etaMinDays: Math.min(method.etaMin, method.etaMax),
          etaMaxDays: Math.max(method.etaMin, method.etaMax),
          sortOrder: index,
        };
        const row = await tx.shippingMethod.upsert({ where: { code: method.id }, create: { code: method.id, ...data }, update: data });
        await tx.shippingMethodZone.deleteMany({ where: { methodId: row.id } });
        if (method.zones.length) {
          await tx.shippingMethodZone.createMany({ data: [...new Set(method.zones)].map((zone) => ({ methodId: row.id, zoneId: zoneIds.get(zone)! })) });
        }
      }
      await tx.shippingMethod.updateMany({ where: { code: { notIn: shipping.map((method) => method.id) } }, data: { isActive: false } });

      for (const [index, id] of (["cod", "bank", "online"] as const).entries()) {
        const sent = payments.find((payment) => payment.id === id);
        const paymentCode = PAYMENT_CODES[id];
        const data = {
          // Online payment stays off until a real gateway is connected, whatever was sent.
          isActive: id === "online" ? false : (sent?.enabled ?? false),
          extraFee: new Prisma.Decimal((sent?.fee ?? 0).toFixed(2)),
          instructionsAr: sent?.note ?? "",
          publicConfig: id === "bank" ? bank : {},
          sortOrder: index,
        };
        await tx.paymentMethod.upsert({
          where: { code: paymentCode },
          create: { code: paymentCode, nameAr: PAYMENT_NAMES[paymentCode].ar, nameEn: PAYMENT_NAMES[paymentCode].en, ...data },
          update: data,
        });
      }
    });

    res.status(204).end();
  }),
);
