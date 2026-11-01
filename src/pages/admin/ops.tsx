import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { ORDERS_STORAGE_KEY, readPlacedOrders } from "@/lib/orders-store";
import { useSiteContent } from "@/lib/site-content";
import { SAMPLE_ORDERS, type Order, type OrderStatus, type PaymentStatus } from "./orders";

// Shipping, payment and order data for the dashboard. Once the dashboard is connected to the store's database
// (useSiteContent reports source "admin"), shipping zones and methods, payment options and orders are read
// from and saved to the API, and stock and the low-stock level come from the database too. Without the API
// (a static preview) the browser copy below is used as before. Nothing here reaches any payment provider.
const STORAGE_KEY = "alsaif-admin-ops";
export const OPS_STORAGE_KEY = STORAGE_KEY;

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

/** Current shipping, payment and stock settings; the storefront checkout reads them too. */
export function readOps(): Ops {
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
  addZone: () => void;
  /** Deletes the zone for good and takes it off every shipping method. */
  removeZone: (id: string) => void;
  updatePayment: (id: PaymentMethodId, patch: Partial<PaymentMethod>) => void;
  updateBank: (patch: Partial<Ops["bank"]>) => void;
  setStock: (id: string, qty: number | null) => void;
  setLowStock: (value: number) => void;
  updateOrder: (id: string, patch: OrderEdit) => void;
  resetOps: () => void;
};

const OpsContext = createContext<OpsApi | null>(null);

type Settings = Pick<Ops, "shipping" | "zones" | "payments" | "bank">;

type ApiOrder = {
  number: number;
  status: "NEW" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentMethod: "COD" | "BANK_TRANSFER" | "ONLINE";
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerId: string | null;
  zoneCode: string;
  city: string;
  addressLine: string;
  notes: string | null;
  subtotal: string;
  shippingFee: string;
  paymentFee: string;
  total: string;
  locale: string;
  placedAt: string;
  shippingMethod: { code: string } | null;
  items: Array<{ productName: string; quantity: number; unitPrice: string; lineTotal: string; product: { legacyId: string | null } | null }>;
};

/** A database order in the shape the dashboard pages use. Its id is the real order number. */
function orderFromApi(order: ApiOrder): Order {
  const lines = order.items.map((item) => ({ id: item.product?.legacyId ?? "", name: item.productName, qty: item.quantity, price: Number(item.unitPrice) }));
  return {
    id: String(order.number),
    customer: order.customerName,
    city: order.city,
    zone: order.zoneCode,
    productId: lines[0]?.id ?? "",
    items: lines.reduce((sum, line) => sum + line.qty, 0),
    total: Number(order.total),
    status: order.status.toLowerCase() as OrderStatus,
    date: new Date(order.placedAt).toLocaleDateString("en-CA"),
    shippingMethod: order.shippingMethod?.code ?? "",
    paymentMethod: order.paymentMethod === "BANK_TRANSFER" ? "bank" : "cod",
    paymentStatus: order.paymentStatus.toLowerCase() as PaymentStatus,
    source: "store",
    phone: order.customerPhone,
    email: order.customerEmail ?? undefined,
    address: order.addressLine,
    notes: order.notes ?? undefined,
    lines,
    subtotal: Number(order.subtotal),
    shippingFee: Number(order.shippingFee),
    paymentFee: Number(order.paymentFee),
    lang: order.locale === "en" ? "en" : "ar",
    account: order.customerId !== null,
  };
}

