import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Boxes, Flame, Heart, Moon, ShoppingCart, Sun, Truck, UserRound } from "lucide-react";
import { useTheme } from "next-themes";
import { Link, useLocation } from "wouter";
import { AuthModal } from "@/components/site/AuthModal";
import { CartDrawer } from "@/components/site/CartDrawer";
import { CategoryMenu } from "@/components/site/CategoryMenu";
import { SearchBox } from "@/components/site/SearchBox";
import { useCart } from "@/lib/cart";
import { ACCOUNT_COPY } from "@/lib/account-copy";
import { Avatar } from "@/lib/avatars";
import { useCustomer } from "@/lib/customer";
import { useFavorites } from "@/lib/favorites";
import { categoryLabel, categoryTrail, rootDepartments } from "@/lib/catalog";
import { BrandMark, useBrandText } from "@/components/site/Brand";
import { useLang, type Lang } from "@/lib/i18n";
import { LANG_META, LANGS } from "@/lib/locale";
import { useSiteContent } from "@/lib/site-content";
import { useIsLight } from "@/lib/theme";

export function SiteHeader() {
  const { t, lang, dir, localeHref } = useLang();
  const [langOpen, setLangOpen] = useState(false);
  const [langPos, setLangPos] = useState<{ top: number; left: number } | null>(null);
  const langBtnRef = useRef<HTMLButtonElement>(null);
  const langMenuRef = useRef<HTMLUListElement>(null);
  const brand = useBrandText();
  const { content } = useSiteContent();
  const [location, navigate] = useLocation();
  const { count } = useCart();
  const { count: favoritesCount } = useFavorites();
  const { customer } = useCustomer();
  const accountCopy = ACCOUNT_COPY[lang];
  const departments = rootDepartments(content.categoryHidden);
  const currentSlug = location.split("/c/")[1]?.split("/")[0];
  const activeRoot = currentSlug ? categoryTrail(currentSlug)[0]?.slug : undefined;
  const light = useIsLight();
  const { setTheme } = useTheme();
  // Dark theme: the header is always the dark Midnight Circuit bar. Light theme: always the blue-gray bar.
  const overHero = !light;
  // Light theme, home page: the bar keeps the hero's tone while the hero is under it, and turns white once the page has
  // scrolled past the hero. Pages without a hero keep the bar as it was.
  const [pastHero, setPastHero] = useState(false);
  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) {
      setPastHero(false);
      return;
    }
    const update = () => setPastHero(hero.getBoundingClientRect().bottom <= (document.querySelector("header.sticky")?.clientHeight ?? 130));
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [location]);
  const [authOpen, setAuthOpen] = useState(false);
  useEffect(() => {
    if (customer) setAuthOpen(false);
  }, [customer]);
  const [cartPulse, setCartPulse] = useState(false);
  const previousCount = useRef(count);

  useEffect(() => {
    if (count > previousCount.current) {
      setCartPulse(true);
      const timer = window.setTimeout(() => setCartPulse(false), 520);
      previousCount.current = count;
      return () => window.clearTimeout(timer);
    }
    previousCount.current = count;
  }, [count]);

  // Portal the menu to <body>: a dropdown inside a blurred sticky header paints a ghost copy in some browsers.
  useLayoutEffect(() => {
    if (!langOpen) {
      setLangPos(null);
      return;
    }
    function place() {
      const btn = langBtnRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const width = 144;
      const left = dir === "rtl" ? Math.max(8, rect.right - width) : Math.min(window.innerWidth - width - 8, rect.left);
      setLangPos({ top: rect.bottom + 8, left });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [langOpen, dir]);

  useEffect(() => {
    if (!langOpen) return;
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (langBtnRef.current?.contains(target) || langMenuRef.current?.contains(target)) return;
      setLangOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setLangOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [langOpen]);

  return (
    <>
      <a href="#main" className="skip-link">
        {t.skipToContent}
      </a>
      <div
        className={`border-b transition-colors duration-300 ${
          overHero
            ? "surface-dark border-white/10 bg-[var(--chrome)] text-white"
            : light
              ? "border-navy/10 bg-[var(--chrome)] text-navy"
              : "border-navy/10 bg-[#f4f7fb] text-navy"
        }`}
      >
        <div
          className={`page-shell flex items-center justify-between gap-4 py-1.5 text-[13px] transition-colors duration-300 ${
            overHero ? "text-white/85" : "text-ink-soft"
          }`}
        >
          <p className="flex min-w-0 items-center gap-2">
            <Truck className={`size-3.5 shrink-0 ${overHero ? "text-cyan" : "text-brand-ink"}`} />
            <span className="truncate">{t.top.shipping}</span>
          </p>
          <div className="hidden items-center gap-5 sm:flex">
            <span>{t.top.warranty}</span>
            <Link href={`/${lang}/track`} className={`transition ${overHero ? "hover:text-mint" : "hover:text-brand-ink"}`}>
              {t.top.track}
            </Link>
          </div>
        </div>
      </div>

      <header
        className={`sticky top-0 z-40 overflow-visible border-b transition-colors duration-300 ${
          overHero
            ? "surface-dark border-white/10 bg-[color-mix(in_srgb,var(--chrome)_72%,transparent)] text-white shadow-none backdrop-blur-xl backdrop-saturate-150"
            : light
              ? `border-navy/10 text-navy shadow-[0_6px_18px_rgba(11,18,32,0.05)] backdrop-blur-xl ${pastHero ? "bg-white/95" : "bg-[color-mix(in_srgb,var(--chrome)_94%,transparent)]"}`
              : "border-navy/10 bg-white/95 text-navy shadow-[0_8px_24px_rgba(11,18,32,0.06)] backdrop-blur"
        }`}
      >
      <div className="page-shell flex flex-wrap items-center gap-3 py-2.5">
        <Link href={`/${lang}`} className="flex items-center gap-3">
          <BrandMark />
          <span className="leading-tight">
            <span className={`block whitespace-nowrap text-base font-semibold sm:text-lg ${overHero ? "text-white" : "text-navy"}`}>
              {brand.name}
            </span>
            {brand.tagline ? (
              <span className={`block text-xs ${overHero ? "text-white/70" : "text-ink-mute"}`}>{brand.tagline}</span>
            ) : null}
          </span>
        </Link>

        <SearchBox overHero={overHero} light={light} />

        <div className="ms-auto flex items-center gap-2 md:ms-0">
          <button
            type="button"
            onClick={() => setTheme(light ? "dark" : "light")}
            aria-label={light ? t.themeToDark : t.themeToLight}
            aria-pressed={light}
            className={`grid size-11 cursor-pointer place-items-center rounded-full border transition duration-300 ${
              overHero
                ? "border-white/25 text-white hover:border-mint hover:text-mint"
                : "border-navy/15 text-ink-soft hover:border-brand hover:text-brand-ink"
            }`}
          >
            {light ? <Moon className="size-5" aria-hidden /> : <Sun className="size-5" aria-hidden />}
          </button>
          <div className="relative">
            <button
              ref={langBtnRef}
              type="button"
              onClick={() => setLangOpen((open) => !open)}
              aria-label={t.switchTo}
              aria-expanded={langOpen}
              aria-haspopup="listbox"
              className={`grid size-11 cursor-pointer place-items-center rounded-full border text-[11px] font-bold transition duration-300 ${
                overHero
                  ? "border-white/25 text-white hover:border-mint hover:text-mint"
                  : "border-navy/15 text-ink-soft hover:border-brand hover:text-brand-ink"
              }`}
            >
              {LANG_META[lang].short}
            </button>
            {langOpen && langPos
              ? createPortal(
                  <ul
                    ref={langMenuRef}
                    role="listbox"
                    dir={dir}
                    style={{ top: langPos.top, left: langPos.left }}
                    className="fixed z-[200] min-w-36 overflow-hidden rounded-xl border border-navy/10 bg-white py-1 text-navy shadow-lg"
                  >
                    {LANGS.map((code: Lang) => (
                      <li key={code} role="option" aria-selected={code === lang}>
                        <Link
                          href={localeHref(code)}
                          onClick={() => setLangOpen(false)}
                          className={`block px-3 py-2 text-sm transition hover:bg-navy/5 ${code === lang ? "font-bold text-brand-ink" : ""}`}
                        >
                          {LANG_META[code].native}
                        </Link>
                      </li>
                    ))}
                  </ul>,
                  document.body,
                )
              : null}
          </div>
          {/* Signed in: the account page. Signed out: sign in or register. */}
          <Link
            href={customer ? `/${lang}/account` : `/${lang}/login`}
            aria-label={customer ? accountCopy.myAccount : accountCopy.signIn}
            aria-current={location.startsWith(`/${lang}/account`) || location === `/${lang}/login` ? "page" : undefined}
            aria-haspopup={customer || location === `/${lang}/login` ? undefined : "dialog"}
            onClick={(event) => {
              // Signed out: open the card over this page. Modified clicks and the login page itself keep the normal link.
              if (customer || location === `/${lang}/login` || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              setAuthOpen(true);
            }}
            className={`flex h-11 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm font-semibold transition duration-300 ${
              overHero
                ? "border-white/25 text-white hover:border-mint hover:text-mint"
                : "border-navy/15 text-ink-soft hover:border-brand hover:text-brand-ink"
            }`}
          >
            {customer ? (
              <Avatar avatar={customer.avatar} firstName={customer.firstName} lastName={customer.lastName} className="-ms-1.5 size-8 text-xs" />
            ) : (
              <UserRound className="size-5" />
            )}
            <span className="hidden max-w-28 truncate lg:inline">{customer ? customer.firstName : accountCopy.signIn}</span>
          </Link>
          <Link
            href={`/${lang}/favorites`}
            aria-label={favoritesCount > 0 ? `${t.wishlist} ${favoritesCount}` : t.wishlist}
            aria-current={location === `/${lang}/favorites` ? "page" : undefined}
            className={`wish-btn relative grid size-11 cursor-pointer place-items-center rounded-full border transition duration-300 ${
              overHero
                ? "border-white/25 text-white hover:border-mint hover:text-mint"
                : "border-navy/15 text-ink-soft hover:border-brand hover:text-brand-ink"
            }`}
          >
            <Heart className={`size-5 ${favoritesCount > 0 ? (overHero ? "fill-mint text-mint" : "fill-brand-ink text-brand-ink") : ""}`} />
            {favoritesCount > 0 ? (
              <span className="absolute -end-1 -top-1 grid min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold leading-4 text-[#0b1220] shadow-sm">
                {favoritesCount}
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            onClick={() => navigate(`/${lang}/cart`)}
            aria-label={count > 0 ? `${t.cart} ${count}` : t.cart}
            className={`group flex h-11 cursor-pointer items-center gap-2.5 rounded-full border pe-3 ps-1.5 transition-colors duration-300 ${
              overHero ? "border-white/25 text-white hover:border-mint" : "border-navy/15 text-navy hover:border-brand"
            }`}
          >
            <span className={`relative grid size-8 place-items-center rounded-full bg-brand text-navy ${cartPulse ? "cart-pulse" : ""}`}>
              <ShoppingCart className="size-4" />
              {count > 0 ? (
                <span className="absolute -end-1 -top-1 grid min-w-4 place-items-center rounded-full bg-white px-1 text-[10px] font-bold leading-4 text-[#0b1220] shadow-sm">
                  {count}
                </span>
              ) : null}
            </span>
            <span className="hidden text-start leading-tight sm:block">
              <span className="block text-sm font-semibold">{t.cart}</span>
              <span className={`block text-xs ${overHero ? "text-white/70" : "text-ink-mute"}`}>
                {count > 0 ? t.cartCount.replace("{count}", String(count)) : t.cartEmpty}
              </span>
            </span>
            <span className="inline-flex w-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:w-4 group-hover:opacity-100">
              <ArrowLeft className={`size-4 shrink-0 ${dir === "ltr" ? "rotate-180" : ""}`} />
            </span>
          </button>
        </div>
      </div>

      {/* max-sm:flex-wrap: on phones the links that no longer fit on one line go to a second line instead of overflowing the page. */}
      <nav className="page-shell flex items-center gap-2 pb-2 max-sm:flex-wrap" aria-label={t.allCategories}>
        <CategoryMenu />
        {/* Fixed right after "all departments", before the offers link, so it shows without scrolling the departments. */}
        <Link
          href={`/${lang}/wholesale`}
          aria-current={location === `/${lang}/wholesale` ? "page" : undefined}
          className="wholesale-nav inline-flex shrink-0 items-center gap-1.5 px-2 py-2.5 text-sm font-semibold text-brand"
        >
          <Boxes className="size-4 shrink-0" aria-hidden />
          <span className="whitespace-nowrap">{t.wholesale.navLabel}</span>
        </Link>
        <Link
          href={`/${lang}/offers`}
          aria-current={location === `/${lang}/offers` ? "page" : undefined}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-medium transition-colors duration-300 ${
            location === `/${lang}/offers`
              ? overHero
                ? "bg-white/10 text-white"
                : "bg-brand/10 text-brand-ink"
              : overHero
                ? "text-white/90 hover:text-[#25d9e6]"
                : "text-navy/80 hover:text-brand-ink"
          }`}
        >
          <Flame className="size-5 shrink-0 text-burgundy" aria-hidden />
          {t.navOffers}
        </Link>
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto overscroll-x-contain [mask-image:linear-gradient(to_right,transparent,#000_0.75rem,#000_calc(100%-0.75rem),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {departments.map((item) => {
            const active = item.slug === activeRoot;
            return (
              <Link
                key={item.id}
                href={`/${lang}/c/${item.slug}`}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-full px-3 py-2.5 text-sm font-medium transition-colors duration-300 ${
                  active
                    ? overHero
                      ? "bg-white/10 text-white"
                      : "bg-brand/10 text-brand-ink"
                    : overHero
                      ? "text-white/90 hover:text-[#25d9e6]"
                      : "text-navy/80 hover:text-brand-ink"
                }`}
              >
                {categoryLabel(item, lang)}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
      <CartDrawer />
      <AuthModal open={authOpen && !customer} onClose={() => setAuthOpen(false)} />
    </>
  );
}
