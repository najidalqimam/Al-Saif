import type { AdminRole } from "@prisma/client";

// What a dashboard account may do. A role grants a base set; an owner can add more to one person.
// "edit" always includes "view" of the same area.

export const PERMISSIONS = ["orders.view", "orders.edit", "customers.view", "catalogue.view", "catalogue.edit", "checkout.view", "checkout.edit", "team.manage"] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  OWNER: [...PERMISSIONS],
  MANAGER: ["orders.view", "orders.edit", "customers.view", "catalogue.view", "catalogue.edit", "checkout.view", "checkout.edit"],
  EDITOR: ["catalogue.view", "catalogue.edit", "checkout.view"],
  SUPPORT: ["orders.view", "orders.edit", "customers.view", "catalogue.view", "checkout.view"],
  // A shop account has no store-wide permission at all: it can only use the /api/shop routes, which are limited to its own shop.
  SHOP: [],
};

export function isPermission(value: unknown): value is Permission {
  return typeof value === "string" && (PERMISSIONS as readonly string[]).includes(value);
}

/** Only known permission names survive, so a stale or hand-edited value can never grant anything. */
export function cleanExtra(extra: unknown): Permission[] {
  return Array.isArray(extra) ? [...new Set(extra.filter(isPermission))] : [];
}

/** Everything the account may do: its role's permissions plus its own extras. */
export function permissionsOf(role: AdminRole, extra: unknown): Permission[] {
  const granted = new Set<Permission>([...ROLE_PERMISSIONS[role], ...cleanExtra(extra)]);
  for (const key of [...granted]) {
    if (key.endsWith(".edit")) granted.add(key.replace(".edit", ".view") as Permission);
  }
  return [...granted];
}
