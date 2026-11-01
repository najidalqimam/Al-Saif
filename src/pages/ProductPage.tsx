import { useState } from "react";
import { Check, Heart, Minus, Plus, ShieldCheck, ShoppingCart, Star, Store, Tag, Truck, Wallet, Zap } from "lucide-react";
import { Link, Redirect, useLocation } from "wouter";
import { toast } from "sonner";
import { useBrandText } from "@/components/site/Brand";
import { OfferGrid, type OfferProduct } from "@/components/site/Offers";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { useCart } from "@/lib/cart";
import { categoryLabel, categoryTrail } from "@/lib/catalog";
import { useFavorites } from "@/lib/favorites";
import { useLang } from "@/lib/i18n";
import { offerDetail } from "@/lib/offer-details";
import { productCategoryOf, productInCategory } from "@/lib/product-categories";
import { productPhoto } from "@/lib/products";
import { useSiteContent } from "@/lib/site-content";

const PERK_ICONS = [Truck, ShieldCheck, Tag, Wallet];
const RELATED_LIMIT = 5;

function money(value: number) {
  return value.toLocaleString("en-US");
}

/** Full product page: photo, details and a buy box side by side, then similar products. */
export function ProductPage({ id }: { id: string }) {
  const { t, lang, dir } = useLang();
  const { content, productById, copyOf, visibleProducts } = useSiteContent();
  const { add } = useCart();
  const { has, toggle } = useFavorites();
  const brand = useBrandText();
  const [, navigate] = useLocation();
  const [qty, setQty] = useState(1);

  const product = productById(id);
  if (!product) return <Redirect to={`/${lang}`} />;

  const copy = copyOf(lang, product.id) ?? t.deals.products[product.id];
  const name = copy?.name ?? "";
  const row = content.products.find((item) => item.id === product.id);
  // Copy saved from the dashboard wins; until then the built-in highlights and specs show.
  const builtIn = offerDetail(lang, product.id);
  const savedFeatures = lang === "ar" ? row?.featuresAr : row?.featuresEn;
  const savedSpecs = lang === "ar" ? row?.specsAr : row?.specsEn;
  const detail = {
    features: savedFeatures ?? builtIn?.features ?? [],
    specs: savedSpecs ? savedSpecs.map(({ label, value }): [string, string] => [label, value]) : (builtIn?.specs ?? []),
  };
  const description = ((lang === "ar" ? row?.descriptionAr : row?.descriptionEn) ?? "").trim();
  const categoryId = row ? productCategoryOf(row) : null;
  const trail = categoryId ? categoryTrail(categoryId) : [];
  const saved = product.compareAt - product.price;
  const percent = product.compareAt > product.price ? Math.round((1 - product.price / product.compareAt) * 100) : 0;
  const liked = has(product.id);

  // Similar products: the same category first, then other store products to fill the row.
  const sameCategory = categoryId
    ? content.products
        .filter((item) => item.id !== product.id && productInCategory(item, categoryId))
        .map((item) => productById(item.id))
        .filter((item): item is OfferProduct => item !== undefined)
    : [];
  const related = [...sameCategory, ...visibleProducts("all").filter((item) => item.id !== product.id && !sameCategory.includes(item))].slice(
    0,
    RELATED_LIMIT,
  );

  function addToCart() {
    add(product!.id, qty);
    toast.success(t.cartAdded.replace("{name}", name));
  }

  const price = (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <p className="text-3xl font-bold text-brand-ink">
        {money(product.price)} <span className="text-lg">{t.deals.currency}</span>
      </p>
      {saved > 0 ? (
        <p className="text-sm text-ink-mute line-through">
          {money(product.compareAt)} {t.deals.currency}
        </p>
      ) : null}
    </div>
  );

  return (
    <div className="min-h-svh bg-[var(--tone-b)] text-navy">
      <SiteHeader />
      <main id="main" tabIndex={-1} className="tone-scope page-shell min-h-[60svh] py-8 outline-none">
        <nav aria-label={t.brand} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-navy/45">
          <Link href={`/${lang}`} className="transition hover:text-navy">
            {brand.name}
          </Link>
          {trail.map((item) => (
            <span key={item.id} className="flex items-center gap-2">
              <span aria-hidden>{dir === "rtl" ? "‹" : "›"}</span>
              <Link href={`/${lang}/c/${item.slug}`} className="transition hover:text-navy">
                {categoryLabel(item, lang)}
              </Link>
            </span>
          ))}
        </nav>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)_minmax(0,3.6fr)] lg:gap-8">
          {/* Photo */}
          <div className="lg:sticky lg:top-40">
            <div className="relative aspect-square overflow-hidden rounded-3xl border border-navy/10 bg-white">
              {percent > 0 ? (
                <span className="absolute start-4 top-4 z-10 rounded-lg bg-burgundy px-2.5 py-1 text-xs font-bold text-white">
                  {t.deals.discount.replace("{percent}", String(percent))}
                </span>
              ) : null}
              <button
                type="button"
                aria-pressed={liked}
                aria-label={t.wishlist}
                onClick={() => toggle(product.id)}
                className={`absolute end-4 top-4 z-10 grid size-11 cursor-pointer place-items-center rounded-full border bg-white shadow-sm transition-colors hover:text-brand-ink ${
                  liked ? "border-brand-ink text-brand-ink" : "border-navy/10 text-navy"
                }`}
              >
                <Heart className={`size-5 ${liked ? "fill-brand-ink" : ""}`} aria-hidden />
              </button>
              <img
                src={productPhoto(product)}
                alt={name}
                className="absolute inset-0 h-full w-full object-contain p-10 drop-shadow-[0_14px_12px_rgba(11,18,32,0.16)]"
              />
            </div>
            <p className="mt-3 flex items-center justify-center gap-2 text-sm font-medium text-brand-ink">
              <ShieldCheck className="size-4" aria-hidden />
              {t.deals.original}
            </p>
          </div>

          {/* Details */}
          <div className="min-w-0">
            {copy?.category ? <p className="text-sm font-semibold text-brand-ink">{copy.category}</p> : null}
            <h1 className="mt-2 text-2xl font-bold leading-snug text-navy sm:text-3xl">{name}</h1>
            {product.rating > 0 ? (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="font-semibold text-navy">{product.rating.toFixed(1)}</span>
                <span className="flex" aria-label={t.productPage.rating.replace("{rating}", product.rating.toFixed(1))}>
                  {[1, 2, 3, 4, 5].map((step) => (
                    <Star
                      key={step}
                      aria-hidden
                      className={`size-4 ${step <= Math.round(product.rating) ? "fill-gold text-gold" : "fill-navy/10 text-navy/10"}`}
                    />
                  ))}
                </span>
                {product.reviews > 0 ? (
                  <span className="text-ink-mute">({t.deals.reviews.replace("{count}", String(product.reviews))})</span>
                ) : null}
              </div>
            ) : null}

            <div className="mt-5 border-t border-navy/10 pt-5">
              {saved > 0 ? (
                <span className="mb-2 inline-flex rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand-ink">
                  {t.deals.savedAmount.replace("{amount}", money(saved)).replace("{currency}", t.deals.currency)}
                </span>
              ) : null}
              {price}
              <p className="mt-1 text-xs text-ink-mute">{t.productPage.priceNote}</p>
            </div>

            <ul className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {t.catalog.perks.map((perk, index) => {
                const Icon = PERK_ICONS[index] ?? Truck;
                return (
                  <li key={perk.title} className="flex flex-col items-center gap-2 rounded-2xl border border-navy/10 bg-white px-2 py-3 text-center">
                    <span className="grid size-10 place-items-center rounded-full bg-brand/10 text-brand-ink">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="text-xs font-semibold leading-5 text-navy">{perk.title}</span>
                  </li>
                );
              })}
            </ul>

            {description ? (
              <>
                <h2 className="mt-7 text-base font-bold text-navy">{t.productPage.description}</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-ink-soft">{description}</p>
              </>
            ) : null}

            {detail.features.length ? (
              <>
                <h2 className="mt-7 text-base font-bold text-navy">{t.deals.featuresTitle}</h2>
                <ul className="mt-3 space-y-2">
                  {detail.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm leading-6 text-ink-soft">
                      <Check className="mt-1 size-4 shrink-0 text-brand-ink" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {detail.specs.length ? (
              <>
                <h2 className="mt-7 text-base font-bold text-navy">{t.deals.specsTitle}</h2>
                <dl className="mt-3 overflow-hidden rounded-2xl border border-navy/10 bg-white">
                  {detail.specs.map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] border-b border-navy/10 last:border-b-0">
                      <dt className="bg-[var(--tone-b)] px-4 py-2.5 text-sm text-ink-mute">{label}</dt>
                      <dd className="px-4 py-2.5 text-sm font-medium text-navy">{value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : null}
          </div>

          {/* Buy box */}
          <aside className="rounded-3xl border border-navy/10 bg-white p-5 shadow-[0_10px_28px_rgba(11,18,32,0.06)] lg:sticky lg:top-40">
            {price}
            <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#12875a]">
              <Check className="size-4" aria-hidden />
              {t.deals.inStock}
            </p>
            <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-ink-soft">
              <Truck className="mt-0.5 size-4 shrink-0 text-brand-ink" aria-hidden />
              {t.deals.shippingNote}
            </p>
            <p className="mt-1 flex items-start gap-2 text-sm leading-6 text-ink-soft">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-ink" aria-hidden />
              {t.deals.warrantyNote}
            </p>

            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-navy">{t.productPage.quantity}</span>
              <div className="inline-flex h-11 items-center rounded-xl border border-navy/15">
                <button
                  type="button"
                  aria-label={t.deals.decrease}
                  disabled={qty === 1}
                  onClick={() => setQty((value) => Math.max(1, value - 1))}
                  className="grid size-10 cursor-pointer place-items-center text-navy disabled:cursor-default disabled:text-navy/30"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-9 text-center text-sm font-semibold text-navy" aria-live="polite">
                  {qty}
                </span>
                <button
                  type="button"
                  aria-label={t.deals.increase}
                  onClick={() => setQty((value) => value + 1)}
                  className="grid size-10 cursor-pointer place-items-center text-navy"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={addToCart}
              className="mt-4 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand text-sm font-bold text-navy transition-colors hover:bg-brand-hover"
            >
              <ShoppingCart className="size-4" aria-hidden />
              {t.deals.addToCart}
            </button>
            <button
              type="button"
              onClick={() => {
                add(product.id, qty);
                navigate(`/${lang}/checkout`);
              }}
              className="mt-2.5 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-brand-ink text-sm font-bold text-brand-ink transition-colors hover:bg-brand/10"
            >
              <Zap className="size-4" aria-hidden />
              {t.productPage.buyNow}
            </button>

            <dl className="mt-5 space-y-2 border-t border-navy/10 pt-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-ink-mute">
                  <Store className="size-4" aria-hidden />
                  {t.productPage.soldBy}
                </dt>
                <dd className="font-medium text-navy">{brand.name}</dd>
              </div>
            </dl>
          </aside>
        </div>

        {related.length > 0 ? (
          <section className="mt-14" aria-labelledby="related-title">
            <h2 id="related-title" className="text-xl font-bold text-navy sm:text-2xl">
              {t.productPage.related}
            </h2>
            <OfferGrid products={related} />
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
