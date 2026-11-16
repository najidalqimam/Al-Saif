import { Link } from "wouter";
import { categoryLabel, rootDepartments } from "@/lib/catalog";
import { BrandMark, useBrandText } from "@/components/site/Brand";
import { useLang } from "@/lib/i18n";
import { useSiteContent } from "@/lib/site-content";

// The footer's department links: the same destinations the store already uses (/{lang}/c/{slug} and /{lang}/offers).
// A department hidden from the store drops out of the list.
const FOOTER_DEPARTMENTS = ["computers-laptops", "monitors", "pc-components", "printers-scanners", "networking", "servers", "storage"];

const link =
  "rounded-sm text-[#CBD2DE] transition-colors hover:text-white focus-visible:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F5]";

export function SiteFooter() {
  const { t, lang } = useLang();
  const brand = useBrandText();
  const { content } = useSiteContent();
  const visible = rootDepartments(content.categoryHidden);
  const departments = FOOTER_DEPARTMENTS.flatMap((slug) => visible.filter((item) => item.slug === slug));
  const heading = "text-[17px] font-semibold leading-7 text-[#F7F7F5]";
  const text = "text-sm leading-[1.8] text-[#CBD2DE]";
  // Thin rule between the stacked groups on small screens; on desktop the groups are separated by space only.
  const divider = "h-px w-full bg-white/10 lg:hidden";

  return (
    <footer className="border-t border-white/10 bg-[#111C30] text-[#CBD2DE]">
      <div className="mx-auto flex max-w-[1360px] flex-col gap-6 px-6 py-8 lg:flex-row lg:items-start lg:justify-between lg:py-14">
        <div className="min-w-0 lg:w-[28%]">
          <Link href={`/${lang}`} className="inline-flex items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F7F5]">
            <BrandMark />
            <span className="text-[21px] font-semibold leading-8 text-[#F7F7F5]">{brand.name}</span>
          </Link>
          <p className={`mt-4 ${text}`}>{t.footer.intro}</p>
        </div>

        <div aria-hidden className={divider} />

        <nav aria-labelledby="footer-shop" className="min-w-0 lg:w-[36%]">
          <h2 id="footer-shop" className={heading}>
            {t.footer.shopTitle}
          </h2>
          <ul className="mt-3 columns-1 gap-x-8 min-[340px]:columns-2">
            {departments.map((item) => (
              <li key={item.id} className="break-inside-avoid text-sm leading-[1.8]">
                <Link href={`/${lang}/c/${item.slug}`} className={link}>
                  {categoryLabel(item, lang)}
                </Link>
              </li>
            ))}
            <li className="break-inside-avoid text-sm leading-[1.8]">
              <Link href={`/${lang}/offers`} className={link}>
                {t.offers}
              </Link>
            </li>
          </ul>
        </nav>

        <div aria-hidden className={divider} />

        <section aria-labelledby="footer-before" className="min-w-0 lg:w-[30%]">
          <h2 id="footer-before" className={heading}>
            {t.footer.beforeTitle}
          </h2>
          <ul className="mt-3">
            {t.footer.before.map((item) => (
              <li key={item} className={`flex gap-2 ${text}`}>
                <span aria-hidden className="text-[#CBD2DE]/60">
                  •
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-[1360px] px-6 py-3.5 text-xs text-[#CBD2DE]/80">{t.footer.rights}</p>
      </div>
    </footer>
  );
}
