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
  Images,
} from "lucide-react";
import type { IconType } from "./ui";

export type View =
  | "overview"
  | "orders"
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
      { id: "orders", label: "الطلبات", icon: ShoppingCart, demo: true },
      { id: "shipping", label: "الشحن والتوصيل", icon: Truck },
      { id: "payments", label: "المدفوعات", icon: CreditCard },
    ],
  },
  {
    label: "الكتالوج",
    items: [
      { id: "products", label: "المنتجات", icon: Package },
      { id: "departments", label: "التصنيفات", icon: LayoutGrid },
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
