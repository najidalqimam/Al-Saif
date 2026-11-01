import { ShieldCheck, Truck } from "lucide-react";
import { Link } from "wouter";
import { categoryLabel, topDepartments } from "@/lib/catalog";
import { BrandMark, useBrandText } from "@/components/site/Brand";
import { useLang } from "@/lib/i18n";
import { useSiteContent } from "@/lib/site-content";
import { useIsLight } from "@/lib/theme";

export function SiteFooter() {
  const { t, lang } = useLang();
  const brand = useBrandText();
  const { content } = useSiteContent();
  const footer = content.footer[lang];
  const departments = topDepartments(content.categoryHidden, 7);
  const light = useIsLight();
  // Dark classes are the baseline; light mode swaps only the colours.
  const c = light
    ? { root: "border-t border-[#dce5ef] bg-[var(--chrome)] text-navy", tag: "text-navy/65", about: "text-navy/70", facts: "text-navy/75", links: "text-navy/65", hover: "hover:text-navy", rule: "border-navy/10", rights: "text-navy/65", icon: "text-brand-ink" }
    : { root: "border-t border-white/10 bg-[var(--chrome)] text-white", tag: "text-white/55", about: "text-white/65", facts: "text-white/75", links: "text-white/65", hover: "hover:text-white", rule: "border-white/10", rights: "text-white/45", icon: "text-cyan" };

  return (
    <footer className={c.root}>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href={`/${lang}`} className="flex items-center gap-3">
            <BrandMark />
            <span className="leading-tight">
              <span className="block text-lg font-semibold leading-7">{brand.name}</span>
              {brand.tagline ? <span className={`block text-xs ${c.tag}`}>{brand.tagline}</span> : null}
            </span>
          </Link>
          <p className={`mt-4 max-w-xs text-sm leading-7 ${c.about}`}>{footer.about}</p>
          <ul className={`mt-5 space-y-3 text-sm ${c.facts}`}>
            <li className="flex items-start gap-2">
              <Truck className={`mt-1 size-4 shrink-0 ${c.icon}`} />
              {footer.shipping}
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className={`mt-1 size-4 shrink-0 ${c.icon}`} />
              {footer.warranty}
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold">{t.footer.departmentsTitle}</h2>
          <ul className={`mt-4 space-y-2.5 text-sm ${c.links}`}>
            <li>
              <Link href={`/${lang}/offers`} className={`transition ${c.hover}`}>
                {t.offers}
              </Link>
            </li>
            {departments.map((item) => (
              <li key={item.id}>
                <Link href={`/${lang}/c/${item.slug}`} className={`transition ${c.hover}`}>
                  {categoryLabel(item, lang)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold">{t.footer.serviceTitle}</h2>
          <ul className={`mt-4 space-y-2.5 text-sm leading-6 ${c.links}`}>
            {t.footer.services.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold">{t.footer.helpTitle}</h2>
          <ul className={`mt-4 space-y-2.5 text-sm leading-6 ${c.links}`}>
            {t.footer.help.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className={`border-t ${c.rule}`}>
        <p className={`mx-auto max-w-7xl px-4 py-4 text-xs ${c.rights}`}>{t.footer.rights}</p>
      </div>
    </footer>
  );
}
