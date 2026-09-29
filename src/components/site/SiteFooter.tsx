import { ShieldCheck, Truck } from "lucide-react";
import { Link } from "wouter";
import { categoryLabel, topDepartments } from "@/lib/catalog";
import { useLang } from "@/lib/i18n";
import { useSiteContent } from "@/lib/site-content";

export function SiteFooter() {
  const { t, lang } = useLang();
  const { content } = useSiteContent();
  const footer = content.footer[lang];
  const departments = topDepartments(content.categoryHidden, 7);

  return (
    <footer className="bg-[#062E26] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href={`/${lang}`} className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-emerald text-lg font-semibold text-white">
              {lang === "ar" ? "س" : "E"}
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-semibold leading-7">{t.brand}</span>
              {t.tagline ? <span className="block text-xs text-white/55">{t.tagline}</span> : null}
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-7 text-white/65">{footer.about}</p>
          <ul className="mt-5 space-y-3 text-sm text-white/75">
            <li className="flex items-start gap-2">
              <Truck className="mt-1 size-4 shrink-0 text-emerald" />
              {footer.shipping}
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-1 size-4 shrink-0 text-emerald" />
              {footer.warranty}
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold">{t.footer.departmentsTitle}</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-white/65">
            <li>
              <Link href={`/${lang}/offers`} className="transition hover:text-white">
                {t.offers}
              </Link>
            </li>
            {departments.map((item) => (
              <li key={item.id}>
                <Link href={`/${lang}/c/${item.slug}`} className="transition hover:text-white">
                  {categoryLabel(item, lang)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold">{t.footer.serviceTitle}</h2>
          <ul className="mt-4 space-y-2.5 text-sm leading-6 text-white/65">
            {t.footer.services.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold">{t.footer.helpTitle}</h2>
          <ul className="mt-4 space-y-2.5 text-sm leading-6 text-white/65">
            {t.footer.help.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-white/45">{t.footer.rights}</p>
      </div>
    </footer>
  );
}
