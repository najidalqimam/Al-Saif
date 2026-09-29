import { useEffect, useId, useState } from "react";
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
import { ProductStage } from "@/components/site/ProductStage";
import { ProductCard } from "@/components/site/showcase";
import { bannerBackground } from "@/lib/banner";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/i18n";
import { offerDetail } from "@/lib/offer-details";
import { OFFER_PRODUCTS, type OfferProduct } from "@/lib/products";
import { useSiteContent } from "@/lib/site-content";

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
  const gradient = bannerBackground(dir);

  return (
    <section className="ambient-edge bg-white py-8" aria-labelledby="offers-title">
      <div className="reveal mx-auto max-w-7xl px-4">
        <div
          className="flex flex-col gap-6 rounded-[28px] px-5 py-7 text-white sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10"
          style={{ background: gradient }}
        >
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-sm font-medium text-gold">
              <Flame className="size-4" />
              {deals.eyebrow}
            </p>
            <h2 id="offers-title" className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-2xl font-bold leading-tight sm:text-4xl">
              <span>{deals.title}</span>
              <span className="whitespace-nowrap text-gold">{deals.highlight}</span>
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-white/70">{deals.lead}</p>
          </div>
          <div className="inline-flex w-fit items-center gap-3 rounded-2xl bg-black/30 px-4 py-3">
            <span className="text-sm text-white/80">{t.deals.endsSoon}</span>
            <div dir="ltr" className="flex items-center gap-1.5 text-lg font-semibold tabular-nums">
              <Clock className="size-4 text-gold" />
              <span>{pad(countdown.hours)}</span>
              <span className="text-white/40">:</span>
              <span>{pad(countdown.minutes)}</span>
              <span className="text-white/40">:</span>
              <span>{pad(countdown.seconds)}</span>
            </div>
          </div>
        </div>
      </div>

      <OfferGrid products={visibleProducts("home")} marquee />

      <div className="mx-auto mt-8 flex max-w-7xl justify-center px-4">
          <Link
            href={`/${lang}/offers`}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-emerald px-6 text-sm font-medium text-white"
          >
            {t.deals.viewAll}
            {dir === "rtl" ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
          </Link>
        </div>
    </section>
  );
}

export function OfferGrid({ products, marquee = false }: { products: readonly OfferProduct[]; marquee?: boolean }) {
  const { t, lang } = useLang();
  const { copyOf } = useSiteContent();
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const openProduct = products.find((item) => item.id === openId) ?? null;

  const cards = (copyIndex: number) =>
    products.map((product) => {
      const copy = copyOf(lang, product.id) ?? t.deals.products[product.id];
      return (
        <div key={`${product.id}-${copyIndex}`} className={marquee ? "w-[17.5rem] shrink-0" : undefined}>
          <ProductCard
            product={product}
            name={copy?.name ?? ""}
            category={copy?.category ?? ""}
            liked={saved[product.id] ?? false}
            onOpen={() => setOpenId(product.id)}
            onToggleSave={() => setSaved((current) => ({ ...current, [product.id]: !current[product.id] }))}
          />
        </div>
      );
    });

  return (
    <>
    {marquee ? (
      <div className="offers-rail reveal mt-6 w-full overflow-hidden py-3">
        <div className="offers-marquee flex w-max">
          {[0, 1].map((copyIndex) => (
            <div
              key={copyIndex}
              className="flex shrink-0 gap-4 pe-4"
              aria-hidden={copyIndex === 1 || undefined}
              inert={copyIndex === 1 || undefined}
            >
              {cards(copyIndex)}
            </div>
          ))}
        </div>
      </div>
    ) : (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards(0)}
    </div>
    )}
    {openProduct ? (
      <ProductDialog
        product={openProduct}
        liked={saved[openProduct.id] ?? false}
        onClose={() => setOpenId(null)}
        onToggleSave={() =>
          setSaved((current) => ({ ...current, [openProduct.id]: !current[openProduct.id] }))
        }
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-md" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t.deals.close}
          className="absolute end-4 top-4 z-20 grid size-9 place-items-center rounded-full bg-white text-navy/60 hover:bg-navy/5"
        >
          <X className="size-5" />
        </button>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <p className="text-sm font-semibold text-emerald">{copy?.category}</p>
            <h2 id={titleId} className="mt-2 pe-8 text-2xl font-bold leading-snug text-navy">
              {copy?.name}
            </h2>
            <p className="mt-3 flex items-center gap-1 text-sm">
              <Star className="size-4 fill-gold text-gold" />
              <span className="font-semibold text-emerald">{product.rating.toFixed(1)}</span>
              <span className="text-navy/45">({t.deals.reviews.replace("{count}", String(product.reviews))})</span>
            </p>
            <p className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald">
              <Check className="size-4" />
              {t.deals.inStock}
            </p>

            <div className="mt-4 rounded-2xl bg-[#f3faf6] px-4 py-3">
              <span className="inline-flex rounded-full bg-emerald/15 px-3 py-1 text-xs font-semibold text-emerald">
                {t.deals.savedAmount
                  .replace("{amount}", money(savedAmount))
                  .replace("{currency}", t.deals.currency)}
              </span>
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <p className="text-3xl font-bold text-emerald">
                  {money(product.price)} {t.deals.currency}
                </p>
                <p className="pb-1 text-sm text-navy/35 line-through">
                  {money(product.compareAt)} {t.deals.currency}
                </p>
              </div>
            </div>

            <h3 className="mt-5 text-sm font-semibold text-navy">{t.deals.featuresTitle}</h3>
            <ul className="mt-2 space-y-2">
              {detail?.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-navy/75">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald" />
                  {feature}
                </li>
              ))}
            </ul>

            <h3 className="mt-5 text-sm font-semibold text-navy">{t.deals.specsTitle}</h3>
            <dl className="mt-2 grid grid-cols-2 gap-2">
              {detail?.specs.map(([label, value]) => (
                <div key={label} className="rounded-xl bg-[#f4f7f6] px-3 py-2">
                  <dt className="text-[11px] text-navy/45">{label}</dt>
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
                  liked ? "border-emerald text-emerald" : "border-navy/10 text-navy/55"
                }`}
              >
                <Heart className={`size-5 ${liked ? "fill-emerald" : ""}`} />
              </button>
              <button
                type="button"
                onClick={() => {
                  add(product.id, qty);
                  toast.success(t.cartAdded.replace("{name}", copy?.name ?? ""));
                }}
                className="inline-flex h-12 min-w-40 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald px-4 text-sm font-semibold text-white"
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
                  className="grid size-10 place-items-center text-navy disabled:text-navy/25"
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

            <p className="mt-4 text-xs leading-5 text-navy/45">{t.deals.shippingNote}</p>
            <p className="text-xs leading-5 text-navy/45">{t.deals.warrantyNote}</p>
          </div>

          <div className="order-1 lg:order-2">
            <ProductStage id={product.id} alt={copy?.name ?? ""} size="lg">
              <span className="absolute start-3 top-3 z-10 rounded-lg bg-burgundy px-2.5 py-1 text-xs font-semibold text-white">
                {t.deals.saveBadge.replace("{percent}", String(percent))}
              </span>
            </ProductStage>
            <p className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald">
              <ShieldCheck className="size-4" />
              {t.deals.original}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
