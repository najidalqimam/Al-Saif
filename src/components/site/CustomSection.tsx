import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { OfferGrid, type OfferProduct } from "@/components/site/Offers";
import { useLang } from "@/lib/i18n";
import { useSiteContent, type CustomSection as Section } from "@/lib/site-content";
import { useIsLight } from "@/lib/theme";

/** A home section added from the dashboard: a text banner with a button, or a grid of chosen products. */
export function CustomSection({ section }: { section: Section }) {
  const { lang, dir } = useLang();
  const { productById } = useSiteContent();
  const light = useIsLight();
  const copy = section[lang];
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;
  const href = `/${lang}${section.link.startsWith("/") ? section.link : `/${section.link}`}`;
  const products = section.productIds.map((id) => productById(id)).filter((item): item is OfferProduct => item !== undefined);
  const titleId = `${section.id}-title`;

  if (section.kind === "products") {
    if (!products.length) return null;
    return (
      <section className="tone-a tone-swap-light section-y" aria-labelledby={titleId}>
        <div className="page-shell">
          <div className="reveal max-w-2xl">
            {copy.eyebrow ? <p className="eyebrow">{copy.eyebrow}</p> : null}
            <h2 id={titleId} className="section-title">
              {copy.title}
            </h2>
            {copy.lead ? <p className="section-lead">{copy.lead}</p> : null}
          </div>
          <OfferGrid products={products} />
        </div>
      </section>
    );
  }

  return (
    <section className="tone-a tone-swap-light section-y" aria-labelledby={titleId}>
      <div className="page-shell">
        <div
          className={`reveal relative isolate overflow-hidden rounded-[1.5rem] px-6 py-8 sm:px-10 lg:px-12 ${light ? "border border-navy/10 text-navy" : "surface-dark text-white"}`}
          style={{ background: "var(--tone-promo)" }}
        >
          <div aria-hidden className="pointer-events-none absolute -end-20 -top-28 -z-10 size-80 rounded-full bg-cyan/20 blur-3xl" />
          <div aria-hidden className="led-strip absolute inset-x-0 top-0 -z-10" />
          <div className="max-w-2xl">
            {copy.eyebrow ? <p className={`text-sm font-semibold ${light ? "text-brand-ink" : "text-gold"}`}>{copy.eyebrow}</p> : null}
            <h2 id={titleId} className="mt-2 text-2xl font-bold leading-tight sm:text-4xl">
              {copy.title}
            </h2>
            {copy.lead ? <p className={`mt-2 max-w-xl text-sm leading-7 ${light ? "text-navy/75" : "text-white/80"}`}>{copy.lead}</p> : null}
            {copy.action ? (
              <Link
                href={href}
                className={`mt-5 inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold text-navy transition-colors ${light ? "bg-[#20C5D4] hover:bg-brand-hover" : "bg-[#fff] hover:bg-mint"}`}
              >
                {copy.action}
                <Arrow className="size-4" aria-hidden />
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
