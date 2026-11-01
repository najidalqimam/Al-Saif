import {
  BarChart3,
  Boxes,
  CreditCard,
  LayoutDashboard,
  LayoutGrid,
  Package,
  Percent,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Images,
} from "lucide-react";
import type { IconType } from "./ui";

export type View =
  | "overview"
  | "orders"
  | "customers"
  | "shipping"
  | "payments"
  | "products"
  | "departments"
  | "inventory"
  | "offers"
  | "content"
  | "reports"
  | "settings";

export type NavItem = { id: View; label: string; icon: IconType; demo?: boolean };

export const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "الرئيسية",
    items: [{ id: "overview", label: "نظرة عامة", icon: LayoutDashboard }],
  },
  {
    label: "المبيعات",
    items: [
      { id: "orders", label: "الطلبات", icon: ShoppingCart },
      { id: "customers", label: "العملاء", icon: Users },
      { id: "shipping", label: "الشحن والتوصيل", icon: Truck },
      { id: "payments", label: "المدفوعات", icon: CreditCard },
    ],
  },
  {
    label: "الكتالوج",
    items: [
      { id: "products", label: "المنتجات", icon: Package },
      { id: "departments", label: "الأقسام", icon: LayoutGrid },
      { id: "inventory", label: "المخزون", icon: Boxes },
      { id: "offers", label: "العروض والخصومات", icon: Percent },
    ],
  },
  {
    label: "المتجر",
    items: [
      { id: "content", label: "المحتوى والوسائط", icon: Images },
      { id: "reports", label: "التقارير", icon: BarChart3, demo: true },
      { id: "settings", label: "إعدادات المتجر", icon: Settings },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

export function isView(value: string): value is View {
  return NAV_ITEMS.some((item) => item.id === value);
}

// The dashboard location lives in the URL hash: #view or #view/sub (e.g. #departments/gaming).
// Every move is pushed as a browser history entry, so the back gesture walks back through the
// dashboard instead of leaving it, and a refresh reopens the same place.

export function readHash(): { view: View; sub: string | null } {
  const [view = "", sub] = window.location.hash.slice(1).split("/");
  return isView(view) ? { view, sub: sub ? decodeURIComponent(sub) : null } : { view: "overview", sub: null };
}

export function pushHash(view: View, sub: string | null = null) {
  const hash = view === "overview" && !sub ? "" : `#${view}${sub ? `/${encodeURIComponent(sub)}` : ""}`;
  if (window.location.hash === hash) return;
  window.history.pushState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
  // pushState fires no event of its own; let listeners re-read the hash.
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/** Calls back whenever the dashboard location changes, including the browser back and forward gestures. */
export function onHashMove(listener: () => void) {
  window.addEventListener("popstate", listener);
  window.addEventListener("hashchange", listener);
  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener("hashchange", listener);
  };
}

/** Rewrites the current history entry, e.g. to drop a one-off "/add" once its form closes. */
export function replaceHash(view: View, sub: string | null = null) {
  const hash = view === "overview" && !sub ? "" : `#${view}${sub ? `/${encodeURIComponent(sub)}` : ""}`;
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
}
