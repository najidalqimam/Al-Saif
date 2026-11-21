// Calls to the store's backend API (server/). In development Vite forwards /api to it (vite.config.ts), so the
// admin session cookie stays same-origin. A static build without a backend simply gets no answer, and the
// storefront then keeps using its built-in catalogue.

const BASE = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "");

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly body: Record<string, unknown>;

  constructor(status: number, code: string, body: Record<string, unknown> = {}) {
    super(code);
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

/** Fired when the server says the admin session is gone, so the dashboard can show the login again. */
export const UNAUTHORIZED_EVENT = "alsaif:unauthorized";

// A shop account signs in through the same login as the dashboard but may only use the /api/shop routes. While a shop
// dashboard is open, the dashboard's requests (written for /admin/...) are sent to the matching /shop/... route.
let dashboardScope: "admin" | "shop" = "admin";
/** True while the shop dashboard is open (a shop account: its orders are read only). */
export const inShopScope = () => dashboardScope === "shop";
export function setDashboardScope(scope: "admin" | "shop") {
  dashboardScope = scope;
}
function scopedPath(path: string) {
  if (dashboardScope !== "shop" || !path.startsWith("/admin/") || path.startsWith("/admin/auth")) return path;
  if (/^\/admin\/shops\/[^/]+$/.test(path)) return "/shop/shop";
  return path.replace(/^\/admin\/(catalogue|products|orders|checkout-settings|notifications)/, "/shop/$1");
}

/** Local preview: no API or database; the dashboard runs on browser data. Only in `pnpm dev` with VITE_ADMIN_PREVIEW=1. */
export const PREVIEW = import.meta.env.DEV && import.meta.env.VITE_ADMIN_PREVIEW === "1";

const day = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const DEMO_CUSTOMERS = [
  ["c1", "أحمد", "العتيبي", "0501234567", "ahmed@example.com", 3, 2, "3233.00", 2],
  ["c2", "سارة", "القحطاني", "0559876543", "sara@example.com", 2, 2, "1898.00", 5],
  ["c3", "خالد", "الشمري", "0533344455", "khaled@example.com", 0, 0, "0.00", 9],
  // The demo account used while building the store (also saved in the local database).
  ["c4", "عميل", "تجريبي", "0500000001", "demo.customer@alsaif.local", 0, 1, "0.00", 0],
].map(([id, firstName, lastName, phone, email, orders, addresses, spent, ago]) => ({
  id, firstName, lastName, phone, email, avatar: null, createdAt: day(Number(ago) + 20), lastLoginAt: day(Number(ago)), orders, addresses, spent,
  lastOrderAt: Number(orders) ? day(Number(ago)) : null, welcomeEmail: null,
}));

function previewApi(path: string): unknown {
  if (path.startsWith("/admin/customers/")) {
    const id = decodeURIComponent(path.split("/")[3].split("?")[0]);
    // The demo customers own some of the sample orders (same numbers), so their page can list them with products and shops.
    const owned: Record<string, number[]> = { c1: [1048, 1045, 1042], c2: [1047, 1046] };
    const orders = (owned[id] ?? []).map((number) => ({ number, status: "NEW", paymentStatus: "PENDING", paymentMethod: "COD", total: "0", placedAt: day(number - 1040), lines: 1 }));
    const addresses =
      id === "c4"
        ? [{ id: "a3", label: "العمل", zoneName: "المنطقة الوسطى", city: "جدة", line1: "١١١١", notes: "", isDefault: true }]
        : id === "c2"
        ? [
            { id: "a1", label: "المنزل", zoneName: "المنطقة الوسطى", city: "الرياض", line1: "حي النرجس، شارع الأمير سلطان، مبنى 12", notes: "", isDefault: true },
            { id: "a2", label: "العمل", zoneName: "المنطقة الوسطى", city: "الرياض", line1: "حي العليا، طريق الملك فهد، برج 4", notes: "الدور الثالث", isDefault: false },
          ]
        : [];
    return { customer: DEMO_CUSTOMERS.find((row) => row.id === id) ?? DEMO_CUSTOMERS[0], addresses, orders };
  }
  if (path.startsWith("/admin/customers")) return { customers: DEMO_CUSTOMERS, total: DEMO_CUSTOMERS.length, guestOrders: 2 };
  throw new ApiError(0, "NO_API");
}


/**
 * Preview only: the demo customer "c4" is the test account of whoever is signed in to the storefront in this
 * browser, so its name and addresses follow the real account instead of staying fixed. Without a session the
 * demo values are kept.
 */
async function withLiveTestAccount(path: string, data: unknown): Promise<unknown> {
  if (!path.startsWith("/admin/customers")) return data;
  try {
    const [me, saved] = await Promise.all([
      fetch(`${BASE}/account/me`, { credentials: "same-origin" }).then((res) => (res.ok ? res.json() : Promise.reject(new Error("no session")))),
      fetch(`${BASE}/account/addresses`, { credentials: "same-origin" }).then((res) => (res.ok ? res.json() : Promise.reject(new Error("no session")))),
    ]);
    const customer = me.customer as Record<string, unknown>;
    const addresses = saved.addresses as Array<Record<string, unknown>>;
    const live = { firstName: customer.firstName, lastName: customer.lastName, phone: customer.phone, email: customer.email, avatar: customer.avatar ?? null };
    const body = data as { customers?: Array<Record<string, unknown>>; customer?: Record<string, unknown>; addresses?: unknown[] };
    if (body.customers) return { ...body, customers: body.customers.map((row) => (row.id === "c4" ? { ...row, ...live, addresses: addresses.length } : row)) };
    if (body.customer?.id === "c4") return { ...body, customer: { ...body.customer, ...live, addresses: addresses.length }, addresses };
  } catch {
    // Not signed in (or no API): keep the demo values.
  }
  return data;
}

export async function api<T>(path: string, init: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  // Preview only stands in for the dashboard; customer accounts and checkout options still use the real API.
  if (PREVIEW && !path.startsWith("/account") && !path.startsWith("/checkout")) return (await withLiveTestAccount(path, previewApi(path))) as T;
  let res: Response;
  try {
    res = await fetch(`${BASE}${scopedPath(path)}`, {
      method: init.method ?? (init.body === undefined ? "GET" : "POST"),
      headers: {
        ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
        // The shop dashboard keeps its session in its own cookie, so it can be open next to the admin dashboard.
        ...(dashboardScope === "shop" ? { "X-Dashboard": "shop" } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      credentials: "same-origin",
      signal: init.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "NETWORK");
  }
  const text = await res.text();
  // The dev proxy answers 5xx with an empty body when the API process is not running.
  if (!res.ok && res.status >= 500 && !text.trim()) throw new ApiError(0, "NETWORK");
  let json: Record<string, unknown> = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    // An HTML page (no backend behind /api, e.g. a static host) is treated as "API not available".
    throw new ApiError(res.status || 0, "NO_API");
  }
  if (!res.ok) {
    if (res.status === 401 && path.startsWith("/admin/") && !path.startsWith("/admin/auth/login")) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    throw new ApiError(res.status, typeof json.error === "string" ? json.error : "ERROR", json);
  }
  return json as T;
}

const MESSAGES: Record<string, string> = {
  NETWORK: "ما قدرنا نوصل للخادم. تأكد أن الخادم شغّال وحاول مرة ثانية.",
  NO_API: "الخادم غير متاح من هذا الرابط.",
  UNAUTHENTICATED: "انتهت الجلسة. سجّل دخولك مرة ثانية.",
  FORBIDDEN_ROLE: "صلاحيتك ما تسمح بهذا التعديل.",
  FORBIDDEN_ORIGIN: "الطلب مرفوض من هذا الرابط.",
  INVALID_INPUT: "بعض القيم غير صحيحة. راجع الحقول وحاول مرة ثانية.",
  INVALID_IMAGE: "الصورة غير صالحة. اختر ملف PNG أو JPG أو WebP أصغر من 1 ميجا.",
  PRODUCT_NOT_FOUND: "المنتج غير موجود.",
  SHOP_NOT_FOUND: "المحل غير موجود.",
  INVALID_WHOLESALE_PRICE: "سعر الجملة لازم يكون رقمًا أكبر من صفر وأقل من سعر البيع الحالي.",
  CATEGORY_NOT_FOUND: "القسم غير موجود.",
  CATEGORY_ARCHIVED: "القسم مؤرشف. استرجعه أول أو اختر قسم ثاني.",
  CATEGORY_TOO_DEEP: "المتجر فيه أقسام رئيسية فقط، فما تقدر تضيف قسم داخل قسم.",
  PARENT_ARCHIVED: "القسم الرئيسي مؤرشف. استرجعه أول.",
  STOCK_CHANGED: "الكمية تغيّرت (طلب جديد أو تعديل من مكان ثاني). حدّثنا الأرقام، أدخل الكمية مرة ثانية.",
  TOO_MANY_ATTEMPTS: "محاولات كثيرة. انتظر شوي وحاول مرة ثانية.",
  EMAIL_TAKEN: "هذا البريد مسجّل من قبل. سجّل دخولك أو استخدم بريدًا ثانيًا.",
  WEAK_PASSWORD: "كلمة السر ضعيفة. استخدم 12 حرفًا على الأقل.",
  SHOP_PENDING: "طلب انضمام محلك وصل للإدارة وينتظر الموافقة. بنقدر ندخلك بعد ما توافق عليه.",
  SHOP_SUSPENDED: "هذا المحل موقوف. تواصل مع الإدارة.",
  SHOP_REJECTED: "للأسف ما تمت الموافقة على طلب انضمام المحل. تواصل مع الإدارة.",
  INVALID_CREDENTIALS: "البريد الإلكتروني أو كلمة السر غير صحيحة.",
};

/** Arabic message for the dashboard. */
export function apiMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "CATEGORY_NOT_EMPTY") {
      const parts = [Number(error.body.children) ? `${error.body.children} أقسام فرعية` : "", Number(error.body.products) ? `${error.body.products} منتجات` : ""].filter(Boolean);
      return `ما نقدر نؤرشف القسم وفيه ${parts.join(" و")}. انقلها أو أرشفها أول.`;
    }
    return MESSAGES[error.code] ?? "صار خطأ في الحفظ. حاول مرة ثانية.";
  }
  return "صار خطأ غير متوقع. حاول مرة ثانية.";
}
