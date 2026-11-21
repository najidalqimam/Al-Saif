// What a dashboard account may do (mirrors server/src/auth/permissions.ts, which is what is actually enforced).
// A role grants a base set; extras add to one person. An "edit" permission always includes the matching "view".

export type Permission = "orders.view" | "orders.edit" | "customers.view" | "catalogue.view" | "catalogue.edit" | "checkout.view" | "checkout.edit" | "team.manage";
export type Role = "OWNER" | "MANAGER" | "EDITOR" | "SUPPORT" | "SHOP";

export const PERMISSION_LIST: Array<{ key: Permission; label: string }> = [
  { key: "orders.view", label: "عرض الطلبات" },
  { key: "orders.edit", label: "تحديث حالة الطلبات والدفع" },
  { key: "customers.view", label: "عرض حسابات العملاء" },
  { key: "catalogue.view", label: "عرض المنتجات والأقسام والمحلات والمخزون" },
  { key: "catalogue.edit", label: "إضافة وتعديل المنتجات والأقسام والمحلات والمخزون" },
  { key: "checkout.view", label: "عرض إعدادات الشحن والدفع" },
  { key: "checkout.edit", label: "تعديل إعدادات الشحن والدفع" },
  { key: "team.manage", label: "إدارة فريق العمل والصلاحيات" },
];
export const ALL_PERMISSIONS = PERMISSION_LIST.map((item) => item.key);

export const ROLE_BASE: Record<Role, Permission[]> = {
  OWNER: ALL_PERMISSIONS,
  MANAGER: ["orders.view", "orders.edit", "customers.view", "catalogue.view", "catalogue.edit", "checkout.view", "checkout.edit"],
  EDITOR: ["catalogue.view", "catalogue.edit", "checkout.view"],
  SUPPORT: ["orders.view", "orders.edit", "customers.view", "catalogue.view", "checkout.view"],
  // A shop account has no store-wide permission: it only reaches its own shop through the shop dashboard.
  SHOP: [],
};

/** A list of permissions together with the "view" of every "edit" in it. */
export function withViews(keys: readonly Permission[]) {
  return new Set<Permission>([...keys, ...keys.filter((key) => key.endsWith(".edit")).map((key) => key.replace(".edit", ".view") as Permission)]);
}

/** Everything an account may do: its role's permissions plus its own extras. */
export function permissionsOf(role: Role, extra: readonly Permission[] = []): Permission[] {
  return [...withViews([...ROLE_BASE[role], ...extra])];
}
