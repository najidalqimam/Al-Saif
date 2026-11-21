// Orders placed from the storefront checkout. They are kept in this browser until the orders table
// lands with the database in stage 3; the dashboard reads them next to its sample orders.

export type OrderStatus = "new" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type OrderLine = { id: string; name: string; qty: number; price: number };

export type Order = {
  id: string;
  /** In the dashboard's archive (saved on the order when it comes from the database). */
  archived?: boolean;
  customer: string;
  city: string;
  zone: string;
  /** First product in the order, used for the thumbnail in order tables. */
  productId: string;
  items: number;
  total: number;
  status: OrderStatus;
  date: string;
  shippingMethod: string;
  paymentMethod: "cod" | "bank";
  paymentStatus: PaymentStatus;
  /** Set on orders placed from the storefront; sample orders leave these out. */
  source?: "store";
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  lines?: OrderLine[];
  subtotal?: number;
  shippingFee?: number;
  paymentFee?: number;
  lang?: "ar" | "en" | "ur";
  /** Database orders: placed by a signed-in customer (true) or as a guest (false). */
  account?: boolean;
  /** Display-only orders of a demo shop: the shop dashboard of that shop shows them next to its real orders. */
  shopId?: string;
};

const STORAGE_KEY = "alsaif-orders";
/** Store order numbers continue after the dashboard's sample orders. */
const FIRST_NUMBER = 1049;

export function readPlacedOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is Order => Boolean(item) && typeof item.id === "string") : [];
  } catch {
    return [];
  }
}

/** Saves a new order with the next order number and returns it. */
export function placeOrder(order: Omit<Order, "id" | "date" | "status" | "paymentStatus" | "source">): Order {
  const placed = readPlacedOrders();
  const next = Math.max(FIRST_NUMBER - 1, ...placed.map((item) => Number(item.id) || 0)) + 1;
  const full: Order = { ...order, id: String(next), date: new Date().toISOString().slice(0, 10), status: "new", paymentStatus: "pending", source: "store" };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([full, ...placed]));
  return full;
}

export const ORDERS_STORAGE_KEY = STORAGE_KEY;
