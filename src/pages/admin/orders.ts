// Placeholder orders for the dashboard until the orders table exists in Supabase (stage 3).

import type { Order, OrderStatus } from "@/lib/orders-store";

export type { Order, OrderLine, OrderStatus, PaymentStatus } from "@/lib/orders-store";

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: "accent" | "blue" | "ok" | "warn" | "danger" }> = {
  // Orange = waiting for someone to act, blue = moving along, green = done, red = stopped.
  new: { label: "جديد", tone: "warn" },
  processing: { label: "قيد التجهيز", tone: "blue" },
  shipped: { label: "تم الشحن", tone: "blue" },
  delivered: { label: "تم التسليم", tone: "ok" },
  cancelled: { label: "ملغي", tone: "danger" },
};

export const SAMPLE_ORDERS: Order[] = [
  { id: "1048", customer: "عبدالله الحربي", city: "الرياض", zone: "central", productId: "console", items: 2, total: 1898, status: "new", date: "2026-10-28", shippingMethod: "express", paymentMethod: "cod", paymentStatus: "pending" },
  { id: "1047", customer: "نورة القحطاني", city: "جدة", zone: "western", productId: "phone", items: 1, total: 999, status: "processing", date: "2026-10-28", shippingMethod: "standard", paymentMethod: "bank", paymentStatus: "paid" },
  { id: "1046", customer: "فهد العتيبي", city: "الدمام", zone: "eastern", productId: "screen", items: 1, total: 899, status: "shipped", date: "2026-10-27", shippingMethod: "standard", paymentMethod: "bank", paymentStatus: "paid" },
  { id: "1045", customer: "سارة الشمري", city: "الرياض", zone: "central", productId: "headset", items: 3, total: 837, status: "delivered", date: "2026-10-27", shippingMethod: "express", paymentMethod: "cod", paymentStatus: "paid" },
  { id: "1044", customer: "خالد الدوسري", city: "مكة", zone: "western", productId: "storage", items: 1, total: 349, status: "delivered", date: "2026-10-26", shippingMethod: "standard", paymentMethod: "cod", paymentStatus: "paid" },
  { id: "1043", customer: "ريم المطيري", city: "المدينة", zone: "western", productId: "earbuds", items: 2, total: 378, status: "cancelled", date: "2026-10-26", shippingMethod: "standard", paymentMethod: "bank", paymentStatus: "refunded" },
  { id: "1042", customer: "تركي الزهراني", city: "الخبر", zone: "eastern", productId: "controller", items: 2, total: 498, status: "delivered", date: "2026-10-25", shippingMethod: "standard", paymentMethod: "cod", paymentStatus: "paid" },
  { id: "1041", customer: "منيرة السبيعي", city: "الرياض", zone: "central", productId: "phone", items: 1, total: 999, status: "processing", date: "2026-10-24", shippingMethod: "standard", paymentMethod: "bank", paymentStatus: "failed" },
];
