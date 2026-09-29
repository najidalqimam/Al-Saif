import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, Flame, Heart, Search, ShoppingCart, Truck } from "lucide-react";
import { Link, useLocation } from "wouter";
import { CartDrawer } from "@/components/site/CartDrawer";
import { CategoryMenu } from "@/components/site/CategoryMenu";
import { useCart } from "@/lib/cart";
import { categoryLabel, categoryTrail, rootDepartments } from "@/lib/catalog";
import { useLang } from "@/lib/i18n";
import { useSiteContent } from "@/lib/site-content";

export function SiteHeader() {
  const { t, lang, dir, otherHref } = useLang();
  const { content } = useSiteContent();
  const [location] = useLocation();
  const { count, setOpen } = useCart();
  const departments = rootDepartments(content.categoryHidden);
  const currentSlug = location.split("/c/")[1]?.split("/")[0];
  const activeRoot = currentSlug ? categoryTrail(currentSlug)[0]?.slug : undefined;
  const [overHero, setOverHero] = useState(() => /^\/(ar|en)\/?$/.test(location));
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

  useLayoutEffect(() => {
    const hero = document.getElementById("hero");
    const header = document.querySelector("header");
    if (!hero || !header) {
      setOverHero(false);
      return;
    }
    const update = () => {
      setOverHero(hero.getBoundingClientRect().bottom > header.getBoundingClientRect().bottom - 1);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [location]);

  return (
    <>
      <div
        className={`border-b transition-colors duration-300 ${
          overHero ? "border-white/10 bg-[#062E26] text-white" : "border-navy/10 bg-[#F7F8F5] text-navy"
        }`}
      >
        <div
          className={`mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 text-[13px] transition-colors duration-300 ${
            overHero ? "text-white/80" : "text-navy/70"
          }`}
        >
          <p className="flex min-w-0 items-center gap-2">
            <Truck className="size-3.5 shrink-0 text-emerald" />
            <span className="truncate">{t.top.shipping}</span>
          </p>
          <div className="hidden items-center gap-5 sm:flex">
            <span>{t.top.warranty}</span>
            <span>{t.top.track}</span>
            <Link
              href={otherHref}
              className={`transition ${overHero ? "text-white hover:text-white" : "text-navy/70 hover:text-emerald"}`}
            >
              {t.switchTo}
            </Link>
          </div>
          <Link
            href={otherHref}
            className={`sm:hidden ${overHero ? "text-white" : "text-navy/70"}`}
          >
            {t.switchTo}
          </Link>
        </div>
      </div>

      <header
        className={`sticky top-0 z-40 overflow-visible border-b transition-colors duration-300 ${
          overHero
            ? "border-white/10 bg-[#062E26] text-white shadow-none"
            : "border-navy/10 bg-white text-navy shadow-[0_8px_24px_rgba(6,46,38,0.05)]"
        }`}
      >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4">
        <Link href={`/${lang}`} className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-emerald text-lg font-semibold text-white">
            {lang === "ar" ? "س" : "E"}
          </span>
          <span className="leading-tight">
            <span className={`block whitespace-nowrap text-base font-semibold sm:text-lg ${overHero ? "text-white" : "text-navy"}`}>
              {t.brand}
            </span>
            {t.tagline ? (
              <span className={`block text-xs ${overHero ? "text-white/60" : "text-navy/55"}`}>{t.tagline}</span>
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
                overHero ? "text-white/50" : "text-navy/40"
              }`}
            />
            <input
              type="search"
              placeholder={t.searchPlaceholder}
              className={`h-12 w-full rounded-full border ps-11 pe-4 text-sm outline-none transition duration-300 placeholder:transition-colors focus:border-emerald ${
                overHero
                  ? "border-white/15 bg-white/10 text-white placeholder:text-white/45 focus:bg-white/15"
                  : "border-navy/10 bg-[#F7F8F5] text-navy placeholder:text-navy/40 focus:bg-white"
              }`}
            />
          </label>
        </form>

        <div className="ms-auto flex items-center gap-2 md:ms-0">
          <button
            type="button"
            aria-label={t.wishlist}
            className={`wish-btn grid size-11 place-items-center rounded-full border transition duration-300 hover:border-emerald hover:text-emerald ${
              overHero ? "border-white/20 text-white" : "border-navy/10 text-navy/70"
            }`}
          >
            <Heart className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={count > 0 ? `${t.cart} ${count}` : t.cart}
            className={`group flex h-11 items-center gap-2.5 rounded-full border pe-3 ps-1.5 transition-colors duration-300 ${
              overHero ? "border-white/20 text-white" : "border-navy/10 text-navy"
            }`}
          >
            <span className={`relative grid size-8 place-items-center rounded-full bg-emerald text-white ${cartPulse ? "cart-pulse" : ""}`}>
              <ShoppingCart className="size-4" />
              {count > 0 ? (
                <span className="absolute -end-1 -top-1 grid min-w-4 place-items-center rounded-full bg-[#B8E63E] px-1 text-[10px] font-bold leading-4 text-[#062E26]">
                  {count}
                </span>
              ) : null}
            </span>
            <span className="hidden text-start leading-tight sm:block">
              <span className="block text-sm font-semibold">{t.cart}</span>
              <span className={`block text-xs ${overHero ? "text-white/55" : "text-navy/50"}`}>
                {count > 0 ? t.cartCount.replace("{count}", String(count)) : t.cartEmpty}
              </span>
            </span>
            <span className="inline-flex w-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:w-4 group-hover:opacity-100">
              <ArrowLeft className={`size-4 shrink-0 ${dir === "ltr" ? "rotate-180" : ""}`} />
            </span>
          </button>
        </div>
      </div>

      <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 pb-3" aria-label={t.allCategories}>
        <CategoryMenu />
        <Link
          href={`/${lang}/offers`}
          aria-current={location === `/${lang}/offers` ? "page" : undefined}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors duration-300 ${
            location === `/${lang}/offers`
              ? overHero
                ? "bg-white/10 text-white"
                : "bg-emerald/10 text-emerald"
              : overHero
                ? "text-white/90 hover:text-[#B8E63E]"
                : "text-navy/75 hover:text-emerald"
          }`}
        >
          <Flame className="size-5 shrink-0 text-burgundy" aria-hidden />
          {t.navOffers}
        </Link>
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-color:#00A878_transparent]">
          {departments.map((item) => {
            const active = item.slug === activeRoot;
            return (
              <Link
                key={item.id}
                href={`/${lang}/c/${item.slug}`}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-full px-3 py-2 text-sm font-medium transition-colors duration-300 ${
                  active
                    ? overHero
                      ? "bg-white/10 text-white"
                      : "bg-emerald/10 text-emerald"
                    : overHero
                      ? "text-white/90 hover:text-[#B8E63E]"
                      : "text-navy/75 hover:text-emerald"
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
