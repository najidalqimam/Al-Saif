import { Search } from "lucide-react";
import { Link, useSearch } from "wouter";
import { OfferGrid, type OfferProduct } from "@/components/site/Offers";
import { SearchCompareCard, type SearchOffer } from "@/components/site/SearchCompareCard";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { useLang } from "@/lib/i18n";
import { searchStore } from "@/lib/search";
import { useSiteContent, type ProductRow } from "@/lib/site-content";

type Entry = { kind: "single"; product: OfferProduct } | { kind: "group"; product: OfferProduct; offers: SearchOffer[] };

/** Same configuration: both language spec lists identical. A product without specs is never considered the same as another. */
const specSignature = (row: ProductRow | undefined) => (row?.specsAr?.length ? JSON.stringify([row.specsAr, row.specsEn ?? null]) : null);

export function SearchPage() {
  const { t, lang } = useLang();
  const { content, productById, offersOf } = useSiteContent();
  const query = (new URLSearchParams(useSearch()).get("q") ?? "").trim();
  const result = searchStore(query, content.products, content.categoryHidden);
  const products = result.productIds.map((id) => productById(id)).filter((item): item is OfferProduct => item !== undefined);

  // Products listed by several shops show once as a comparison card. Only an explicit matchKey with identical specs
  // and at least two different shops groups them; names and images are never compared, and nothing else changes.
  const rowOf = (id: string) => content.products.find((item) => item.id === id);
  const entries: Entry[] = [];
  const groupedKeys = new Set<string>();
  const singleKeys = new Set<string>();
  for (const product of products) {
    const row = rowOf(product.id);
    const signature = specSignature(row);
    if (!row?.matchKey || !signature) {
      entries.push({ kind: "single", product });
      continue;
    }
    const bucket = `${row.matchKey}|${signature}`;
    if (groupedKeys.has(bucket)) continue;
    if (!singleKeys.has(bucket)) {
      // The cheapest listing of each shop, among listings with the same match key and the same specs.
      const cheapest = new Map<string, SearchOffer>();
      for (const offer of offersOf(product.id)) {
        if (!offer.shop || specSignature(rowOf(offer.id)) !== signature) continue;
        const known = cheapest.get(offer.shop.id);
        if (!known || offer.price < known.price) cheapest.set(offer.shop.id, { id: offer.id, price: offer.price, shopId: offer.shop.id, shopName: offer.shop.name });
      }
      if (cheapest.size >= 2) {
        groupedKeys.add(bucket);
        const offers = [...cheapest.values()].sort((a, b) => a.price - b.price || a.shopName.localeCompare(b.shopName));
        entries.push({ kind: "group", product, offers });
        continue;
      }
      singleKeys.add(bucket);
    }
    entries.push({ kind: "single", product });
  }
  // Consecutive single products share one grid; comparison cards sit between them in result order.
  const segments: Array<{ kind: "grid"; products: OfferProduct[] } | { kind: "group"; entry: Extract<Entry, { kind: "group" }> }> = [];
  for (const entry of entries) {
    if (entry.kind === "group") segments.push({ kind: "group", entry });
    else {
      const last = segments[segments.length - 1];
      if (last?.kind === "grid") last.products.push(entry.product);
      else segments.push({ kind: "grid", products: [entry.product] });
    }
  }
  // Departments that match only pull their products in; the page lists products, not departments.
  const total = entries.length;

  return (
    <div className="inner-page-white min-h-svh bg-[var(--page-bg)] text-navy">
      <SiteHeader />
      <main id="main" tabIndex={-1} className="tone-scope page-shell min-h-[60svh] py-10 outline-none">
        <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">
          {query ? t.searchPage.resultsFor.replace("{query}", query) : t.searchPage.title}
        </h1>
        {query && total > 0 ? (
          <p className="mt-2 text-sm text-navy/60">{t.searchPage.count.replace("{count}", String(total))}</p>
        ) : null}

        {segments.map((segment, index) =>
          segment.kind === "grid" ? (
            <OfferGrid key={`grid-${index}`} products={segment.products} />
          ) : (
            <div key={segment.entry.product.id} className="mt-5 first:mt-6">
              <SearchCompareCard product={segment.entry.product} offers={segment.entry.offers} />
            </div>
          ),
        )}

        {total === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-3xl border border-navy/10 bg-white px-6 py-12 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-brand/10 text-brand-ink">
              <Search className="size-6" aria-hidden />
            </span>
            <p className="mt-4 max-w-sm text-sm leading-7 text-ink-soft">
              {query ? t.searchPage.empty.replace("{query}", query) : t.searchPage.prompt}
            </p>
            <Link href={`/${lang}/offers`} className="btn-brand mt-5">
              {t.searchPage.browse}
            </Link>
          </div>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
