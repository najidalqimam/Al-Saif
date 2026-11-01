import { Search } from "lucide-react";
import { Link, useSearch } from "wouter";
import { OfferGrid, type OfferProduct } from "@/components/site/Offers";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { useLang } from "@/lib/i18n";
import { searchStore } from "@/lib/search";
import { useSiteContent } from "@/lib/site-content";

export function SearchPage() {
  const { t, lang } = useLang();
  const { content, productById } = useSiteContent();
  const query = (new URLSearchParams(useSearch()).get("q") ?? "").trim();
  const result = searchStore(query, content.products, content.categoryHidden);
  const products = result.productIds.map((id) => productById(id)).filter((item): item is OfferProduct => item !== undefined);
  // Departments that match only pull their products in; the page lists products, not departments.
  const total = products.length;

  return (
    <div className="min-h-svh bg-[var(--tone-b)] text-navy">
      <SiteHeader />
      <main id="main" tabIndex={-1} className="tone-scope page-shell min-h-[60svh] py-10 outline-none">
        <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">
          {query ? t.searchPage.resultsFor.replace("{query}", query) : t.searchPage.title}
        </h1>
        {query && total > 0 ? (
          <p className="mt-2 text-sm text-navy/60">{t.searchPage.count.replace("{count}", String(total))}</p>
        ) : null}

        {products.length > 0 ? (
          <OfferGrid products={products} />
        ) : null}

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
