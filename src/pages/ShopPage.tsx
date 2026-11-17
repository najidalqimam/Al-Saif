import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { BadgePercent, ExternalLink, LayoutDashboard, LogIn, LogOut, Menu, Moon, Package, ShoppingCart, Store, Sun, X } from "lucide-react";
import { BrandMark } from "@/components/site/Brand";
import { useSiteContent } from "@/lib/site-content";
import { cn, publicUrl } from "@/lib/utils";
import { OpsProvider } from "./admin/ops";
import { useAdminTheme } from "./admin/theme";
import { Button, Confirm, DemoNote, Select } from "./admin/ui";
import { ShopNewProduct } from "./shop/ShopNewProduct";
import { ShopOffers, ShopOrders, ShopOverview, ShopProducts, type ShopView } from "./shop/ShopViews";

const SESSION_KEY = "alsaif-shop-session";
// The sidebar is grouped with headings, like the admin dashboard.
const NAV_GROUPS: Array<{ label: string; items: Array<{ id: ShopView; label: string; icon: typeof Package }> }> = [
  { label: "الرئيسية", items: [{ id: "overview", label: "نظرة عامة", icon: LayoutDashboard }] },
  { label: "المبيعات", items: [{ id: "orders", label: "الطلبات", icon: ShoppingCart }] },
  {
    label: "الكتالوج",
    items: [
      { id: "products", label: "منتجاتي والمخزون", icon: Package },
      { id: "offers", label: "العروض والجملة", icon: BadgePercent },
    ],
  },
];
const NAV = NAV_GROUPS.flatMap((group) => group.items);

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
const readView = (): ShopView => {
  const hash = window.location.hash.slice(1);
  return hash === "newProduct" || NAV.some((item) => item.id === hash) ? (hash as ShopView) : "overview";
};

export function ShopPage() {
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
  const [view, setView] = useState<ShopView>(readView);
  const [menuOpen, setMenuOpen] = useState(false);
  const viewRef = useRef(view);
  viewRef.current = view;

  // A page with unsaved input (the add-product page) registers a guard; leaving it asks first, and the prompt can send it.
  const guard = useRef<{ has: () => boolean; save: () => Promise<boolean> } | null>(null);
  const registerGuard = useCallback((has: () => boolean, save: () => Promise<boolean>) => {
    guard.current = { has, save };
    return () => {
      if (guard.current?.has === has) guard.current = null;
    };
  }, []);
  const [leaving, setLeaving] = useState<{ proceed: () => void; save: () => Promise<boolean> } | null>(null);
  const hashOf = (target: ShopView) => (target === "overview" ? "" : `#${target}`);

  function go(next: ShopView) {
    window.location.hash = next === "overview" ? "" : next;
    setView(next);
    setMenuOpen(false);
  }

  function open(next: ShopView) {
    if (guard.current?.has() && next !== viewRef.current) {
      setLeaving({ proceed: () => go(next), save: guard.current.save });
      setMenuOpen(false);
      return;
    }
    go(next);
  }

  useEffect(() => {
    const sync = () => {
      const next = readView();
      if (next === viewRef.current) return;
      // Back or forward with unsaved input: put the address back and ask first.
      if (guard.current?.has()) {
        window.history.pushState(null, "", `${window.location.pathname}${window.location.search}${hashOf(viewRef.current)}`);
        setLeaving({ proceed: () => go(next), save: guard.current.save });
        return;
      }
      setView(next);
    };
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

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
                  // The add-product page belongs to "my products".
                  const active = view === item.id || (view === "newProduct" && item.id === "products");
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
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          {view === "overview" ? <ShopOverview shopId={shopId} onOpen={open} /> : null}
          {view === "products" ? <ShopProducts shopId={shopId} onOpen={open} /> : null}
          {view === "newProduct" ? <ShopNewProduct shopId={shopId} onDone={() => open("products")} registerGuard={registerGuard} /> : null}
          {view === "orders" ? <ShopOrders shopId={shopId} /> : null}
          {view === "offers" ? <ShopOffers shopId={shopId} /> : null}
        </main>
      </div>
      <Confirm
        open={leaving !== null}
        onClose={() => setLeaving(null)}
        onConfirm={() => leaving?.proceed()}
        title="تبغى تطلع بدون حفظ؟"
        lead="إذا طلعت الحين، بتفقد المنتج اللي كتبته. تبغى ترسله للإدارة قبل تطلع؟"
        action="خروج بدون حفظ"
        alt={
          leaving
            ? {
                label: "إرسال للمراجعة",
                // Leaves only when the product was sent; a missing field keeps the page open with its message.
                onClick: () => {
                  void leaving.save().then((sent) => {
                    if (sent) leaving.proceed();
                  });
                },
              }
            : undefined
        }
      />
    </div>
  );
}
