import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { SAMPLE_ORDERS, type Order, type OrderStatus, type PaymentStatus } from "./orders";

// Shipping, payment, stock and order edits made in the dashboard. They live in this browser only
// until the database lands in stage 3, and nothing here reaches the storefront or any provider.
const STORAGE_KEY = "alsaif-admin-ops";

export type ShippingMethod = {
  id: string;
  nameAr: string;
  nameEn: string;
  enabled: boolean;
  fee: number;
  /** Order total at which shipping becomes free; null means never free. */
  freeOver: number | null;
  minOrder: number | null;
  etaMin: number;
  etaMax: number;
  zones: string[];
};

export type Zone = { id: string; nameAr: string; cities: string; enabled: boolean };

export type PaymentMethodId = "cod" | "bank" | "online";

export type PaymentMethod = {
  id: PaymentMethodId;
  enabled: boolean;
  /** Extra fee the customer pays for this method, in SAR. */
  fee: number;
  note: string;
};

export type OrderEdit = Partial<Pick<Order, "status" | "shippingMethod" | "paymentStatus">>;

export type Ops = {
  shipping: ShippingMethod[];
  zones: Zone[];
  payments: PaymentMethod[];
  bank: { bankName: string; holder: string };
  stock: Record<string, number>;
  lowStock: number;
  orders: Record<string, OrderEdit>;
};

export const PAYMENT_LABELS: Record<PaymentMethodId, { ar: string; en: string; lead: string }> = {
  cod: { ar: "الدفع عند الاستلام", en: "Cash on delivery", lead: "يدفع العميل نقدًا أو بالشبكة لمندوب التوصيل." },
  bank: { ar: "تحويل بنكي", en: "Bank transfer", lead: "يحوّل العميل المبلغ ويتأكد الفريق من وصوله قبل الشحن." },
  online: { ar: "الدفع الإلكتروني", en: "Online payment", lead: "مدى وفيزا وأبل باي عبر بوابة دفع. يحتاج ربط مزود دفع حقيقي." },
};

export function defaultOps(): Ops {
  return {
    shipping: [
      { id: "standard", nameAr: "توصيل عادي", nameEn: "Standard delivery", enabled: true, fee: 25, freeOver: 300, minOrder: null, etaMin: 3, etaMax: 5, zones: ["central", "western", "eastern", "other"] },
      { id: "express", nameAr: "توصيل سريع", nameEn: "Express delivery", enabled: true, fee: 45, freeOver: null, minOrder: null, etaMin: 1, etaMax: 2, zones: ["central", "western", "eastern"] },
      { id: "pickup", nameAr: "استلام من الفرع", nameEn: "Store pickup", enabled: false, fee: 0, freeOver: null, minOrder: null, etaMin: 0, etaMax: 1, zones: ["central"] },
    ],
    zones: [
      { id: "central", nameAr: "المنطقة الوسطى", cities: "الرياض، القصيم", enabled: true },
      { id: "western", nameAr: "المنطقة الغربية", cities: "جدة، مكة، المدينة", enabled: true },
      { id: "eastern", nameAr: "المنطقة الشرقية", cities: "الدمام، الخبر، الأحساء", enabled: true },
      { id: "other", nameAr: "باقي المناطق", cities: "الشمال والجنوب", enabled: true },
    ],
    payments: [
      { id: "cod", enabled: true, fee: 0, note: "" },
      { id: "bank", enabled: true, fee: 0, note: "" },
      { id: "online", enabled: false, fee: 0, note: "" },
    ],
    bank: { bankName: "", holder: "" },
    stock: {},
    lowStock: 5,
    orders: {},
  };
}

function load(): Ops {
  const base = defaultOps();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Partial<Ops>;
    const payments = base.payments.map((item) => ({ ...item, ...saved.payments?.find((row) => row.id === item.id) }));
    // Online payment stays off until a real gateway is connected, whatever was saved.
    const online = payments.find((item) => item.id === "online");
    if (online) online.enabled = false;
    return {
      ...base,
      ...saved,
      payments,
      bank: { ...base.bank, ...saved.bank },
      stock: saved.stock ?? {},
      orders: saved.orders ?? {},
    };
  } catch {
    return base;
  }
}

