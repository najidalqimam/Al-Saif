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

export async function api<T>(path: string, init: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: init.method ?? (init.body === undefined ? "GET" : "POST"),
      headers: init.body === undefined ? undefined : { "Content-Type": "application/json" },
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
  CATEGORY_NOT_FOUND: "القسم غير موجود.",
  CATEGORY_ARCHIVED: "القسم مؤرشف. استرجعه أول أو اختر قسم ثاني.",
  CATEGORY_TOO_DEEP: "الأقسام الجديدة تكون قسم رئيسي أو قسم فرعي داخله فقط.",
  PARENT_ARCHIVED: "القسم الرئيسي مؤرشف. استرجعه أول.",
  STOCK_CHANGED: "الكمية تغيّرت (طلب جديد أو تعديل من مكان ثاني). حدّثنا الأرقام، أدخل الكمية مرة ثانية.",
  TOO_MANY_ATTEMPTS: "محاولات كثيرة. انتظر شوي وحاول مرة ثانية.",
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
