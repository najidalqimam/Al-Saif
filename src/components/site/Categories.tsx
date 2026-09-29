import { ArrowLeft } from "lucide-react";
import { catalogIcon } from "@/components/site/catalog-icons";
import { CategoryCard } from "@/components/site/showcase";
import { categoryBlurb, categoryLabel, featuredDepartments } from "@/lib/catalog";
import { useLang } from "@/lib/i18n";
import { useSiteContent } from "@/lib/site-content";

export function Categories() {
  const { t, lang, dir } = useLang();
  const { content } = useSiteContent();
  const catalog = content.catalog[lang];
  const departments = featuredDepartments(content.categoryHidden);

  return (
    <section className="ambient bg-[#F7F8F5] py-10">
      <div className="reveal mx-auto max-w-7xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.22em] text-emerald">
              {t.catalog.kicker}
              <span className="h-px w-12 bg-emerald/40" />
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-navy sm:text-4xl">{catalog.title}</h2>
            <p className="mt-2 text-sm leading-7 text-navy/55">{catalog.subtitle}</p>
          </div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald">
            {t.catalog.viewAllDepartments}
            <ArrowLeft className={`size-4 ${dir === "ltr" ? "rotate-180" : ""}`} />
          </p>
        </div>
      </div>

      <div className="catalog-rail reveal mt-8 w-full overflow-hidden py-2">
        <div className="catalog-marquee flex w-max">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 gap-4 pe-4" aria-hidden={copy === 1 || undefined} inert={copy === 1 || undefined}>
              {departments.map((item) => (
                <div key={`${item.id}-${copy}`} className="w-[17.5rem] shrink-0">
                  <CategoryCard
                    id={item.id}
                    name={categoryLabel(item, lang)}
                    caption={categoryBlurb(item, lang)}
                    image={item.image || undefined}
                    icon={catalogIcon(item.icon)}
                    href={`/${lang}/c/${item.slug}`}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
