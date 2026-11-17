import { categoryTrail } from "@/lib/catalog";
import { NAV_ITEMS, pushHash, type View } from "./nav";

export type Crumb = { label: string; go?: () => void };

type Lookups = { shopName: (id: string) => string | undefined; productName: (id: string) => string | undefined };

/**
 * The real path of the current dashboard page, built from the same hash the pages already use
 * (#view, #departments/<category>, #products/<category|shop-id>[/edit-<id>]). Every level before the last
 * can be opened; the last one is the page itself. Sub-views that are only filters or dialogs add no level.
 */
export function crumbsFor(view: View, sub: string | null, lookups: Lookups): Crumb[] {
  const root = NAV_ITEMS.find((item) => item.id === view) ?? NAV_ITEMS[0];
  const home: Crumb = { label: "لوحة التحكم", go: () => pushHash("overview") };
  const section = (go?: () => void): Crumb => ({ label: root.label, go });

  if (view === "overview") return [{ label: root.label }];

  if (view === "departments" && sub === "add") {
    return [home, section(() => pushHash("departments")), { label: "إضافة قسم" }];
  }

  if (view === "departments" && sub && sub !== "add") {
    const trail = categoryTrail(sub);
    if (trail.length) {
      return [
        home,
        section(() => pushHash("departments")),
        ...trail.map((step, index): Crumb => ({ label: step.nameAr, go: index === trail.length - 1 ? undefined : () => pushHash("departments", step.id) })),
      ];
    }
  }

  if (view === "productRequests" && sub) {
    return [home, section(() => pushHash("productRequests")), { label: lookups.productName(sub) ?? "طلب منتج" }];
  }

  if (view === "shops" && sub) {
    const list = section(() => pushHash("shops"));
    if (sub === "add") return [home, list, { label: "إضافة محل" }];
    const shopId = sub.endsWith("/edit") ? sub.slice(0, -5) : sub;
    const label = lookups.shopName(shopId) ?? "المحل";
    return sub.endsWith("/edit") ? [home, list, { label, go: () => pushHash("shops", shopId) }, { label: "تعديل" }] : [home, list, { label }];
  }

  if (view === "customers" && sub?.startsWith("customer-")) {
    return [home, section(() => pushHash("customers")), { label: "تفاصيل العميل" }];
  }

  if (view === "orders" && sub?.startsWith("order-")) {
    return [home, section(() => pushHash("orders")), { label: `الطلب #${sub.slice(6)}` }];
  }

  if (view === "products" && sub) {
    const [scope = "all", action = ""] = sub.split("/");
    const editing = action.startsWith("edit-") ? action.slice(5) : null;
    const shopId = scope.startsWith("shop-") ? scope.slice(5) : null;
    const listHash = scope === "all" ? null : scope;
    const productName = editing ? lookups.productName(editing) : undefined;
    const adding = action === "add";
    const edit: Crumb[] = editing ? [{ label: productName ? `تعديل: ${productName}` : "تعديل المنتج" }] : adding ? [{ label: "إضافة منتج" }] : [];
    if (shopId) {
      const shop: Crumb = { label: lookups.shopName(shopId) ?? "محل غير معروف", go: editing || adding ? () => pushHash("shops", shopId) : undefined };
      return [home, { label: "المحلات", go: () => pushHash("shops") }, shop, ...edit];
    }
    if (editing || adding) return [home, section(() => pushHash("products", listHash)), ...edit];
  }

  return [home, section()];
}
