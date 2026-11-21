import { Prisma, type AdminRole } from "@prisma/client";
import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { hashPassword, passwordProblem } from "../auth/password.js";
import { requirePermission } from "../auth/middleware.js";
import { PERMISSIONS, cleanExtra } from "../auth/permissions.js";
import { prisma } from "../db.js";

// /api/admin/team: the dashboard's own staff accounts. Only the owner can see and change them. Password hashes
// and session tokens are never part of an answer.

const ROLES = ["OWNER", "MANAGER", "EDITOR", "SUPPORT"] as const;
/** Store staff roles, plus SHOP: an account that belongs to one shop (created with its shopId) and cannot become staff later. */
const NEW_ROLES = [...ROLES, "SHOP"] as const;
const text = (min: number, max: number) => z.string().trim().min(min).max(max);
const email = z.string().trim().toLowerCase().email().max(254);

const phone = z.string().trim().max(40).regex(/^[0-9+\s-]*$/);
const jobTitle = z.string().trim().max(120);
const extraPermissions = z.array(z.enum(PERMISSIONS)).max(PERMISSIONS.length);
const NewMember = z.object({ fullName: text(2, 120), email, phone: phone.optional(), jobTitle: jobTitle.optional(), role: z.enum(NEW_ROLES), shopId: z.string().uuid().optional(), extraPermissions: extraPermissions.optional(), password: z.string().min(1).max(256) }).strict();
const MemberPatch = z
  .object({ fullName: text(2, 120), phone, jobTitle, role: z.enum(ROLES), extraPermissions, isActive: z.boolean(), password: z.string().min(1).max(256) })
  .partial()
  .strict()
  .refine((body) => Object.keys(body).length > 0, "Nothing to change");

type Handler = (req: Request, res: Response) => Promise<void>;
const handle = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

const select = { id: true, email: true, fullName: true, phone: true, jobTitle: true, role: true, shopId: true, extraPermissions: true, isActive: true, lastLoginAt: true, createdAt: true } satisfies Prisma.AdminUserSelect;

/** A member as the dashboard sees it: only known permission names, no matter what is stored. */
const shape = <T extends { extraPermissions: unknown }>(member: T) => ({ ...member, extraPermissions: cleanExtra(member.extraPermissions) });

function invalid(res: Response, error: z.ZodError) {
  res.status(400).json({ error: "INVALID_INPUT", issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) });
}

/** True when the change would leave the store with no active owner. */
async function wouldLoseLastOwner(id: string, next: { role?: AdminRole; isActive?: boolean }) {
  const target = await prisma.adminUser.findUnique({ where: { id }, select: { role: true, isActive: true } });
  if (!target || target.role !== "OWNER" || !target.isActive) return false;
  const staysOwner = (next.role ?? target.role) === "OWNER" && (next.isActive ?? target.isActive);
  if (staysOwner) return false;
  const others = await prisma.adminUser.count({ where: { role: "OWNER", isActive: true, id: { not: id } } });
  return others === 0;
}

export const adminTeamRouter = Router();
adminTeamRouter.use(requirePermission("team.manage"));

adminTeamRouter.get(
  "/",
  handle(async (_req, res) => {
    const members = await prisma.adminUser.findMany({ select, orderBy: [{ createdAt: "asc" }] });
    res.setHeader("Cache-Control", "no-store");
    res.json({ members: members.map(shape), me: _req.admin!.id });
  }),
);

adminTeamRouter.post(
  "/",
  handle(async (req, res) => {
    const body = NewMember.safeParse(req.body);
    if (!body.success) return invalid(res, body.error);
    const problem = passwordProblem(body.data.password);
    if (problem) {
      res.status(400).json({ error: "WEAK_PASSWORD", message: problem });
      return;
    }
    if (await prisma.adminUser.findUnique({ where: { email: body.data.email }, select: { id: true } })) {
      res.status(409).json({ error: "EMAIL_TAKEN" });
      return;
    }
    // A SHOP account needs the shop it belongs to; staff accounts never have one.
    if ((body.data.role === "SHOP") !== (body.data.shopId !== undefined)) {
      res.status(400).json({ error: "INVALID_SHOP_LINK" });
      return;
    }
    if (body.data.shopId && !(await prisma.shop.findUnique({ where: { id: body.data.shopId }, select: { id: true } }))) {
      res.status(404).json({ error: "SHOP_NOT_FOUND" });
      return;
    }
    const member = await prisma.adminUser.create({
      data: { email: body.data.email, fullName: body.data.fullName, phone: body.data.phone ?? "", jobTitle: body.data.jobTitle ?? "", role: body.data.role, shopId: body.data.shopId, extraPermissions: body.data.role === "SHOP" ? [] : (body.data.extraPermissions ?? []), passwordHash: await hashPassword(body.data.password) },
      select,
    });
    res.status(201).json({ member: shape(member) });
  }),
);

adminTeamRouter.patch(
  "/:id",
  handle(async (req, res) => {
    const body = MemberPatch.safeParse(req.body);
    if (!body.success) return invalid(res, body.error);
    const id = String(req.params.id);
    const existing = await prisma.adminUser.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!existing) {
      res.status(404).json({ error: "MEMBER_NOT_FOUND" });
      return;
    }
    // A shop account stays a shop account (and a staff account never becomes one): its limits come from the role.
    if (existing.role === "SHOP" && (body.data.role !== undefined || body.data.extraPermissions !== undefined)) {
      res.status(400).json({ error: "SHOP_ACCOUNT_ROLE_FIXED" });
      return;
    }
    const { password, ...rest } = body.data;
    // Nobody locks themselves out, and the store always keeps one active owner.
    if (id === req.admin!.id && (rest.role !== undefined || rest.isActive === false)) {
      res.status(409).json({ error: "CANNOT_CHANGE_SELF" });
      return;
    }
    if (await wouldLoseLastOwner(id, rest)) {
      res.status(409).json({ error: "LAST_OWNER" });
      return;
    }
    if (password !== undefined) {
      const problem = passwordProblem(password);
      if (problem) {
        res.status(400).json({ error: "WEAK_PASSWORD", message: problem });
        return;
      }
    }
    const member = await prisma.$transaction(async (tx) => {
      const updated = await tx.adminUser.update({ where: { id }, data: { ...rest, ...(password !== undefined ? { passwordHash: await hashPassword(password) } : {}) }, select });
      // A new password or a disabled account ends the sessions that are open.
      if (password !== undefined || rest.isActive === false) await tx.adminSession.updateMany({ where: { adminUserId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      return updated;
    });
    res.json({ member: shape(member) });
  }),
);
