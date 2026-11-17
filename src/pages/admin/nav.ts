import {
  BarChart3,
  Boxes,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LayoutGrid,
  Package,
  Percent,
  Settings,
  ShoppingCart,
  Store,
  Truck,
  Users,
  Images,
} from "lucide-react";
import type { IconType } from "./ui";

export type View =
  | "overview"
  | "orders"
  | "setupRequests"
  | "customers"
  | "shipping"
  | "payments"
  | "products"
  | "departments"
  | "shops"
  | "productRequests"
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
      { id: "setupRequests", label: "طلبات التجهيز", icon: ClipboardList },
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
      { id: "shops", label: "المحلات", icon: Store },
      { id: "productRequests", label: "طلبات المنتجات", icon: ClipboardCheck },
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

// Leaving a page that holds unconfirmed edits: the page registers a guard, and the dashboard shell registers the
// prompt that asks whether to leave. Every move to another dashboard section goes through pushHash (links, sidebar,
// breadcrumbs) or the browser's back and forward gestures; both ask first while the guard reports unsaved edits.
let leaveGuard: (() => boolean) | null = null;
// save: the page can save its edits, so the prompt offers "save and leave"; anySub: moving to another sub-page of the
// same section (e.g. from an order back to the orders list) also counts as leaving.
let leaveOptions: { save?: () => unknown; anySub?: boolean } = {};
let leavePrompt: ((proceed: () => void, save?: () => unknown) => void) | null = null;
let committedUrl = typeof window === "undefined" ? "" : window.location.href;
let passing = false;

export function registerLeaveGuard(hasUnsaved: () => boolean, options: { save?: () => unknown; anySub?: boolean } = {}) {
  leaveGuard = hasUnsaved;
  leaveOptions = options;
  return () => {
    if (leaveGuard === hasUnsaved) {
      leaveGuard = null;
      leaveOptions = {};
    }
  };
}

export function registerLeavePrompt(prompt: (proceed: () => void, save?: () => unknown) => void) {
  leavePrompt = prompt;
  return () => {
    if (leavePrompt === prompt) leavePrompt = null;
  };
}

const viewOfHash = (hash: string): View => {
  const [view = ""] = hash.replace(/^#/, "").split("/");
  return isView(view) ? view : "overview";
};
const viewOfUrl = (url: string) => viewOfHash(new URL(url, "http://x").hash);
const placeOfUrl = (url: string) => {
  const [view = "", sub = ""] = new URL(url, "http://x").hash.slice(1).split("/");
  return `${isView(view) ? view : "overview"}/${sub}`;
};
const leavesPage = (from: string, to: string) => (leaveOptions.anySub ? placeOfUrl(from) !== placeOfUrl(to) : viewOfUrl(from) !== viewOfUrl(to));

function pushHashNow(view: View, sub: string | null) {
  const hash = view === "overview" && !sub ? "" : `#${view}${sub ? `/${encodeURIComponent(sub)}` : ""}`;
  if (window.location.hash === hash) return;
  window.history.pushState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
  committedUrl = window.location.href;
  // pushState fires no event of its own; let listeners re-read the hash.
  passing = true;
  window.dispatchEvent(new PopStateEvent("popstate"));
  passing = false;
}

export function pushHash(view: View, sub: string | null = null) {
  const target = `${view}/${sub ? encodeURIComponent(sub) : ""}`;
  const here = `${readHash().view}/${readHash().sub ? encodeURIComponent(readHash().sub as string) : ""}`;
  if (leaveGuard && leavePrompt && leaveGuard() && (leaveOptions.anySub ? target !== here : view !== readHash().view)) {
    leavePrompt(() => pushHashNow(view, sub), leaveOptions.save);
    return;
  }
  pushHashNow(view, sub);
}

// Back and forward: if the move would leave a page with unconfirmed edits, put the address back and ask first.
// This listener is registered before any page's own, so pages never see the blocked move.
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    if (passing) return;
    const next = readHash();
    if (leaveGuard && leavePrompt && leaveGuard() && leavesPage(committedUrl, window.location.href)) {
      window.history.pushState(null, "", committedUrl);
      leavePrompt(() => pushHashNow(next.view, next.sub), leaveOptions.save);
      return;
    }
    committedUrl = window.location.href;
  });
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
  committedUrl = window.location.href;
}
