import { ArrowLeft, ArrowRight, Info, Store } from "lucide-react";
import { Link, Redirect } from "wouter";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { useLang } from "@/lib/i18n";
import { offerDetail } from "@/lib/offer-details";
import { productPhoto } from "@/lib/products";
import { useSiteContent } from "@/lib/site-content";
import { specsForUrdu } from "@/lib/spec-ur";
import { shopLabel } from "@/lib/shop-label";

const money = (value: number) => value.toLocaleString("en-US");

/** Price comparison across shops for one product: its photo, name and specs on top, then one row per shop offer. */
export function ComparePage({ id }: { id: string }) {
  const { t, lang, dir } = useLang();
  const { content, productById, copyOf, offersOf } = useSiteContent();
  const c = t.compare;
  const product = productById(id);
  if (!product) return <Redirect to={`/${lang}`} />;

  const row = content.products.find((item) => item.id === product.id);
  const name = (copyOf(lang, product.id) ?? t.deals.products[product.id])?.name ?? "";
  const savedSpecs = lang === "en" ? row?.specsEn : row?.specsAr;
  const baseSpecs = savedSpecs ? savedSpecs.map(({ label, value }): [string, string] => [label, value]) : (offerDetail(lang, product.id)?.specs ?? []);
  const specs = lang === "ur" ? specsForUrdu(baseSpecs) : baseSpecs;
  const offers = offersOf(id)
    .filter((offer) => offer.shop)
    .sort((a, b) => a.price - b.price);
  const lowest = offers[0]?.price;
  const title = name.replace(/^\s*\[[^\]]*\]\s*/, "");
  const demo = row?.source === "demo";
  const count = offers.length;
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;

  return (
    <div className="inner-page-white min-h-svh bg-[#EAF2FB] text-navy">
      <SiteHeader />
      <main id="main" tabIndex={-1} className="mx-auto min-h-[60svh] w-full max-w-[1100px] px-6 py-8 outline-none">
        <Link href={`/${lang}/p/${id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-navy transition hover:underline">
          <Back className="size-4" aria-hidden />
          {c.back}
        </Link>

        <div className="mt-5 grid items-start gap-5 min-[900px]:grid-cols-[300px_minmax(0,1fr)]">
          {/* Device summary */}
          <aside className="w-full rounded-2xl border border-[#E5E7EB] bg-white p-[22px]">
            <div className="flex h-[150px] items-center justify-center overflow-hidden rounded-xl bg-[#F4F5F7]">
              <img src={productPhoto(product)} alt={title} className="h-[126px] w-auto max-w-[90%] object-contain" />
            </div>
            <h1 className="mt-4 text-base font-bold leading-7 text-navy">{title}</h1>
            {demo ? <span className="mt-2 inline-flex rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] font-semibold text-navy">{c.demoBadge}</span> : null}
            {specs.length ? (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {specs.map(([label, value]) => (
                  <li key={label} className="rounded-md border border-[#E5E7EB] bg-white px-2 py-1 text-xs text-navy">
                    {label}: {value}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-5 border-t border-[#E5E7EB] pt-4">
              <p className="text-xs text-ink-mute">{c.startsFrom}</p>
              <p className="mt-1 text-[26px] font-bold leading-tight text-navy">
                {money(lowest ?? product.price)} <span className="text-base">{t.deals.currency}</span>
              </p>
              <p className="mt-1 text-xs text-ink-mute">
                {(count === 1 ? c.countOne : c.countMany).replace("{count}", String(count))}
              </p>
            </div>
          </aside>

          {/* Shop offers */}
          <section aria-labelledby="offers-title" className="min-w-0">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 id="offers-title" className="text-lg font-bold text-navy">
                {c.offersTitle.replace("{count}", String(count))}
              </h2>
              <p className="text-xs text-ink-mute">{c.sortNote}</p>
            </div>
            <ul className="mt-3 space-y-3">
              {offers.map((offer) => {
                const best = offer.price === lowest;
                return (
                  <li
                    key={offer.id}
                    className={`flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[14px] border border-[#E5E7EB] px-[22px] py-[18px] ${best ? "bg-[#FAFAFA]" : "bg-white"}`}
                  >
                    <div className="flex min-w-0 flex-1 basis-48 items-center gap-3">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#F4F5F7] text-navy">
                        <Store className="size-5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-bold text-navy">{shopLabel(offer.shop!.name, lang, t)}</span>
                          {best ? <span className="rounded-full bg-navy px-2.5 py-0.5 text-[11px] font-semibold text-white">{c.lowest}</span> : null}
                          {offer.id === id ? (
                            <span className="rounded-full border border-[#E5E7EB] bg-white px-2.5 py-0.5 text-[11px] font-semibold text-navy">{c.opened}</span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                    <div className="ms-auto flex flex-wrap items-center gap-x-5 gap-y-3">
                      <p className="text-[21px] font-bold text-navy">
                        {money(offer.price)} <span className="text-sm font-semibold">{t.deals.currency}</span>
                      </p>
                      <Link
                        href={`/${lang}/p/${offer.id}`}
                        className={`inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors ${best ? "bg-brand-ink text-white hover:opacity-90" : "border border-[#D1D5DB] bg-white text-navy hover:bg-[#F9FAFB]"}`}
                      >
                        {c.viewProduct}
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 flex items-start gap-2 text-xs leading-6 text-ink-mute">
              <Info className="mt-1 size-3.5 shrink-0" aria-hidden />
              {c.demoNote}
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
