import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Flame,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  X,
} from "lucide-react";
import { Link } from "wouter";
import { RailTrack, useRail, useRailAutoplay } from "@/components/site/ScrollRail";
import { ProductCard } from "@/components/site/showcase";
import { useCart } from "@/lib/cart";
import { useFavorites } from "@/lib/favorites";
import { useLang } from "@/lib/i18n";
import { offerDetail } from "@/lib/offer-details";
import { OFFER_PRODUCTS, productPhoto, type OfferProduct } from "@/lib/products";
import { useSiteContent } from "@/lib/site-content";
import { useIsLight } from "@/lib/theme";

export { OFFER_PRODUCTS, type OfferProduct };

function endOfToday() {
  const end = new Date();
  end.setHours(24, 0, 0, 0);
  return end.getTime();
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function useCountdown() {
  const [target, setTarget] = useState(endOfToday);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = Math.max(0, target - now);
  useEffect(() => {
    if (remaining === 0) setTarget(endOfToday());
  }, [remaining]);

  return {
    hours: Math.floor(remaining / 3_600_000),
    minutes: Math.floor((remaining % 3_600_000) / 60_000),
    seconds: Math.floor((remaining % 60_000) / 1000),
  };
}

function money(value: number) {
  return value.toLocaleString("en-US");
}

export function Offers() {
  const { t, dir, lang } = useLang();
  const { content, visibleProducts } = useSiteContent();
  const deals = content.deals[lang];
  const countdown = useCountdown();
  const light = useIsLight();

  return (
    <section className="ambient-edge tone-a tone-swap-light section-y" aria-labelledby="offers-title">
      <div className="page-shell">
        <div className="reveal">
          <div
            className={`relative isolate overflow-hidden rounded-[1.5rem] px-6 py-5 sm:px-10 sm:py-6 lg:px-12 ${
              light ? "border border-navy/10 text-navy" : "surface-dark text-white"
            }`}
            style={{ background: "var(--tone-promo)" }}
          >
            <div aria-hidden className="pointer-events-none absolute -end-20 -top-28 -z-10 size-80 rounded-full bg-cyan/20 blur-3xl" />
            <div aria-hidden className="led-strip absolute inset-x-0 top-0 -z-10" />
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <p className={`flex items-center gap-2 text-sm font-semibold ${light ? "text-brand-ink" : "text-gold"}`}>
                  <Flame className="size-4" aria-hidden />
                  {deals.eyebrow}
                </p>
                <h2
                  id="offers-title"
                  className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-2xl font-bold leading-tight sm:text-4xl"
                >
                  <span>{deals.title}</span>
                  <span className={`whitespace-nowrap ${light ? "text-brand-ink" : "text-gold"}`}>{deals.highlight}</span>
                </h2>
                <p className={`mt-2 max-w-xl text-sm leading-7 ${light ? "text-navy/75" : "text-white/80"}`}>{deals.lead}</p>
                <Link
                  href={`/${lang}/offers`}
                  className={`mt-4 inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold text-navy transition-colors ${
                    light ? "bg-[#20C5D4] hover:bg-brand-hover" : "bg-[#fff] hover:bg-mint"
                  }`}
                >
                  {t.deals.viewAll}
                  {dir === "rtl" ? <ArrowLeft className="size-4" aria-hidden /> : <ArrowRight className="size-4" aria-hidden />}
                </Link>
              </div>
              <div
                role="timer"
                aria-label={t.deals.endsSoon}
                className={`flex w-fit flex-col gap-2 rounded-2xl border px-4 py-3.5 backdrop-blur-sm sm:flex-row sm:items-center sm:gap-4 ${
                  light ? "border-navy/10 bg-white/70" : "border-white/15 bg-black/25"
                }`}
              >
                <span className={`flex items-center gap-2 text-sm font-medium ${light ? "text-navy/85" : "text-white/90"}`}>
                  <Clock className={`size-4 ${light ? "text-brand-ink" : "text-gold"}`} aria-hidden />
                  {t.deals.endsSoon}
                </span>
                <div dir="ltr" className="flex items-center gap-1.5 tabular-nums">
                  {[countdown.hours, countdown.minutes, countdown.seconds].map((value, index) => (
                    <span key={index} className="flex items-center gap-1.5">
                      {index > 0 ? <span className={light ? "text-navy/40" : "text-white/50"}>:</span> : null}
                      <span className={`grid min-w-11 place-items-center rounded-lg px-2 py-1.5 text-xl font-bold ${light ? "bg-navy/[0.06]" : "bg-[rgb(255_255_255/0.1)] text-mint"}`}>
                        {pad(value)}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <OfferGrid products={visibleProducts("home")} rail />
      </div>
    </section>
  );
}

export function OfferGrid({ products, rail = false }: { products: readonly OfferProduct[]; rail?: boolean }) {
  const { t, lang } = useLang();
  const { copyOf } = useSiteContent();
  const railState = useRail();
  useRailAutoplay(railState.trackRef, rail ? 28 : 0);
  const { has, toggle } = useFavorites();
  const [openId, setOpenId] = useState<string | null>(null);
  const openProduct = products.find((item) => item.id === openId) ?? null;

  const renderCard = (product: OfferProduct, duplicate = false) => {
    const copy = copyOf(lang, product.id) ?? t.deals.products[product.id];
    return (
      <ProductCard
        product={product}
        name={copy?.name ?? ""}
        category={copy?.category ?? ""}
        liked={has(product.id)}
        onOpen={() => setOpenId(product.id)}
        onToggleSave={() => toggle(product.id)}
        duplicate={duplicate}
      />
    );
  };

  const cards = rail
    ? [
        ...products.map((product) => (
          <div key={product.id} className="rail__item">
            {renderCard(product)}
          </div>
        )),
        // A second, hidden-from-assistive-tech set so the auto-scrolling rail can loop seamlessly.
        ...products.map((product, index) => (
          <div key={`copy-${product.id}`} className="rail__item" data-rail-copy={index === 0 ? "" : undefined}>
            {renderCard(product, true)}
          </div>
        )),
      ]
    : products.map((product) => <div key={product.id}>{renderCard(product)}</div>);

  return (
    <>
      {rail ? (
        <div className="rail-bleed mt-6">
          <div className="reveal">
            <RailTrack trackRef={railState.trackRef} label={t.deals.pageTitle}>
              {cards}
            </RailTrack>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">{cards}</div>
      )}
      {openProduct ? (
        <ProductDialog
          product={openProduct}
          liked={has(openProduct.id)}
          onClose={() => setOpenId(null)}
          onToggleSave={() => toggle(openProduct.id)}
        />
      ) : null}
    </>
  );
}

export function ProductDialog({
  product,
  liked,
  onClose,
  onToggleSave,
}: {
  product: OfferProduct;
  liked: boolean;
  onClose: () => void;
  onToggleSave: () => void;
}) {
  const { t, lang } = useLang();
  const { copyOf } = useSiteContent();
  const { add } = useCart();
  const titleId = useId();
  const [qty, setQty] = useState(1);
  const copy = copyOf(lang, product.id) ?? t.deals.products[product.id];
  const detail = offerDetail(lang, product.id);
  const percent = Math.round((1 - product.price / product.compareAt) * 100);
  const savedAmount = product.compareAt - product.price;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // Portal to <body>: the dialog must not inherit the stacking context of the section it was opened from,
  // otherwise the sticky header (z-40) paints over its top edge.
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-navy/40 p-4 backdrop-blur-md" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        className="relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto overscroll-contain rounded-3xl bg-white p-5 shadow-2xl sm:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t.deals.close}
          autoFocus
          className="absolute end-4 top-4 z-20 grid size-10 cursor-pointer place-items-center rounded-full bg-white text-ink-soft hover:bg-navy/5"
        >
          <X className="size-5" />
        </button>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <p className="text-sm font-semibold text-brand-ink">{copy?.category}</p>
            <h2 id={titleId} className="mt-2 pe-8 text-2xl font-bold leading-snug text-navy">
              {copy?.name}
            </h2>
            {product.rating > 0 ? (
              <p className="mt-3 flex items-center gap-1 text-sm">
                <Star className="size-4 fill-gold text-gold" />
                <span className="font-semibold text-brand-ink">{product.rating.toFixed(1)}</span>
                <span className="text-ink-mute">({t.deals.reviews.replace("{count}", String(product.reviews))})</span>
              </p>
            ) : null}
            <p className="mt-3 flex items-center gap-2 text-sm font-medium text-brand-ink">
              <Check className="size-4" />
              {t.deals.inStock}
            </p>

            <div className="mt-4 rounded-2xl bg-[#eef4fc] px-4 py-3">
              {savedAmount > 0 ? (
                <span className="mb-2 inline-flex rounded-full bg-cyan/20 px-3 py-1 text-xs font-semibold text-brand-ink">
                  {t.deals.savedAmount
                    .replace("{amount}", money(savedAmount))
                    .replace("{currency}", t.deals.currency)}
                </span>
              ) : null}
              <div className="flex flex-wrap items-end gap-3">
                <p className="text-3xl font-bold text-brand-ink">
                  {money(product.price)} {t.deals.currency}
                </p>
                {savedAmount > 0 ? (
                  <p className="pb-1 text-sm text-ink-mute line-through">
                    {money(product.compareAt)} {t.deals.currency}
                  </p>
                ) : null}
              </div>
            </div>

            <h3 className="mt-5 text-sm font-semibold text-navy">{t.deals.featuresTitle}</h3>
            <ul className="mt-2 space-y-2">
              {detail?.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-ink-soft">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand-ink" />
                  {feature}
                </li>
              ))}
            </ul>

            <h3 className="mt-5 text-sm font-semibold text-navy">{t.deals.specsTitle}</h3>
            <dl className="mt-2 grid grid-cols-2 gap-2">
              {detail?.specs.map(([label, value]) => (
                <div key={label} className="rounded-xl bg-[#f1f5fa] px-3 py-2">
                  <dt className="text-[11px] text-ink-mute">{label}</dt>
                  <dd className="text-sm font-medium text-navy">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                aria-pressed={liked}
                aria-label={t.wishlist}
                onClick={onToggleSave}
                className={`grid size-12 place-items-center rounded-xl border bg-white ${
                  liked ? "border-brand-ink text-brand-ink" : "border-navy/10 text-ink-soft"
                }`}
              >
                <Heart className={`size-5 ${liked ? "fill-brand-ink" : ""}`} />
              </button>
              <button
                type="button"
                onClick={() => {
                  add(product.id, qty);
                  toast.success(t.cartAdded.replace("{name}", copy?.name ?? ""));
                }}
                className="inline-flex h-12 min-w-40 flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-navy transition-colors hover:bg-brand-hover"
              >
                <ShoppingCart className="size-4" />
                {t.deals.addToCart}
              </button>
              <div className="inline-flex h-12 items-center rounded-xl border border-navy/10">
                <button
                  type="button"
                  aria-label={t.deals.decrease}
                  disabled={qty === 1}
                  onClick={() => setQty((value) => Math.max(1, value - 1))}
                  className="grid size-10 place-items-center text-navy disabled:text-navy/30"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-8 text-center text-sm font-semibold text-navy">{qty}</span>
                <button
                  type="button"
                  aria-label={t.deals.increase}
                  onClick={() => setQty((value) => value + 1)}
                  className="grid size-10 place-items-center text-navy"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-ink-mute">{t.deals.shippingNote}</p>
            <p className="text-xs leading-5 text-ink-mute">{t.deals.warrantyNote}</p>
          </div>

          <div className="order-1 lg:order-2">
            {/* Plain white image well, matching the product cards. */}
            <div className="relative h-64 overflow-hidden rounded-2xl border border-navy/10 bg-white sm:h-80">
              {percent > 0 ? (
                <span className="absolute start-3 top-3 z-10 rounded-lg bg-burgundy px-2.5 py-1 text-xs font-semibold text-white">
                  {t.deals.saveBadge.replace("{percent}", String(percent))}
                </span>
              ) : null}
              <img
                src={productPhoto(product)}
                alt={copy?.name ?? ""}
                className="absolute inset-0 h-full w-full object-contain p-6 drop-shadow-[0_10px_8px_rgba(11,18,32,0.16)]"
              />
            </div>
            <p className="mt-3 flex items-center gap-2 text-sm font-medium text-brand-ink">
              <ShieldCheck className="size-4" />
              {t.deals.original}
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
