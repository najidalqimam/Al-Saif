import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { CircleAlert, ExternalLink, Eye, EyeOff, LoaderCircle, Lock, LogIn, LogOut, Mail, Menu, Moon, RefreshCw, ShieldCheck, Sun, X } from "lucide-react";
import { BrandMark } from "@/components/site/Brand";
import { ROLE_LABELS, currentAdmin, loginAdmin, logoutAdmin, type AdminUser } from "@/lib/admin-auth";
import { UNAUTHORIZED_EVENT, apiMessage } from "@/lib/api";
import { useSiteContent } from "@/lib/site-content";
import { cn, publicUrl } from "@/lib/utils";
import { ContentHub } from "./admin/ContentHub";
import { Customers } from "./admin/Customers";
import { Departments } from "./admin/Departments";
import { Inventory } from "./admin/Inventory";
import { NAV_GROUPS, NAV_ITEMS, onHashMove, pushHash, readHash, type View } from "./admin/nav";
import { Offers } from "./admin/Offers";
import { OpsProvider } from "./admin/ops";
import { Orders } from "./admin/OrdersPage";
import { Overview } from "./admin/Overview";
import { Payments } from "./admin/Payments";
import { Products } from "./admin/Products";
import { Reports } from "./admin/Reports";
import { Settings } from "./admin/Settings";
import { Shipping } from "./admin/Shipping";
import { useAdminTheme, type AdminTheme } from "./admin/theme";
import { Button } from "./admin/ui";

export function AdminPage() {
  // undefined while the saved session is being checked with the server.
  const [admin, setAdmin] = useState<AdminUser | null | undefined>(undefined);
  const [startError, setStartError] = useState("");
  const [theme, setTheme] = useAdminTheme();
  const { leaveAdminCatalogue } = useSiteContent();

  useEffect(() => {
    const controller = new AbortController();
    currentAdmin(controller.signal)
      .then(setAdmin)
      .catch((error) => {
        if (controller.signal.aborted) return;
        setStartError(apiMessage(error));
        setAdmin(null);
      });
    return () => controller.abort();
  }, []);

  // The server ended the session (expired, revoked or the account was switched off): back to the login.
  useEffect(() => {
    const signedOut = () => {
      setAdmin(null);
      leaveAdminCatalogue();
    };
    window.addEventListener(UNAUTHORIZED_EVENT, signedOut);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, signedOut);
  }, [leaveAdminCatalogue]);

  if (admin === undefined) {
    return (
      <div dir="rtl" className="admin grid min-h-svh place-items-center text-sm text-(--a-muted)">
        <span className="inline-flex items-center gap-2">
          <LoaderCircle className="size-4 animate-spin" />
          جاري التحقق من الجلسة…
        </span>
      </div>
    );
  }
  if (!admin) return <Login initialError={startError} onSuccess={setAdmin} />;
  return (
    <OpsProvider>
      <Dashboard
        admin={admin}
        onLogout={async () => {
          await logoutAdmin();
          leaveAdminCatalogue();
          setAdmin(null);
        }}
        theme={theme}
        onTheme={setTheme}
      />
    </OpsProvider>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <BrandMark size="size-10 rounded-xl" />
      <span className="min-w-0">
        <span className="block text-sm font-bold text-(--a-side-text)">سوق الكمبيوترات</span>
        <span className="block text-xs text-(--a-side-muted)">لوحة الإدارة</span>
      </span>
    </div>
  );
}

