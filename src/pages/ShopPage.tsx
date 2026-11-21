import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Archive, BarChart3, Boxes, ClipboardCheck, Eye, EyeOff, CreditCard, ExternalLink, LayoutDashboard, LoaderCircle, LogIn, LogOut, Menu, Moon, Package, Percent, Settings, ShoppingCart, Store, Sun, Users, X } from "lucide-react";
import { BrandMark } from "@/components/site/Brand";
import { PREVIEW, UNAUTHORIZED_EVENT, api, apiMessage, setDashboardScope } from "@/lib/api";
import { currentAdmin, loginAdmin, logoutAdmin, type AdminUser } from "@/lib/admin-auth";
import { announceChange } from "@/lib/live-sync";
import { useSiteContent } from "@/lib/site-content";
import { cn, publicUrl } from "@/lib/utils";
import { crumbsFor } from "./admin/crumbs";
import { Archive as ArchivePage } from "./admin/Archive";
import { Inventory } from "./admin/Inventory";
import { NotificationBell } from "./admin/NotificationBell";
import { onHashMove, pushHash, readHash, registerLeaveGuard, registerLeavePrompt, type View } from "./admin/nav";
import { Offers } from "./admin/Offers";
import { OpsProvider } from "./admin/ops";
import { markNotificationsRead, useNotifications } from "@/lib/notifications";
import { Orders } from "./admin/OrdersPage";
import { Overview } from "./admin/Overview";
import { Products, type ShopMode } from "./admin/Products";
import { Reports } from "./admin/Reports";
import { ShopScope } from "./admin/shopScope";
import { useAdminTheme } from "./admin/theme";
import { Button, Confirm, DemoNote, Field, Select, control, type IconType } from "./admin/ui";
import { ShopAccount } from "./shop/ShopAccount";
import { ShopCustomers } from "./shop/ShopCustomers";
import { ShopPayments } from "./shop/ShopPayments";
import { ShopRequests } from "./shop/ShopRequests";

const SESSION_KEY = "alsaif-shop-session";

// The shop dashboard is the admin dashboard narrowed to one shop: same layout and pages, only this shop's data.
const NAV_GROUPS: Array<{ label: string; items: Array<{ id: View; label: string; icon: IconType }> }> = [
  { label: "الرئيسية", items: [{ id: "overview", label: "نظرة عامة", icon: LayoutDashboard }] },
  {
    label: "المبيعات",
    items: [
      { id: "orders", label: "الطلبات", icon: ShoppingCart },
      { id: "customers", label: "العملاء", icon: Users },
      { id: "payments", label: "المدفوعات", icon: CreditCard },
    ],
  },
  {
    label: "الكتالوج",
    items: [
      { id: "products", label: "المنتجات", icon: Package },
      { id: "productRequests", label: "طلبات المنتجات", icon: ClipboardCheck },
      { id: "inventory", label: "المخزون", icon: Boxes },
      { id: "offers", label: "العروض والخصومات", icon: Percent },
    ],
  },
  {
    label: "المحل",
    items: [
      { id: "reports", label: "التقارير", icon: BarChart3 },
      { id: "archive", label: "الأرشيف", icon: Archive },
      { id: "settings", label: "حساب المحل", icon: Settings },
    ],
  },
];
const SHOP_VIEWS = NAV_GROUPS.flatMap((group) => group.items.map((item) => item.id));

const readSession = () => {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
};
const writeSession = (id: string | null) => {
  try {
    if (id) localStorage.setItem(SESSION_KEY, id);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage can be blocked; the choice still holds for this visit.
  }
};
/** The page in the address, limited to the sections a shop has. */
const readShopView = (): View => {
  const { view } = readHash();
  return SHOP_VIEWS.includes(view) ? view : "overview";
};

/** The shop dashboard. With a server, a shop signs in with its own account; the local preview (no server) lets you pick a demo shop. */
export function ShopPage() {
  return PREVIEW ? <PreviewShopPage /> : <LiveShopPage />;
}

