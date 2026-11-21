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

const line = (id: string, name: string, qty: number, price: number) => ({ id, name, qty, price });

// Display-only orders of the demo shop "الرياض للإلكترونيات" (demo-shop-1), so its dashboard has something to show:
// every order status and every payment status appears at least once. They are never sent to the server.
export const DEMO_SHOP_ORDERS: Order[] = [
  { id: "R108", customer: "تركي الزهراني", city: "الخبر", zone: "eastern", productId: "storage", items: 1, total: 349, status: "delivered", date: "2026-11-13", shippingMethod: "standard", paymentMethod: "cod", paymentStatus: "paid", phone: "0561230008", address: "حي العقربية، شارع الأمير فيصل", lines: [line("storage", "وحدة تخزين خارجية 1 تيرا", 1, 349)], subtotal: 349, shopId: "demo-shop-1" },
  { id: "R106", customer: "ريم المطيري", city: "المدينة", zone: "western", productId: "earbuds", items: 2, total: 378, status: "cancelled", date: "2026-11-14", shippingMethod: "standard", paymentMethod: "bank", paymentStatus: "refunded", phone: "0561230006", address: "حي العزيزية، شارع سلطانة", lines: [line("earbuds", "سماعات لاسلكية", 2, 189)], subtotal: 378, shopId: "demo-shop-1" },
  { id: "R105", customer: "خالد الدوسري", city: "مكة", zone: "western", productId: "screen", items: 1, total: 899, status: "delivered", date: "2026-11-15", shippingMethod: "standard", paymentMethod: "bank", paymentStatus: "paid", phone: "0561230005", address: "حي الشوقية، طريق الحرم", lines: [line("screen", "شاشة 24 بوصة", 1, 899)], subtotal: 899, shopId: "demo-shop-1" },
  { id: "R103", customer: "سارة الشمري", city: "الرياض", zone: "central", productId: "headset", items: 3, total: 837, status: "shipped", date: "2026-11-17", shippingMethod: "express", paymentMethod: "cod", paymentStatus: "pending", phone: "0561230003", address: "حي الملقا، طريق أنس بن مالك", lines: [line("headset", "سماعة رأس للألعاب", 3, 279)], subtotal: 837, shopId: "demo-shop-1" },
  { id: "R102", customer: "نورة القحطاني", city: "جدة", zone: "western", productId: "phone", items: 1, total: 999, status: "processing", date: "2026-11-17", shippingMethod: "standard", paymentMethod: "bank", paymentStatus: "paid", phone: "0561230002", address: "حي الروضة، شارع التحلية", lines: [line("phone", "جوال شاشة 6.7 بوصة", 1, 999)], subtotal: 999, shopId: "demo-shop-1" },
  { id: "R107", customer: "منيرة السبيعي", city: "الرياض", zone: "central", productId: "phone", items: 1, total: 999, status: "processing", date: "2026-11-18", shippingMethod: "standard", paymentMethod: "bank", paymentStatus: "failed", phone: "0561230007", address: "حي النرجس، طريق الملك سلمان", lines: [line("phone", "جوال شاشة 6.7 بوصة", 1, 999)], subtotal: 999, shopId: "demo-shop-1" },
  { id: "R101", customer: "عبدالله الحربي", city: "الرياض", zone: "central", productId: "console", items: 2, total: 1898, status: "delivered", date: "2026-11-18", shippingMethod: "express", paymentMethod: "cod", paymentStatus: "paid", phone: "0561230001", address: "حي العليا، طريق الملك فهد", lines: [line("console", "جهاز بلايستيشن مع يد تحكم", 2, 949)], subtotal: 1898, shopId: "demo-shop-1" },
  { id: "R104", customer: "فهد العتيبي", city: "الدمام", zone: "eastern", productId: "controller", items: 2, total: 498, status: "new", date: "2026-11-19", shippingMethod: "standard", paymentMethod: "cod", paymentStatus: "pending", phone: "0561230004", address: "حي الشاطئ، شارع الأمير محمد", lines: [line("controller", "يد تحكم لاسلكية", 2, 249)], subtotal: 498, shopId: "demo-shop-1" },
];
