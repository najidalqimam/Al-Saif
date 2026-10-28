import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Flame, Heart, Moon, Search, ShoppingCart, Sun, Truck } from "lucide-react";
import { useTheme } from "next-themes";
import { Link, useLocation } from "wouter";
import { CartDrawer } from "@/components/site/CartDrawer";
import { CategoryMenu } from "@/components/site/CategoryMenu";
import { useCart } from "@/lib/cart";
import { useFavorites } from "@/lib/favorites";
import { categoryLabel, categoryTrail, rootDepartments } from "@/lib/catalog";
import { useLang } from "@/lib/i18n";
import { useSiteContent } from "@/lib/site-content";
import { useIsLight } from "@/lib/theme";

export function SiteHeader() {
  const { t, lang, dir, otherHref } = useLang();
  const { content } = useSiteContent();
  const [location] = useLocation();
  const { count, setOpen } = useCart();
  const { count: favoritesCount } = useFavorites();
  const departments = rootDepartments(content.categoryHidden);
  const currentSlug = location.split("/c/")[1]?.split("/")[0];
  const activeRoot = currentSlug ? categoryTrail(currentSlug)[0]?.slug : undefined;
  const light = useIsLight();
  const { setTheme } = useTheme();
  // Dark theme: the header is always the dark Midnight Circuit bar. Light theme: always the blue-gray bar.
  const overHero = !light;
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
            <span>{t.top.track}</span>
            <Link
              href={otherHref}
              className={`transition ${overHero ? "text-white hover:text-mint" : "text-ink-soft hover:text-brand-ink"}`}
            >
              {t.switchTo}
            </Link>
          </div>
          <Link
            href={otherHref}
            className={`inline-flex min-h-8 items-center sm:hidden ${overHero ? "text-white" : "text-ink-soft"}`}
          >
            {t.switchTo}
          </Link>
        </div>
      </div>

      <header
        className={`sticky top-0 z-40 overflow-visible border-b transition-colors duration-300 ${
          overHero
            ? "surface-dark border-white/10 bg-[color-mix(in_srgb,var(--chrome)_72%,transparent)] text-white shadow-none backdrop-blur-xl backdrop-saturate-150"
            : light
              ? "border-navy/10 bg-[color-mix(in_srgb,var(--chrome)_94%,transparent)] text-navy shadow-[0_6px_18px_rgba(11,18,32,0.05)] backdrop-blur-xl"
              : "border-navy/10 bg-white/95 text-navy shadow-[0_8px_24px_rgba(11,18,32,0.06)] backdrop-blur"
        }`}
      >
      <div className="page-shell flex flex-wrap items-center gap-3 py-2.5">
        <Link href={`/${lang}`} className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-brand text-lg font-bold text-navy">
            {lang === "ar" ? "س" : "E"}
          </span>
          <span className="leading-tight">
            <span className={`block whitespace-nowrap text-base font-semibold sm:text-lg ${overHero ? "text-white" : "text-navy"}`}>
              {t.brand}
            </span>
            {t.tagline ? (
              <span className={`block text-xs ${overHero ? "text-white/70" : "text-ink-mute"}`}>{t.tagline}</span>
            ) : null}
          </span>
        </Link>

        <form
          className="order-last w-full md:order-none md:min-w-0 md:flex-1"
          role="search"
          onSubmit={(event) => event.preventDefault()}
        >
          <label className="relative block">
            <span className="sr-only">{t.searchLabel}</span>
            <Search
              className={`pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 ${
                overHero ? "text-white/60" : "text-ink-mute"
              }`}
            />
            <input
              type="search"
              placeholder={t.searchPlaceholder}
              className={`h-11 w-full rounded-full border ps-11 pe-4 text-sm outline-none transition duration-300 placeholder:transition-colors focus:border-brand ${
                overHero
                  ? "border-white/20 bg-white/10 text-white placeholder:text-white/65 focus:bg-white/15"
                  : light
                    ? "border-navy/15 bg-white/70 text-navy placeholder:text-ink-mute focus:bg-white"
                    : "border-navy/15 bg-[#f4f7fb] text-navy placeholder:text-ink-mute focus:bg-white"
              }`}
            />
          </label>
        </form>

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
          <Link
            href={otherHref}
            aria-label={t.switchTo}
            lang={lang === "ar" ? "en" : "ar"}
            className={`hidden size-11 sm:grid cursor-pointer place-items-center rounded-full border text-sm font-bold transition duration-300 ${
              overHero
                ? "border-white/25 text-white hover:border-mint hover:text-mint"
                : "border-navy/15 text-ink-soft hover:border-brand hover:text-brand-ink"
            }`}
          >
            {lang === "ar" ? "EN" : "ع"}
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
            onClick={() => setOpen(true)}
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

      <nav className="page-shell flex items-center gap-2 pb-2" aria-label={t.allCategories}>
        <CategoryMenu />
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
    </>
  );
}