/** A shop account: signs in with email and password, and the dashboard works on that shop's data from the database. */
function LiveShopPage() {
  // undefined while the saved session is being checked with the server.
  const [account, setAccount] = useState<AdminUser | null | undefined>(undefined);
  const [startError, setStartError] = useState("");
  const [theme, setTheme] = useAdminTheme();
  const { shops, loadAdminCatalogue, leaveAdminCatalogue } = useSiteContent();

  async function enter(user: AdminUser) {
    setDashboardScope("shop");
    await loadAdminCatalogue();
    setAccount(user);
  }

  useEffect(() => {
    // From the first request on, this page talks as the shop (its own session cookie).
    setDashboardScope("shop");
    const controller = new AbortController();
    currentAdmin(controller.signal)
      .then(async (user) => {
        if (user?.role === "SHOP" && user.shopId) await enter(user);
        else setAccount(null);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setStartError(apiMessage(error));
        setAccount(null);
      });
    return () => {
      controller.abort();
      setDashboardScope("admin");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The server ended the session: back to the sign-in.
  useEffect(() => {
    const signedOut = () => {
      setAccount(null);
      setDashboardScope("admin");
      leaveAdminCatalogue();
    };
    window.addEventListener(UNAUTHORIZED_EVENT, signedOut);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, signedOut);
  }, [leaveAdminCatalogue]);

  if (account === undefined) {
    return (
      <div dir="rtl" className="admin grid min-h-svh place-items-center text-sm text-(--a-muted)">
        <span className="inline-flex items-center gap-2">
          <LoaderCircle className="size-4 animate-spin" />
          جاري التحقق من الجلسة…
        </span>
      </div>
    );
  }
  if (!account || !account.shopId) return <ShopLogin initialError={startError} onSuccess={enter} />;
  const shop = shops.find((item) => item.id === account.shopId);
  return (
    <OpsProvider>
      <ShopScope shopId={account.shopId}>
        <Dashboard
          shopId={account.shopId}
          shopName={shop?.name ?? account.fullName}
          dark={theme === "dark"}
          onTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
          onLogout={async () => {
            await logoutAdmin();
            setDashboardScope("admin");
            leaveAdminCatalogue();
            setAccount(null);
          }}
        />
      </ShopScope>
    </OpsProvider>
  );
}

/** A password box with an eye button that shows or hides what was typed. */
function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [shown, setShown] = useState(false);
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-(--a-muted)">{label}</span>
      <span className="relative block">
        <input dir="ltr" type={shown ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} className={cn(control, "h-10 pe-10")} />
        <button
          type="button"
          onClick={() => setShown(!shown)}
          aria-label={shown ? "إخفاء كلمة السر" : "إظهار كلمة السر"}
          className="absolute inset-y-0 start-0 grid w-10 cursor-pointer place-items-center text-(--a-muted) transition hover:text-(--a-text)"
        >
          {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </span>
    </label>
  );
}

function ShopLogin({ onSuccess, initialError }: { onSuccess: (user: AdminUser) => Promise<void>; initialError: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false);
  const [signup, setSignup] = useState(false);
  const [form, setForm] = useState({ shopName: "", ownerName: "", phone: "", city: "", address: "", description: "" });
  const setField = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));
  // The card is as tall as the face on show; it turns 180° between sign in and sign up (same motion as the store's account card).
  const [heights, setHeights] = useState({ signin: 0, signup: 0 });
  const [animateHeight, setAnimateHeight] = useState(false);
  const signinRef = useRef<HTMLDivElement>(null);
  const signupRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const measure = () => setHeights({ signin: (signinRef.current?.offsetHeight ?? 0) + 2, signup: (signupRef.current?.offsetHeight ?? 0) + 2 });
    measure();
    const observer = new ResizeObserver(measure);
    if (signinRef.current) observer.observe(signinRef.current);
    if (signupRef.current) observer.observe(signupRef.current);
    const timer = window.setTimeout(() => setAnimateHeight(true), 60);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  function flip(toSignup: boolean) {
    setError("");
    setSignup(toSignup);
  }

  /** A seller joins: the shop is made, signs in at once, and the admin sees a "new" mark on it in the shops page. */
  async function submitSignup(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await api("/shop-signup", { body: { ...form, email, password } });
      announceChange("shops");
      // The account exists right away: go straight into the (empty) dashboard.
      await onSuccess(await loginAdmin(email, password));
    } catch (failure) {
      setError(apiMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const user = await loginAdmin(email, password);
      if (user.role !== "SHOP" || !user.shopId) {
        setError("هذا الحساب مش حساب محل. دخول الإدارة من لوحة الإدارة.");
        return;
      }
      await onSuccess(user);
    } catch (failure) {
      setError(apiMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  const errorBox = error ? (
    <p role="alert" className="rounded-xl border border-(--a-danger)/30 px-4 py-3 text-sm text-(--a-danger)">
      {error}
    </p>
  ) : null;
  const switchLink = (toSignup: boolean) => (
    <p className="text-center text-xs text-(--a-muted)">
      {toSignup ? "ما عندك حساب؟ " : "عندك حساب؟ "}
      <button type="button" className="cursor-pointer font-medium text-(--a-text) underline" onClick={() => flip(toSignup)}>
        {toSignup ? "انضم كبائع" : "سجّل دخولك"}
      </button>
    </p>
  );
  const head = (title: string, lead: string) => (
    <div className="flex flex-col items-center text-center">
      <span className="grid size-20 place-items-center rounded-3xl bg-white p-2.5 shadow-[0_12px_28px_rgba(37,99,235,0.18)] ring-1 ring-[#2563eb]/10">
        <img src={publicUrl("/brand/logo.png")} alt="" className="size-full object-contain" />
      </span>
      <h1 className="mt-5 text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-1.5 text-sm text-(--a-muted)">{lead}</p>
    </div>
  );
  const height = signup ? heights.signup : heights.signin;
  const faceClass = "auth-face rounded-[1.75rem] border border-(--a-line) bg-(--a-surface) shadow-[0_24px_60px_rgba(11,18,32,0.10)]";

  return (
    <div dir="rtl" className="admin relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden bg-(--a-bg) px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 -z-10 size-[42rem] -translate-x-1/2 rounded-full bg-[#2563eb]/12 blur-3xl" />
      <div className="w-full max-w-[26rem]">
        <div className="auth-scene">
          <div className="auth-flipper" data-flipped={signup} data-animate={animateHeight} style={height ? { height: `min(${height}px, calc(100svh - 5rem))` } : undefined}>
            <div data-face="signin" data-active={!signup} aria-hidden={signup} inert={signup} className={faceClass}>
              <div ref={signinRef}>
                <form onSubmit={submit}>
                  <div className="h-1.5 bg-[linear-gradient(90deg,#1d4ed8,#3b82f6,#60a5fa)]" />
                  <div className="space-y-5 px-7 pb-8 pt-9 sm:px-9">
                    {head("دخول المحلات", "لوحة تحكم المحل في سوق الكمبيوترات")}
                    <Field label="البريد الإلكتروني" value={email} onChange={setEmail} type="email" dir="ltr" />
                    <PasswordField label="كلمة السر" value={password} onChange={setPassword} />
                    {errorBox}
                    <Button variant="primary" icon={LogIn} type="submit" disabled={busy || !email.trim() || !password} className="h-12 w-full justify-center">
                      {busy ? "جاري الدخول…" : "دخول"}
                    </Button>
                    {switchLink(true)}
                  </div>
                </form>
              </div>
            </div>
            <div data-face="signup" data-active={signup} aria-hidden={!signup} inert={!signup} className={`${faceClass} auth-face--back`}>
              <div ref={signupRef}>
                <form onSubmit={submitSignup}>
                  <div className="h-1.5 bg-[linear-gradient(90deg,#1d4ed8,#3b82f6,#60a5fa)]" />
                  <div className="space-y-5 px-7 pb-8 pt-9 sm:px-9">
                    {head("انضم كبائع", "سجّل محلك وادخل لوحة التحكم مباشرة")}
                      <>
                        <Field label="اسم المحل" value={form.shopName} onChange={setField("shopName")} />
                        <Field label="اسم صاحب المحل" value={form.ownerName} onChange={setField("ownerName")} />
                        <Field label="رقم الجوال" value={form.phone} onChange={setField("phone")} type="tel" dir="ltr" />
                        <Field label="المدينة" value={form.city} onChange={setField("city")} />
                        <Field label="العنوان بالتفصيل (الحي، الشارع، رقم المحل)" value={form.address} onChange={setField("address")} multiline />
                        <Field label="نبذة عن المحل (اختياري)" value={form.description} onChange={setField("description")} multiline />
                        <Field label="البريد الإلكتروني" value={email} onChange={setEmail} type="email" dir="ltr" />
                        <PasswordField label="كلمة السر" value={password} onChange={setPassword} />
                        <PasswordField label="تأكيد كلمة السر" value={confirm} onChange={setConfirm} />
                        {confirm && confirm !== password ? <p className="-mt-3 text-xs text-(--a-danger)">كلمتا السر غير متطابقتين.</p> : null}
                        {errorBox}
                        <Button
                          variant="primary"
                          icon={LogIn}
                          type="submit"
                          disabled={busy || !email.trim() || !password || confirm !== password || !form.shopName.trim() || !form.ownerName.trim() || !form.phone.trim() || !form.city.trim() || !form.address.trim()}
                          className="h-12 w-full justify-center"
                        >
                          {busy ? "جاري الإنشاء…" : "إنشاء الحساب"}
                        </Button>
                        {switchLink(false)}
                      </>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        <Link href="/ar" className="mx-auto mt-6 flex w-fit items-center gap-1.5 text-sm text-(--a-muted) transition hover:text-(--a-text)">
          <ExternalLink className="size-4" />
          الرجوع للمتجر
        </Link>
      </div>
    </div>
  );
}

/** Local preview only: pick a demo shop, no password, data stays in this browser. */
function PreviewShopPage() {
  const { shops } = useSiteContent();
  const [shopId, setShopId] = useState<string | null>(readSession);
  const [theme, setTheme] = useAdminTheme();
  const shop = shops.find((item) => item.id === shopId) ?? null;

  if (!shop) {
    return (
      <Login
        onEnter={(id) => {
          writeSession(id);
          setShopId(id);
        }}
      />
    );
  }
  return (
    <OpsProvider>
      <ShopScope shopId={shop.id}>
        <Dashboard
          shopId={shop.id}
          shopName={shop.name}
          dark={theme === "dark"}
          onTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
          onLogout={() => {
            writeSession(null);
            setShopId(null);
          }}
        />
      </ShopScope>
    </OpsProvider>
  );
}

function Login({ onEnter }: { onEnter: (shopId: string) => void }) {
  const { shops } = useSiteContent();
  const [pick, setPick] = useState("");
  const chosen = pick || shops[0]?.id || "";
  return (
    <div dir="rtl" className="admin relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden bg-(--a-bg) px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 -z-10 size-[42rem] -translate-x-1/2 rounded-full bg-[#2563eb]/12 blur-3xl" />
      <div className="w-full max-w-[26rem]">
        <div className="overflow-hidden rounded-[1.75rem] border border-(--a-line) bg-(--a-surface) shadow-[0_24px_60px_rgba(11,18,32,0.10)]">
          <div className="h-1.5 bg-[linear-gradient(90deg,#1d4ed8,#3b82f6,#60a5fa)]" />
          <div className="space-y-6 px-7 pb-8 pt-9 sm:px-9">
            <div className="flex flex-col items-center text-center">
              <span className="grid size-20 place-items-center rounded-3xl bg-white p-2.5 shadow-[0_12px_28px_rgba(37,99,235,0.18)] ring-1 ring-[#2563eb]/10">
                <img src={publicUrl("/brand/logo.png")} alt="" className="size-full object-contain" />
              </span>
              <h1 className="mt-5 text-2xl font-bold tracking-tight">دخول المحلات</h1>
              <p className="mt-1.5 text-sm text-(--a-muted)">لوحة تحكم المحل في سوق الكمبيوترات</p>
            </div>
            <DemoNote title="دخول تجريبي">حسابات المحلات ما انربطت بالسيرفر بعد. اختر محلك للمعاينة بدون كلمة سر.</DemoNote>
            {shops.length ? (
              <Select label="المحل" value={chosen} onChange={setPick} options={shops.map((item) => [item.id, item.name])} />
            ) : (
              <p className="text-center text-sm text-(--a-muted)">ما فيه محلات بعد. تضيفها الإدارة من صفحة المحلات.</p>
            )}
            <Button variant="primary" icon={LogIn} disabled={!chosen} onClick={() => onEnter(chosen)} className="h-12 w-full justify-center">
              دخول
            </Button>
          </div>
        </div>
        <Link href="/ar" className="mx-auto mt-6 flex w-fit items-center gap-1.5 text-sm text-(--a-muted) transition hover:text-(--a-text)">
          <ExternalLink className="size-4" />
          الرجوع للمتجر
        </Link>
      </div>
    </div>
  );
}

function Dashboard({ shopId, shopName, dark, onTheme, onLogout }: { shopId: string; shopName: string; dark: boolean; onTheme: () => void; onLogout: () => void }) {
  const { content, submitProduct } = useSiteContent();
  const [view, setView] = useState<View>(readShopView);
  const [hash, setHash] = useState(() => readHash());
  // Orders nobody has opened yet (their notification is unread); opening an order page marks it read.
  const { unreadOrders: newOrders } = useNotifications();
  useEffect(() => {
    if (hash.sub) void markNotificationsRead({ link: `${hash.view}/${hash.sub}` });
  }, [hash]);
  const [leaving, setLeaving] = useState<{ proceed: () => void; save?: () => unknown } | null>(null);
  useEffect(() => registerLeavePrompt((proceed, save) => setLeaving({ proceed, save })), []);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);
  useEffect(
    () =>
      onHashMove(() => {
        setView(readShopView());
        setHash(readHash());
      }),
    [],
  );

  // A product the shop adds is sent to the admin for approval, and the add page asks before leaving with unsaved input.
  const shopMode: ShopMode = {
    submit: submitProduct,
    registerGuard: (has, save) => registerLeaveGuard(has, { save, anySub: true }),
  };
  const crumbs = crumbsFor(hash.view, hash.sub, {
    shopName: () => shopName,
    productName: (id) => content.products.find((item) => item.id === id)?.nameAr,
  });

  function open(next: View) {
    pushHash(next);
    setMenuOpen(false);
  }

  return (
    <div dir="rtl" className="admin min-h-svh overflow-x-clip lg:flex">
      {menuOpen ? <button type="button" aria-label="إغلاق القائمة" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-30 bg-black/40 lg:hidden" /> : null}
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-40 flex w-72 flex-col border-e border-(--a-side-line) bg-(--a-side) text-(--a-side-text) transition-transform lg:sticky lg:top-0 lg:h-svh lg:w-64 lg:shrink-0 lg:translate-x-0",
          menuOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-(--a-side-line) px-5">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark size="size-10 rounded-xl" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-(--a-side-text)">{shopName}</span>
              <span className="block text-xs text-(--a-side-muted)">لوحة المحل</span>
            </span>
          </div>
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="إغلاق القائمة" className="grid size-9 place-items-center rounded-lg text-(--a-side-muted) hover:bg-(--a-side-hover) lg:hidden">
            <X className="size-4" />
          </button>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="أقسام لوحة المحل">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-1.5 text-[11px] font-semibold tracking-wide text-(--a-side-muted)">{group.label}</p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = view === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => open(item.id)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative flex h-9 w-full items-center gap-3 rounded-lg px-3 text-start text-sm transition",
                          active ? "bg-(--a-side-active) font-semibold text-(--a-side-active-text)" : "text-(--a-side-text)/80 hover:bg-(--a-side-hover) hover:text-(--a-side-text)",
                        )}
                      >
                        {active ? <span className="absolute inset-y-1.5 start-0 w-[3px] rounded-full bg-(--a-accent)" /> : null}
                        <Icon className={cn("size-[18px] shrink-0", active ? "" : "text-(--a-side-muted)")} />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.id === "orders" && newOrders > 0 ? (
                          <span aria-label={`${newOrders} جديد`} className="grid h-5 min-w-5 place-items-center rounded-full bg-(--a-danger) px-1.5 text-[11px] font-semibold text-white">
                            {newOrders}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-(--a-side-line) p-3">
          <div className="flex items-center gap-3 rounded-xl bg-(--a-side-hover) p-3">
            <span className="grid size-9 place-items-center rounded-full bg-[linear-gradient(135deg,#25d9e6,#647cff)] text-[#0b1220]">
              <Store className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{shopName}</p>
              <p className="text-xs text-(--a-side-muted)">صاحب المحل</p>
            </div>
            <button type="button" onClick={onLogout} aria-label="تسجيل الخروج" title="تسجيل الخروج" className="grid size-9 place-items-center rounded-lg text-(--a-side-muted) hover:bg-(--a-side-line) hover:text-(--a-side-text)">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-(--a-line) bg-(--a-surface)/85 px-4 backdrop-blur sm:px-6">
          <button type="button" onClick={() => setMenuOpen(true)} aria-label="فتح القائمة" className="grid size-10 place-items-center rounded-xl border border-(--a-line) lg:hidden">
            <Menu className="size-5" />
          </button>
          <div className="ms-auto flex items-center gap-2">
            <NotificationBell />
            <button
              type="button"
              onClick={onTheme}
              aria-label={dark ? "الوضع الفاتح" : "الوضع الداكن"}
              title={dark ? "الوضع الفاتح" : "الوضع الداكن"}
              className="grid size-10 place-items-center rounded-xl border border-(--a-line) bg-(--a-surface) text-(--a-muted) hover:text-(--a-text)"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <Link href={`/ar/shops/${encodeURIComponent(shopId)}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-(--a-line) bg-(--a-surface) px-3 text-sm hover:bg-(--a-surface-2)">
              <ExternalLink className="size-4" />
              <span className="hidden sm:inline">معاينة صفحة المحل</span>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:py-6">
          {crumbs.length > 2 ? (
            <nav aria-label="مسار التنقل" className="mb-3 text-sm">
              {crumbs.map((crumb, index) => (
                <span key={`${index}-${crumb.label}`}>
                  {index > 0 ? <span className="text-(--a-muted)"> / </span> : null}
                  {crumb.go ? (
                    <button type="button" onClick={crumb.go} className="text-(--a-muted) hover:text-(--a-text)">
                      {crumb.label}
                    </button>
                  ) : (
                    <span aria-current="page" className="font-semibold">
                      {crumb.label}
                    </span>
                  )}
                </span>
              ))}
            </nav>
          ) : null}
          {view === "overview" ? <Overview onOpen={open} /> : null}
          {view === "orders" ? <Orders /> : null}
          {view === "customers" ? <ShopCustomers /> : null}
          {view === "payments" ? <ShopPayments /> : null}
          {view === "products" ? <Products shopScope={shopId} shopMode={shopMode} /> : null}
          {view === "productRequests" ? <ShopRequests /> : null}
          {view === "inventory" ? <Inventory /> : null}
          {view === "offers" ? <Offers onOpen={open} /> : null}
          {view === "reports" ? <Reports /> : null}
          {view === "archive" ? <ArchivePage /> : null}
          {view === "settings" ? <ShopAccount shopId={shopId} /> : null}
        </main>
      </div>
      <Confirm
        open={leaving !== null}
        onClose={() => setLeaving(null)}
        onConfirm={() => leaving?.proceed()}
        title={leaving?.save ? "تبغى تطلع بدون حفظ؟" : "فيه تعديلات غير مؤكدة"}
        lead={leaving?.save ? "إذا طلعت الحين، بتفقد التعديلات اللي سويتها. تبغى تحفظها قبل تطلع؟" : "لو خرجت الآن، تضيع التعديلات اللي ما أكدتها. ارجع للصفحة واضغط «تأكيد التعديلات» لو تبي تحفظها."}
        action="خروج بدون حفظ"
        alt={
          leaving?.save
            ? {
                label: "حفظ وخروج",
                onClick: () => {
                  void Promise.resolve(leaving.save?.()).then((saved) => {
                    if (saved !== false) leaving.proceed();
                  });
                },
              }
            : undefined
        }
      />
    </div>
  );
}
