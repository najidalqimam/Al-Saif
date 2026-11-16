import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import type { OfferProduct } from "@/components/site/Offers";
import { useLang } from "@/lib/i18n";
import { productPhoto } from "@/lib/products";
import { shopLabel } from "@/lib/shop-label";
import { useSiteContent } from "@/lib/site-content";

export type SearchOffer = { id: string; price: number; shopId: string; shopName: string };

const money = (value: number) => value.toLocaleString("en-US");

/** One letter for the shop avatar: the name after the "demo shop:" prefix, without the Arabic "ال". */
function initial(name: string) {
  const base = name.includes(":") ? name.slice(name.indexOf(":") + 1).trim() : name.trim();
  const plain = base.startsWith("ال") && base.length > 3 ? base.slice(2) : base;
  return Array.from(plain)[0]?.toUpperCase() ?? "";
}

/**
 * A search result for a product listed by several shops: the product on one side, one row per shop on the other.
 * Each shop row is a single link to that shop's own product page; the card itself opens nothing.
 */
export function SearchCompareCard({ product, offers }: { product: OfferProduct; offers: SearchOffer[] }) {
  const { t, lang, dir } = useLang();
  const { content, copyOf } = useSiteContent();
  const c = t.compare;
  const Arrow = dir === "rtl" ? ChevronLeft : ChevronRight;
  const copy = copyOf(lang, product.id) ?? t.deals.products[product.id];
  const row = content.products.find((item) => item.id === product.id);
  const lowest = Math.min(...offers.map((offer) => offer.price));
  const highest = Math.max(...offers.map((offer) => offer.price));
  const count = offers.length;
  const shops = count === 2 ? c.shopsTwo : (count <= 10 ? c.shopsFew : c.shopsMany).replace("{count}", String(count));

  return (
    <article className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white text-navy min-[900px]:flex">
      <div className="min-w-0 border-b border-[#EEEEEE] p-6 min-[900px]:w-[32%] min-[900px]:shrink-0 min-[900px]:border-b-0 min-[900px]:border-e">
        <div className="flex h-[120px] items-center justify-center overflow-hidden rounded-xl bg-[#F5F5F4]">
          <img src={productPhoto(product)} alt="" className="max-h-full max-w-full object-contain" />
        </div>
        {copy?.category ? <p className="mt-4 text-[11px] text-ink-mute">{copy.category}</p> : null}
        <h2 className="mt-1 text-[15px] font-[800] leading-6 text-navy">{copy?.name}</h2>
        {row?.source === "demo" ? (
          <span className="mt-2 inline-flex rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] font-semibold text-navy">{c.demoBadge}</span>
        ) : null}
      </div>

      <div className="min-w-0 p-6 min-[900px]:w-[68%]">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="text-sm font-[800] text-navy">{c.offersTitle.replace("{count}", String(count))}</h3>
          <p className="text-xs text-ink-mute">{c.sortNote}</p>
        </div>

        <ul className="mt-3">
          {offers.map((offer, index) => {
            const label = shopLabel(offer.shopName, lang, t);
            return (
              <li key={offer.shopId} className={index < offers.length - 1 ? "border-b border-[#EEEEEE]" : undefined}>
                <Link
                  href={`/${lang}/p/${offer.id}`}
                  className="flex items-center gap-3 rounded-[10px] px-2 py-3 outline-none transition-colors hover:bg-[#FAFAFA] focus-visible:ring-2 focus-visible:ring-brand-ink"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#F4F5F7] text-sm font-bold text-navy" aria-hidden>
                    {initial(offer.shopName)}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="min-w-0 break-words text-sm font-bold text-navy">{label}</span>
                    {offer.price === lowest && lowest < highest ? (
                      <span className="rounded-full bg-navy px-2.5 py-0.5 text-[11px] font-semibold text-white">{c.lowest}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-base font-[800] tabular-nums text-navy">
                    {money(offer.price)} <span className="text-xs font-semibold">{t.deals.currency}</span>
                  </span>
                  <Arrow className="size-4 shrink-0 text-ink-mute" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mt-4 border-t border-[#EEEEEE] pt-4 text-xs text-ink-mute">
          {c.startsFrom} <strong className="text-sm font-bold text-navy">{money(lowest)} {t.deals.currency}</strong> · {c.availableIn.replace("{shops}", shops)}
        </p>
      </div>
    </article>
  );
}
