import { OfferGrid } from "@/components/site/Offers";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { useLang } from "@/lib/i18n";
import { useSiteContent } from "@/lib/site-content";

export function OffersPage() {
  const { t } = useLang();
  const { visibleProducts } = useSiteContent();

  return (
    <div className="min-h-svh bg-white text-navy">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">{t.deals.pageTitle}</h1>
        <p className="mt-2 max-w-xl text-sm leading-7 text-navy/60">{t.deals.pageLead}</p>
        <OfferGrid products={visibleProducts("all")} />
      </main>
      <SiteFooter />
    </div>
  );
}