type OpsApi = {
  ops: Ops;
  orders: Order[];
  updateShipping: (id: string, patch: Partial<ShippingMethod>) => void;
  updateZone: (id: string, patch: Partial<Zone>) => void;
  updatePayment: (id: PaymentMethodId, patch: Partial<PaymentMethod>) => void;
  updateBank: (patch: Partial<Ops["bank"]>) => void;
  setStock: (id: string, qty: number | null) => void;
  setLowStock: (value: number) => void;
  updateOrder: (id: string, patch: OrderEdit) => void;
  resetOps: () => void;
};

const OpsContext = createContext<OpsApi | null>(null);

export function OpsProvider({ children }: { children: ReactNode }) {
  const [ops, setOps] = useState<Ops>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ops));
    } catch {
      // Storage can be blocked; the dashboard keeps working for this visit.
    }
  }, [ops]);

  const api = useMemo<OpsApi>(() => {
    const orders = SAMPLE_ORDERS.map((order) => ({ ...order, ...ops.orders[order.id] }));
    return {
      ops,
      orders,
      updateShipping: (id, patch) => setOps((current) => ({ ...current, shipping: current.shipping.map((item) => (item.id === id ? { ...item, ...patch } : item)) })),
      updateZone: (id, patch) => setOps((current) => ({ ...current, zones: current.zones.map((item) => (item.id === id ? { ...item, ...patch } : item)) })),
      updatePayment: (id, patch) =>
        setOps((current) => ({
          ...current,
          payments: current.payments.map((item) => (item.id === id ? { ...item, ...patch, enabled: id === "online" ? false : (patch.enabled ?? item.enabled) } : item)),
        })),
      updateBank: (patch) => setOps((current) => ({ ...current, bank: { ...current.bank, ...patch } })),
      setStock: (id, qty) =>
        setOps((current) => {
          const stock = { ...current.stock };
          if (qty === null || !Number.isFinite(qty)) delete stock[id];
          else stock[id] = Math.max(0, Math.floor(qty));
          return { ...current, stock };
        }),
      setLowStock: (value) => setOps((current) => ({ ...current, lowStock: Math.max(0, Math.floor(value) || 0) })),
      updateOrder: (id, patch) => setOps((current) => ({ ...current, orders: { ...current.orders, [id]: { ...current.orders[id], ...patch } } })),
      resetOps: () => setOps(defaultOps()),
    };
  }, [ops]);

  return <OpsContext.Provider value={api}>{children}</OpsContext.Provider>;
}

export function useOps() {
  const api = useContext(OpsContext);
  if (!api) throw new Error("useOps must be used inside OpsProvider");
  return api;
}

export type ShipStage = "awaiting" | "shipped" | "delivered" | "cancelled";

export function shipStage(status: OrderStatus): ShipStage {
  if (status === "new" || status === "processing") return "awaiting";
  return status;
}

export const SHIP_STAGE: Record<ShipStage, { label: string; tone: "warn" | "blue" | "ok" | "danger" }> = {
  awaiting: { label: "بانتظار الشحن", tone: "warn" },
  shipped: { label: "تم الشحن", tone: "blue" },
  delivered: { label: "تم التسليم", tone: "ok" },
  cancelled: { label: "ملغي", tone: "danger" },
};

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; tone: "warn" | "ok" | "danger" | "muted" }> = {
  pending: { label: "بانتظار الدفع", tone: "warn" },
  paid: { label: "مدفوع", tone: "ok" },
  failed: { label: "فشل الدفع", tone: "danger" },
  refunded: { label: "مسترجع", tone: "muted" },
};

export type StockLevel = "unset" | "out" | "low" | "ok";

export function stockLevel(qty: number | undefined, low: number): StockLevel {
  if (qty === undefined) return "unset";
  if (qty === 0) return "out";
  if (qty <= low) return "low";
  return "ok";
}

export const STOCK_LEVEL: Record<StockLevel, { label: string; tone: "muted" | "danger" | "warn" | "ok" }> = {
  unset: { label: "غير مسجّل", tone: "muted" },
  out: { label: "نفد", tone: "danger" },
  low: { label: "منخفض", tone: "warn" },
  ok: { label: "متوفر", tone: "ok" },
};
