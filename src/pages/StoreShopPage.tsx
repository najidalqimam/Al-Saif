import { Link } from "wouter";
import { MapPin, Store } from "lucide-react";
import { OfferGrid } from "@/components/site/Offers";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { useLang } from "@/lib/i18n";
import { shopLabel } from "@/lib/shop-label";
import { useSiteContent } from "@/lib/site-content";

const COPY = {
  ar: { back: "الرئيسية", products: "منتجات المحل", about: "عن المحل", none: "ما فيه منتجات معروضة في هذا المحل الآن.", notFound: "ما لقينا هذا المحل", count: (n: number) => `${n} منتج` },
  en: { back: "Home", products: "Shop products", about: "About the shop", none: "This shop has no products on display right now.", notFound: "Shop not found", count: (n: number) => `${n} products` },
  ur: { back: "ہوم", products: "دکان کی مصنوعات", about: "دکان کے بارے میں", none: "اس دکان کی کوئی مصنوعات فی الحال دستیاب نہیں۔", notFound: "دکان نہیں ملی", count: (n: number) => `${n} مصنوعات` },
} as const;

/** A shop's page on the store: who it is and the products it sells (only published ones the admin approved and left visible). */
export function StoreShopPage({ id }: { id: string }) {
  const { t, lang } = useLang();
  const { shops, content, visibleProducts } = useSiteContent();
  const copy = COPY[lang];
  const shop = shops.find((item) => item.id === id);
  const sells = new Set(content.products.filter((item) => item.shopId === id && !item.approval).map((item) => item.id));
  const products = visibleProducts("all").filter((item) => sells.has(item.id));

  return (
    <div className="min-h-svh bg-[var(--tone-a)] text-navy">
      <SiteHeader />
      <main id="main" tabIndex={-1} className="tone-scope mx-auto max-w-7xl px-4 py-10 outline-none">
        <nav aria-label="breadcrumb" className="mb-4 text-sm text-ink-soft">
          <Link href={`/${lang}`} className="transition hover:text-navy">
            {copy.back}
          </Link>
        </nav>
        {shop ? (
          <>
            <header className="flex flex-wrap items-start gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
                <Store className="size-7" />
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">{shopLabel(shop.name, lang, t)}</h1>
                {shop.city?.trim() || shop.address?.trim() ? (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
                    <MapPin className="size-4 shrink-0" />
                    {[shop.city, shop.address].filter((part) => part?.trim()).join(" · ")}
                  </p>
                ) : null}
              </div>
            </header>
            {shop.description?.trim() ? (
              <section className="mt-5 max-w-3xl">
                <h2 className="text-sm font-semibold text-navy">{copy.about}</h2>
                <p className="mt-1 text-sm leading-7 text-navy/70">{shop.description}</p>
              </section>
            ) : null}
            <h2 className="mt-8 text-xl font-bold text-navy">
              {copy.products} <span className="text-sm font-normal text-ink-soft">({copy.count(products.length)})</span>
            </h2>
            {products.length ? <OfferGrid products={products} /> : <p className="mt-4 text-sm text-ink-soft">{copy.none}</p>}
          </>
        ) : (
          <p className="py-16 text-center text-ink-soft">{copy.notFound}</p>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
