import { Link, Redirect } from "wouter";
import { catalogIcon } from "@/components/site/catalog-icons";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { CategoryCard } from "@/components/site/showcase";
import {
  categoryBlurb,
  categoryById,
  categoryLabel,
  categoryTrail,
  childCategories,
  isListed,
} from "@/lib/catalog";
import { useLang } from "@/lib/i18n";
import { useSiteContent } from "@/lib/site-content";

export function CategoryPage({ id }: { id: string }) {
  const { t, lang } = useLang();
  const { content } = useSiteContent();
  const category = categoryById(id);

  if (!category || !isListed(category, content.categoryHidden)) {
    return <Redirect to={`/${lang}`} />;
  }

  const children = childCategories(category.id, content.categoryHidden);
  const trail = categoryTrail(category.id).slice(0, -1);

  return (
    <div className="min-h-svh bg-[#F7F8F5] text-navy">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10">
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
          {children.length > 0 ? categoryBlurb(category, lang) : t.categoryPage.empty}
        </p>
        {children.length > 0 ? (
          <>
            <p className="mt-8 text-sm font-semibold text-navy">{t.categoryPage.related}</p>
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {children.map((item) => (
                <CategoryCard
                  key={item.id}
                  id={item.id}
                  name={categoryLabel(item, lang)}
                  caption={categoryBlurb(item, lang)}
                  image={item.image || undefined}
                  icon={catalogIcon(item.icon)}
                  href={`/${lang}/c/${item.slug}`}
                />
              ))}
            </div>
          </>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