export function OpsProvider({ children }: { children: ReactNode }) {
  const [ops, setOps] = useState<Ops>(readOps);
  const [placed, setPlaced] = useState<Order[]>(readPlacedOrders);
  const { content, catalogue, setStock: saveStock, setLowStock: saveLowStock } = useSiteContent();
  const fromDatabase = catalogue.source === "admin";
  // Database copies, used while connected: checkout settings and real orders.
  const [settings, setSettings] = useState<Settings | null>(null);
  const [dbOrders, setDbOrders] = useState<Order[] | null>(null);
  const settingsTimer = useRef(0);

  useEffect(() => {
    if (!fromDatabase) return;
    let cancelled = false;
    api<{ configured: boolean; settings: Settings }>("/admin/checkout-settings")
      .then(async (result) => {
        if (result.configured) {
          if (!cancelled) setSettings({ ...result.settings, payments: mergePayments(result.settings.payments) });
          return;
        }
        // First connection: the settings made in this dashboard so far become the store's settings.
        const local = readOps();
        const initial: Settings = { shipping: local.shipping, zones: local.zones, payments: local.payments, bank: local.bank };
        await api("/admin/checkout-settings", { method: "PUT", body: initial });
        if (!cancelled) setSettings(initial);
      })
      .catch(() => {
        // The settings stay on the browser copy if the API refuses (e.g. a role without access).
      });
    return () => {
      cancelled = true;
    };
  }, [fromDatabase]);

  const loadOrders = useCallback(() => {
    api<{ orders: ApiOrder[] }>("/admin/orders?limit=100")
      .then((result) => setDbOrders(result.orders.map(orderFromApi)))
      .catch(() => undefined);
  }, []);

  // Real orders, refreshed every 20 seconds so new orders and status changes show up on their own.
  useEffect(() => {
    if (!fromDatabase) return;
    loadOrders();
    const timer = window.setInterval(loadOrders, 20_000);
    return () => window.clearInterval(timer);
  }, [fromDatabase, loadOrders]);

  const changeSettings = useCallback((change: (current: Settings) => Settings) => {
    setSettings((current) => {
      if (!current) return current;
      const next = change(current);
      window.clearTimeout(settingsTimer.current);
      settingsTimer.current = window.setTimeout(() => {
        void api("/admin/checkout-settings", { method: "PUT", body: next }).catch(() => undefined);
      }, 600);
      return next;
    });
  }, []);

  // Orders and stock changes made by the storefront in another tab show up without a reload.
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === ORDERS_STORAGE_KEY) setPlaced(readPlacedOrders());
      if (event.key === STORAGE_KEY) setOps(readOps());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ops));
    } catch {
      // Storage can be blocked; the dashboard keeps working for this visit.
    }
  }, [ops]);

  const value = useMemo<OpsApi>(() => {
    const remote = fromDatabase && settings !== null;
    // Connected: the real orders from the database (numbered from 1001). Otherwise the browser's store orders
    // and the sample orders, with the dashboard's local edits applied.
    const orders = fromDatabase && dbOrders !== null ? dbOrders : [...placed, ...SAMPLE_ORDERS].map((order) => ({ ...order, ...ops.orders[order.id] }));
    const stock: Record<string, number> = {};
    for (const item of content.products) if (typeof item.stock === "number") stock[item.id] = item.stock;
    const edit = <K extends keyof Settings>(key: K, change: (list: Settings[K]) => Settings[K]) =>
      remote ? changeSettings((current) => ({ ...current, [key]: change(current[key]) })) : setOps((current) => ({ ...current, [key]: change(current[key]) }));
    return {
      ops: fromDatabase ? { ...ops, ...(settings ?? {}), stock, lowStock: catalogue.lowStock } : ops,
      orders,
      updateShipping: (id, patch) => edit("shipping", (list) => list.map((item) => (item.id === id ? { ...item, ...patch } : item))),
      updateZone: (id, patch) => edit("zones", (list) => list.map((item) => (item.id === id ? { ...item, ...patch } : item))),
      addZone: () => {
        const id = `zone-${Date.now().toString(36)}`;
        edit("zones", (list) => [...list, { id, nameAr: "منطقة جديدة", cities: "", enabled: true }]);
      },
      removeZone: (id) => {
        if (remote) {
          changeSettings((current) => ({
            ...current,
            zones: current.zones.filter((item) => item.id !== id),
            shipping: current.shipping.map((method) => ({ ...method, zones: method.zones.filter((zone) => zone !== id) })),
          }));
          return;
        }
        setOps((current) => ({
          ...current,
          zones: current.zones.filter((item) => item.id !== id),
          shipping: current.shipping.map((method) => ({ ...method, zones: method.zones.filter((zone) => zone !== id) })),
        }));
      },
      updatePayment: (id, patch) =>
        edit("payments", (list) => list.map((item) => (item.id === id ? { ...item, ...patch, enabled: id === "online" ? false : (patch.enabled ?? item.enabled) } : item))),
      updateBank: (patch) => edit("bank", (current) => ({ ...current, ...patch })),
      setStock: (id, qty) =>
        fromDatabase
          ? saveStock(id, qty)
          : setOps((current) => {
          const stock = { ...current.stock };
          if (qty === null || !Number.isFinite(qty)) delete stock[id];
          else stock[id] = Math.max(0, Math.floor(qty));
          return { ...current, stock };
        }),
      setLowStock: (value) => (fromDatabase ? saveLowStock(value) : setOps((current) => ({ ...current, lowStock: Math.max(0, Math.floor(value) || 0) }))),
      updateOrder: (id, patch) => {
        if (!(fromDatabase && dbOrders !== null)) {
          setOps((current) => ({ ...current, orders: { ...current.orders, [id]: { ...current.orders[id], ...patch } } }));
          return;
        }
        // Database orders: the order status and payment status are saved through the API (with their history);
        // the shipping method of a placed order is not changed from here.
        const body: Record<string, string> = {};
        if (patch.status) body.status = patch.status.toUpperCase();
        if (patch.paymentStatus) body.paymentStatus = patch.paymentStatus.toUpperCase();
        if (!Object.keys(body).length) return;
        setDbOrders((current) => current && current.map((order) => (order.id === id ? { ...order, ...(patch.status ? { status: patch.status } : {}), ...(patch.paymentStatus ? { paymentStatus: patch.paymentStatus } : {}) } : order)));
        void api(`/admin/orders/${encodeURIComponent(id)}/status`, { method: "PATCH", body }).finally(loadOrders);
      },
      resetOps: () => setOps(defaultOps()),
    };
  }, [ops, placed, content.products, catalogue.lowStock, fromDatabase, saveStock, saveLowStock, settings, dbOrders, changeSettings, loadOrders]);

  return <OpsContext.Provider value={value}>{children}</OpsContext.Provider>;
}

/** Takes ordered quantities off the recorded stock; products without a recorded quantity are left alone. */
export function deductStock(lines: Array<{ id: string; qty: number }>) {
  const ops = readOps();
  let changed = false;
  for (const line of lines) {
    if (ops.stock[line.id] === undefined) continue;
    ops.stock[line.id] = Math.max(0, ops.stock[line.id] - line.qty);
    changed = true;
  }
  if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(ops));
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

/** The dashboard always lists all three payment options, whatever the database returned. */
function mergePayments(saved: PaymentMethod[]) {
  return defaultOps().payments.map((item) => ({ ...item, ...saved.find((row) => row.id === item.id) }));
}
