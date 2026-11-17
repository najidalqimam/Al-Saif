import { Link, Redirect } from "wouter";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { OfferGrid, type OfferProduct } from "@/components/site/Offers";
import {
  categoryBlurb,
  categoryById,
  categoryLabel,
  categoryTrail,
  isListed,
} from "@/lib/catalog";
import { useLang } from "@/lib/i18n";
import { productInCategory } from "@/lib/product-categories";
import { useSiteContent } from "@/lib/site-content";

export function CategoryPage({ id }: { id: string }) {
  const { t, lang } = useLang();
  const { content, productById } = useSiteContent();
  const category = categoryById(id);

  if (!category || !isListed(category, content.categoryHidden)) {
    return <Redirect to={`/${lang}`} />;
  }

  // A department lists its products straight away (the store has main departments only, no subcategories).
  const products = content.products
    .filter((item) => productInCategory(item, category.id))
    .map((item) => productById(item.id))
    .filter((item): item is OfferProduct => item !== undefined);
  const trail = categoryTrail(category.id).slice(0, -1);

  return (
    <div className="inner-page-white min-h-svh bg-[var(--page-bg)] text-navy">
      <SiteHeader />
      <main id="main" tabIndex={-1} className="tone-scope page-shell min-h-[60svh] py-10 outline-none">
        <p className="text-sm text-navy/45">
          <Link href={`/${lang}`} className="transition hover:text-navy">
            {t.brand}
          </Link>
          {trail.map((item) => (
            <span key={item.id}>
              <span className="px-2">/</span>
              <Link href={`/${lang}/c/${item.slug}`} className="transition hover:text-navy">
                {categoryLabel(item, lang)}
              </Link>
            </span>
          ))}
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-navy sm:text-3xl">{categoryLabel(category, lang)}</h1>
        <p className="mt-2 max-w-xl text-sm leading-7 text-navy/60">
          {products.length > 0 ? categoryBlurb(category, lang) : t.categoryPage.noProducts}
        </p>
        {products.length > 0 ? (
          <>
            <p className="mt-8 text-sm font-semibold text-navy">{t.categoryPage.products}</p>
            <OfferGrid products={products} />
          </>
        ) : (
          <Link
            href={`/${lang}/offers`}
            className="mt-6 inline-flex h-11 items-center rounded-full bg-[#20C5D4] px-6 text-sm font-semibold text-navy transition-colors hover:bg-brand-hover"
          >
            {t.deals.viewAll}
          </Link>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
