import { useState } from "react";
import { Eye, Heart, ShoppingCart, Star } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { ProductDialog, type OfferProduct } from "@/components/site/Offers";
import { useCart } from "@/lib/cart";
import { useCustomer } from "@/lib/customer";
import { useFavorites } from "@/lib/favorites";
import { useLang } from "@/lib/i18n";
import { productPhoto } from "@/lib/products";
import { shopLabel } from "@/lib/shop-label";
import { useSiteContent, type ProductRow, type Shop } from "@/lib/site-content";
import { WHOLESALE_MIN, stockOf } from "@/lib/wholesale";

const money = (value: number) => value.toLocaleString("en-US");
const ICON_BUTTON =
  "grid size-9 cursor-pointer place-items-center rounded-full border border-navy/10 bg-white text-navy shadow-sm transition-colors hover:border-brand-ink hover:text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/**
 * A wholesale offer: one shop's listing of a product with a valid wholesale price. Prices, the minimum quantity, the total
 * and the button all come from that listing and the cart. The quantity counts this listing only (the cart keeps one line
 * per listing), so other shops or other products never add up to the minimum. Signing in is needed to buy, not to browse.
 */
export function WholesaleCard({ product, row, shop, wholesale }: { product: OfferProduct; row: ProductRow; shop: Shop | null; wholesale: number }) {
  const { t, lang } = useLang();
  const { copyOf, catalogue } = useSiteContent();
  const { lines, add } = useCart();
  const { customer, ready } = useCustomer();
  const { has, toggle } = useFavorites();
  const [, navigate] = useLocation();
  const [quickView, setQuickView] = useState(false);
  const w = t.wholesale;
  const cur = t.deals.currency;

  const copy = copyOf(lang, product.id) ?? t.deals.products[product.id];
  const name = copy?.name ?? "";
  const inCart = lines.find((line) => line.id === product.id)?.qty ?? 0;
  // The pieces still missing to reach the minimum for this same listing; nothing is added once it is reached.
  const missing = Math.max(0, WHOLESALE_MIN - inCart);
  const reached = missing === 0;
  // Stock must cover the minimum quantity in total (what is already in the cart counts). Unrecorded stock means no limit.
  const available = stockOf(row) >= WHOLESALE_MIN;
  const addLabel = missing === 1 ? w.cardAddOne : missing === 2 ? w.cardAddTwo : w.cardAddFew.replace("{count}", String(missing));

  function addMissing() {
    if (!customer) {
      // Back here after signing in; nothing is added on the way back.
      navigate(`/${lang}/login?next=${encodeURIComponent(`/${lang}/wholesale`)}`);
      return;
    }
    add(product.id, missing);
    toast.success(t.cartAdded.replace("{name}", name));
  }

  return (
    <article className="flex w-[286px] max-w-full flex-col rounded-[20px] border border-[#e6e9ef] bg-white p-4 text-start text-navy shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="relative flex h-[200px] items-center justify-center">
        <div className="absolute end-0 top-0 z-10 flex flex-col gap-2">
          <button type="button" aria-pressed={has(product.id)} aria-label={t.wishlist} onClick={() => toggle(product.id)} className={`${ICON_BUTTON} ${has(product.id) ? "border-brand-ink text-brand-ink" : ""}`}>
            <Heart className={`size-[18px] ${has(product.id) ? "fill-brand-ink" : ""}`} aria-hidden />
          </button>
          <button type="button" aria-label={t.deals.quickView} onClick={() => setQuickView(true)} className={ICON_BUTTON}>
            <Eye className="size-[18px]" aria-hidden />
          </button>
        </div>
        <Link href={`/${lang}/p/${encodeURIComponent(product.id)}`} className="flex h-full w-full items-center justify-center" aria-label={name}>
          <img src={productPhoto(product)} alt="" loading="lazy" decoding="async" className="max-h-full max-w-full object-contain" />
        </Link>
      </div>

      <p className="mt-3 text-xs text-ink-mute">{copy?.category}</p>
      <h3 className="mt-1 text-[15px] font-bold leading-6 text-navy">
        <Link href={`/${lang}/p/${encodeURIComponent(product.id)}`} className="hover:text-brand-ink">
          {name}
        </Link>
      </h3>
      {product.rating > 0 ? (
        <p className="mt-1.5 flex flex-wrap items-center gap-1 text-xs">
          <Star className="size-3.5 fill-gold text-gold" aria-hidden />
          <span className="font-semibold text-navy">{product.rating.toFixed(1)}</span>
          {product.reviews > 0 ? <span className="text-ink-mute">({t.deals.reviews.replace("{count}", String(product.reviews))})</span> : null}
        </p>
      ) : null}
      {shop ? (
        <p className="mt-1.5 text-xs leading-5 text-ink-mute">
          {t.compare.shopLabel}: <span className="font-semibold text-navy">{shopLabel(shop.name, lang, t)}</span>
        </p>
      ) : null}

      <div className="mt-3 border-t border-[#e6e9ef] pt-3">
        <p className="flex flex-wrap items-baseline gap-x-1.5 text-brand">
          <span className="text-[30px] font-extrabold leading-9">{money(wholesale)}</span>
          <span className="text-sm font-semibold">
            {cur} {w.cardPerPiece}
          </span>
        </p>
        <p className="mt-1 text-xs leading-5 text-ink-soft">{w.cardCondition.replace("{count}", String(WHOLESALE_MIN))}</p>
        <p className="mt-2 text-xs leading-5 text-ink-mute">{w.cardRetail.replace("{price}", money(product.price)).replace("{currency}", cur)}</p>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-[#e6e9ef] pt-3">
        <span className="text-[15px] text-ink-soft">{w.cardTotal.replace("{count}", String(WHOLESALE_MIN))}</span>
        <span className="text-[15px] font-bold tabular-nums text-navy">
          {money(wholesale * WHOLESALE_MIN)} {cur}
        </span>
      </div>

      {reached ? (
        <Link href={`/${lang}/cart`} className="mt-4 inline-flex h-[45px] w-full items-center justify-center gap-2 rounded-[9px] bg-brand px-3 text-sm font-bold text-white transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          <ShoppingCart className="size-[18px]" aria-hidden />
          {w.cardInCart}
        </Link>
      ) : (
        <button
          type="button"
          onClick={addMissing}
          disabled={!available || !ready}
          className="mt-4 inline-flex h-[45px] w-full cursor-pointer items-center justify-center gap-2 rounded-[9px] bg-brand px-3 text-sm font-bold text-white transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-default disabled:opacity-60"
        >
          <ShoppingCart className="size-[18px]" aria-hidden />
          {available ? addLabel : w.cardUnavailable}
        </button>
      )}
      {!customer && ready && !reached && available ? <p className="mt-2 text-xs leading-5 text-ink-mute">{w.loginRequired}</p> : null}
      {/* Only the local preview is unconnected to the server: with the store's server the checkout prices the same way. */}
      {catalogue.source === "local" ? <p className="mt-2 text-xs leading-5 text-ink-mute">{w.previewNote}</p> : null}

      {quickView ? <ProductDialog product={product} liked={has(product.id)} onClose={() => setQuickView(false)} onToggleSave={() => toggle(product.id)} /> : null}
    </article>
  );
}