function Login({ onSuccess, initialError }: { onSuccess: (admin: AdminUser) => void; initialError: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      onSuccess(await loginAdmin(email, password));
    } catch (failure) {
      setError(apiMessage(failure));
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  // Both fields are typed left to right; the icons sit on the right edge, so the text keeps clear of them.
  const input = "h-12 w-full rounded-xl border border-(--a-line) bg-(--a-bg) pl-3 pr-11 text-sm outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/15";

  return (
    <div dir="rtl" className="admin relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden bg-(--a-bg) px-4 py-10">
      {/* Soft blue light behind the card. */}
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 -z-10 size-[42rem] -translate-x-1/2 rounded-full bg-[#2563eb]/12 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(rgba(37,99,235,0.10)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_75%)]" />

      <div className="w-full max-w-[26rem]">
        <div className="overflow-hidden rounded-[1.75rem] border border-(--a-line) bg-(--a-surface) shadow-[0_24px_60px_rgba(11,18,32,0.10)]">
          <div className="h-1.5 bg-[linear-gradient(90deg,#1d4ed8,#3b82f6,#60a5fa)]" />
          <div className="px-7 pb-8 pt-9 sm:px-9">
            <div className="flex flex-col items-center text-center">
              <span className="grid size-20 place-items-center rounded-3xl bg-white p-2.5 shadow-[0_12px_28px_rgba(37,99,235,0.18)] ring-1 ring-[#2563eb]/10">
                <img src={publicUrl("/brand/logo.png")} alt="" className="size-full object-contain" />
              </span>
              <h1 className="mt-5 text-2xl font-bold tracking-tight">تسجيل دخول الإدارة</h1>
              <p className="mt-1.5 text-sm text-(--a-muted)">لوحة تحكم سوق الكمبيوترات</p>
            </div>

            <form onSubmit={submit} className="mt-8 space-y-5">
              <label className="block text-sm font-medium">
                البريد الإلكتروني
                <span className="relative mt-1.5 block">
                  <Mail className="pointer-events-none absolute right-4 top-1/2 size-[18px] -translate-y-1/2 text-(--a-muted)" />
                  <input
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="username"
                    placeholder="name@example.com"
                    required
                    className={cn(input, "text-right placeholder:text-(--a-muted)/70")}
                  />
                </span>
              </label>
              <label className="block text-sm font-medium">
                كلمة السر
                {/* The field is left-to-right, so the eye button sits on its left edge and the lock on its right. */}
                <span className="relative mt-1.5 block">
                  <Lock className="pointer-events-none absolute right-4 top-1/2 size-[18px] -translate-y-1/2 text-(--a-muted)" />
                  <input
                    type={showPassword ? "text" : "password"}
                    dir="ltr"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                    className={cn(input, "pl-12")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((shown) => !shown)}
                    aria-label={showPassword ? "إخفاء كلمة السر" : "إظهار كلمة السر"}
                    aria-pressed={showPassword}
                    title={showPassword ? "إخفاء كلمة السر" : "إظهار كلمة السر"}
                    className="absolute inset-y-0 left-1 grid w-11 cursor-pointer place-items-center rounded-lg text-(--a-muted) hover:text-(--a-text)"
                  >
                    {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                  </button>
                </span>
              </label>
              {error ? (
                <p role="alert" className="flex items-start gap-2 rounded-xl bg-(--a-danger-soft) px-3 py-2.5 text-sm text-(--a-danger)">
                  <CircleAlert className="mt-0.5 size-4 shrink-0" />
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#2563eb] text-sm font-bold text-white shadow-[0_10px_24px_rgba(37,99,235,0.28)] transition hover:bg-[#1d4ed8] disabled:cursor-default disabled:opacity-70"
              >
                {busy ? <LoaderCircle className="size-4 animate-spin" /> : <LogIn className="size-4" />}
                {busy ? "جاري الدخول…" : "دخول"}
              </button>
            </form>

            <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-(--a-muted)">
              <ShieldCheck className="size-3.5" />
              للفريق فقط، والجلسة تنتهي تلقائيًا.
            </p>
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

function Dashboard({ admin, onLogout, theme, onTheme }: { admin: AdminUser; onLogout: () => void; theme: AdminTheme; onTheme: (theme: AdminTheme) => void }) {
  const { catalogue, loadAdminCatalogue, dismissSaveError } = useSiteContent();
  // Products, departments and stock load from the database before the pages that edit them are shown.
  const [loadState, setLoadState] = useState<"loading" | "ready" | string>("loading");
  const load = useCallback(() => {
    setLoadState("loading");
    loadAdminCatalogue()
      .then(() => setLoadState("ready"))
      .catch((error) => setLoadState(apiMessage(error)));
  }, [loadAdminCatalogue]);
  useEffect(load, [load]);
  const [view, setView] = useState<View>(() => readHash().view);
  const [menuOpen, setMenuOpen] = useState(false);
  const current = NAV_ITEMS.find((item) => item.id === view) ?? NAV_ITEMS[0];
  const dark = theme === "dark";

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  useEffect(() => onHashMove(() => setView(readHash().view)), []);

  function open(next: View) {
    pushHash(next);
    setMenuOpen(false);
  }

  function signOut() {
    onLogout();
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
          <Brand />
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="إغلاق القائمة" className="grid size-9 place-items-center rounded-lg text-(--a-side-muted) hover:bg-(--a-side-hover) lg:hidden">
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="أقسام لوحة التحكم">
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
            <span className="grid size-9 place-items-center rounded-full bg-[linear-gradient(135deg,#25d9e6,#647cff)] text-sm font-semibold text-[#0b1220] uppercase">{(admin.fullName || admin.email).slice(0, 1)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{admin.fullName || admin.email}</p>
              <p className="text-xs text-(--a-side-muted)">{ROLE_LABELS[admin.role]}</p>
            </div>
            <button type="button" onClick={signOut} aria-label="تسجيل الخروج" title="تسجيل الخروج" className="grid size-9 place-items-center rounded-lg text-(--a-side-muted) hover:bg-(--a-side-line) hover:text-(--a-side-text)">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-(--a-line) bg-(--a-surface)/85 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setMenuOpen(true)} aria-label="فتح القائمة" className="grid size-10 place-items-center rounded-xl border border-(--a-line) lg:hidden">
              <Menu className="size-5" />
            </button>
            <p className="truncate text-sm">
              <span className="text-(--a-muted)">لوحة التحكم / </span>
              <span className="font-semibold">{current.label}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {catalogue.saving ? (
              <span role="status" className="inline-flex h-10 items-center gap-2 px-2 text-xs text-(--a-muted)">
                <LoaderCircle className="size-4 animate-spin" />
                <span className="hidden sm:inline">جاري الحفظ…</span>
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => onTheme(dark ? "light" : "dark")}
              aria-label={dark ? "الوضع الفاتح" : "الوضع الداكن"}
              title={dark ? "الوضع الفاتح" : "الوضع الداكن"}
              className="grid size-10 place-items-center rounded-xl border border-(--a-line) bg-(--a-surface) text-(--a-muted) hover:text-(--a-text)"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <Link href="/ar" className="inline-flex h-10 items-center gap-2 rounded-xl border border-(--a-line) bg-(--a-surface) px-3 text-sm hover:bg-(--a-surface-2)">
              <ExternalLink className="size-4" />
              <span className="hidden sm:inline">معاينة المتجر</span>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          {/* One notice for the whole dashboard instead of a demo badge on every card. */}
          <p className="mb-6 flex items-center gap-2 rounded-xl border border-(--a-line) bg-(--a-surface) px-3.5 py-2 text-xs text-(--a-muted)">
            <span className="size-1.5 shrink-0 rounded-full bg-(--a-warn)" aria-hidden="true" />
            المنتجات والأقسام والمخزون والطلبات وإعدادات الشحن والدفع محفوظة في قاعدة البيانات. محتوى الصفحة الرئيسية ما زال محفوظًا على هذا الجهاز.
          </p>
          {catalogue.error ? (
            <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-(--a-danger)/40 bg-(--a-danger)/10 px-4 py-3 text-sm">
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-(--a-danger)" />
              <p className="flex-1">{catalogue.error}</p>
              <button type="button" onClick={dismissSaveError} aria-label="إخفاء الرسالة" className="grid size-6 place-items-center rounded-md text-(--a-muted) hover:text-(--a-text)">
                <X className="size-4" />
              </button>
            </div>
          ) : null}
          {loadState === "loading" ? (
            <p role="status" className="flex items-center justify-center gap-2 py-24 text-sm text-(--a-muted)">
              <LoaderCircle className="size-4 animate-spin" />
              جاري تحميل المنتجات والأقسام…
            </p>
          ) : loadState !== "ready" ? (
            <div role="alert" className="mx-auto max-w-md py-24 text-center">
              <CircleAlert className="mx-auto size-8 text-(--a-danger)" />
              <p className="mt-3 font-semibold">ما قدرنا نحمّل بيانات المتجر</p>
              <p className="mt-1 text-sm text-(--a-muted)">{loadState}</p>
              <Button icon={RefreshCw} onClick={load} className="mt-5">
                حاول مرة ثانية
              </Button>
            </div>
          ) : null}
          {loadState !== "ready" ? null : <Pages view={view} open={open} theme={theme} onTheme={onTheme} />}
        </main>
      </div>
    </div>
  );
}

function Pages({ view, open, theme, onTheme }: { view: View; open: (view: View) => void; theme: AdminTheme; onTheme: (theme: AdminTheme) => void }) {
  return (
    <>
          {view === "overview" ? <Overview onOpen={open} /> : null}
          {view === "orders" ? <Orders /> : null}
          {view === "customers" ? <Customers /> : null}
          {view === "shipping" ? <Shipping /> : null}
          {view === "payments" ? <Payments /> : null}
          {view === "products" ? <Products /> : null}
          {view === "departments" ? <Departments /> : null}
          {view === "inventory" ? <Inventory /> : null}
          {view === "offers" ? <Offers onOpen={open} /> : null}
          {view === "content" ? <ContentHub onOpen={open} /> : null}
          {view === "reports" ? <Reports /> : null}
          {view === "settings" ? <Settings adminTheme={theme} onAdminTheme={onTheme} /> : null}
    </>
  );
}
