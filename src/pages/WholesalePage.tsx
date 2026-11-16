import { WholesaleCard } from "@/components/site/WholesaleCard";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { useLang } from "@/lib/i18n";
import { useSiteContent } from "@/lib/site-content";
import { WHOLESALE_MIN, stockOf, wholesaleFor } from "@/lib/wholesale";

/**
 * Products that offer a wholesale price. Only listings that really qualify: visible and not archived (productById), a valid
 * wholesale price (positive, below the selling price) on a listing linked to a shop (wholesaleFor), and stock for 5 pieces.
 * Browsing is open to everyone; signing in matters only when buying.
 */
export function WholesalePage() {
  const { t } = useLang();
  const { content, productById, shopOf } = useSiteContent();
  const w = t.wholesale;

  const offers = content.products.flatMap((row) => {
    const product = productById(row.id);
    const wholesale = wholesaleFor(row);
    if (!product || wholesale === null || stockOf(row) < WHOLESALE_MIN) return [];
    return [{ product, row, wholesale, shop: shopOf(row.id) }];
  });
  return (
    <div className="inner-page-white min-h-svh bg-[var(--page-bg)] text-navy">
      <SiteHeader />
      <main id="main" tabIndex={-1} className="tone-scope page-shell min-h-[60svh] py-10 outline-none">
        <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">{w.navLabel}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-navy/60">{w.pageLead}</p>

        {offers.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-4">
            {offers.map((offer) => (
              <WholesaleCard key={offer.row.id} product={offer.product} row={offer.row} shop={offer.shop} wholesale={offer.wholesale} />
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-2xl border border-navy/10 bg-white px-6 py-10 text-center text-sm leading-7 text-ink-soft">{w.pageEmpty}</p>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
