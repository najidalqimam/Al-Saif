import { Heart } from "lucide-react";
import { Link } from "wouter";
import { OfferGrid } from "@/components/site/Offers";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import type { OfferProduct } from "@/lib/products";
import { useFavorites } from "@/lib/favorites";
import { useLang } from "@/lib/i18n";
import { useSiteContent } from "@/lib/site-content";

export function FavoritesPage() {
  const { t, lang } = useLang();
  const { productById } = useSiteContent();
  const { ids } = useFavorites();
  const products = ids.map((id) => productById(id)).filter((item): item is OfferProduct => item !== undefined);

  return (
    <div className="min-h-svh bg-[var(--tone-b)] text-navy">
      <SiteHeader />
      <main id="main" tabIndex={-1} className="tone-scope page-shell min-h-[60svh] py-10 outline-none">
        <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">{t.favoritesPage.title}</h1>
        <p className="mt-2 max-w-xl text-sm leading-7 text-navy/60">{t.favoritesPage.lead}</p>
        {products.length > 0 ? (
          <OfferGrid products={products} />
        ) : (
          <div className="mt-8 flex flex-col items-center rounded-3xl border border-navy/10 bg-white px-6 py-12 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-brand/10 text-brand-ink">
              <Heart className="size-6" aria-hidden />
            </span>
            <p className="mt-4 max-w-sm text-sm leading-7 text-ink-soft">{t.favoritesPage.empty}</p>
            <Link href={`/${lang}/offers`} className="btn-brand mt-5">
              {t.favoritesPage.browse}
            </Link>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
