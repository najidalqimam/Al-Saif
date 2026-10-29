import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ExternalLink, LogIn, LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { ADMIN_USER, loginAdmin, logoutAdmin, isAdmin } from "@/lib/admin-auth";
import { cn } from "@/lib/utils";
import { ContentHub } from "./admin/ContentHub";
import { Departments } from "./admin/Departments";
import { Inventory } from "./admin/Inventory";
import { NAV_GROUPS, NAV_ITEMS, isView, type View } from "./admin/nav";
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
  const [authed, setAuthed] = useState(isAdmin);
  const [theme, setTheme] = useAdminTheme();

  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;
  return (
    <OpsProvider>
      <Dashboard onLogout={() => setAuthed(false)} theme={theme} onTheme={setTheme} />
    </OpsProvider>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-xl bg-[linear-gradient(135deg,#25d9e6,#647cff)] text-base font-bold text-[#0b1220]">س</span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-(--a-side-text)">سوق الالكترونيات</span>
        <span className="block text-xs text-(--a-side-muted)">لوحة الإدارة</span>
      </span>
    </div>
  );
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (loginAdmin(username, password)) {
      onSuccess();
      return;
    }
    setError(true);
  }

  const input = "mt-1.5 h-11 w-full rounded-xl border border-(--a-line) bg-(--a-bg) px-3 text-sm outline-none focus:border-(--a-accent)";

  return (
    <div
      dir="rtl"
      className="admin grid min-h-svh place-items-center px-4"
      style={{ backgroundImage: "radial-gradient(50% 40% at 50% 0%, rgba(37,217,230,.12), transparent 70%), radial-gradient(40% 40% at 100% 100%, rgba(100,124,255,.12), transparent 70%)" }}
    >
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-(--a-line) bg-(--a-surface) p-8 shadow-(--a-shadow)">
        <span className="grid size-12 place-items-center rounded-2xl bg-[linear-gradient(135deg,#25d9e6,#647cff)] text-lg font-bold text-[#0b1220]">س</span>
        <h1 className="mt-5 text-2xl font-bold">تسجيل دخول الإدارة</h1>
        <p className="mt-1 text-sm leading-7 text-(--a-muted)">لوحة تحكم سوق الالكترونيات</p>
        <label className="mt-6 block text-sm font-medium">
          اسم المستخدم
          <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" className={input} />
        </label>
        <label className="mt-4 block text-sm font-medium">
          كلمة السر
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className={input} />
        </label>
        {error ? <p className="mt-3 text-sm text-(--a-danger)">اسم المستخدم أو كلمة السر غير صحيحة.</p> : null}
        <Button type="submit" variant="primary" icon={LogIn} className="mt-6 h-11 w-full">
          دخول
        </Button>
      </form>
    </div>
  );
}

/** The open page lives in the URL hash (#orders, #shipping…) so refresh and bookmarks keep it. */
function readView(): View {
  const hash = window.location.hash.slice(1);
  return isView(hash) ? hash : "overview";
}

function Dashboard({ onLogout, theme, onTheme }: { onLogout: () => void; theme: AdminTheme; onTheme: (theme: AdminTheme) => void }) {
  const [view, setView] = useState<View>(readView);
  const [menuOpen, setMenuOpen] = useState(false);
  const current = NAV_ITEMS.find((item) => item.id === view) ?? NAV_ITEMS[0];
  const dark = theme === "dark";

  useEffect(() => {
    window.scrollTo({ top: 0 });
    const hash = view === "overview" ? "" : `#${view}`;
    if (window.location.hash !== hash) window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
  }, [view]);

  useEffect(() => {
    const sync = () => setView(readView());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  function open(next: View) {
    setView(next);
    setMenuOpen(false);
  }

  function signOut() {
    logoutAdmin();
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
                        {item.demo ? <span className="rounded-full bg-(--a-blue-soft) px-1.5 py-px text-[10px] font-medium text-(--a-blue)">تجريبي</span> : null}
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
            <span className="grid size-9 place-items-center rounded-full bg-[linear-gradient(135deg,#25d9e6,#647cff)] text-sm font-semibold text-[#0b1220] uppercase">{ADMIN_USER.slice(0, 1)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{ADMIN_USER}</p>
              <p className="text-xs text-(--a-side-muted)">مدير المتجر</p>
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
          {view === "overview" ? <Overview onOpen={open} /> : null}
          {view === "orders" ? <Orders /> : null}
          {view === "shipping" ? <Shipping /> : null}
          {view === "payments" ? <Payments /> : null}
          {view === "products" ? <Products /> : null}
          {view === "departments" ? <Departments /> : null}
          {view === "inventory" ? <Inventory /> : null}
          {view === "offers" ? <Offers onOpen={open} /> : null}
          {view === "content" ? <ContentHub onOpen={open} /> : null}
          {view === "reports" ? <Reports /> : null}
          {view === "settings" ? <Settings adminTheme={theme} onAdminTheme={onTheme} /> : null}
        </main>
      </div>
    </div>
  );
}
