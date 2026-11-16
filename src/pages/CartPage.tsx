import { Minus, Plus } from "lucide-react";
import { Link } from "wouter";
import { OfferGrid, type OfferProduct } from "@/components/site/Offers";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { useCart } from "@/lib/cart";
import { useCartPricing } from "@/lib/cart-pricing";
import { CHECKOUT_COPY } from "@/lib/checkout-copy";
import { useLang } from "@/lib/i18n";
import { productPhoto } from "@/lib/products";
import { productCategoryOf, productInCategory } from "@/lib/product-categories";
import { shopLabel } from "@/lib/shop-label";
import { useSiteContent } from "@/lib/site-content";
import { WHOLESALE_MIN } from "@/lib/wholesale";

const money = (value: number) => value.toLocaleString("en-US");

const SIMILAR_LIMIT = 4;

/** The cart as a full page. Same cart state, quantities, removal, pricing and checkout route as the side drawer. */
export function CartPage() {
  const { t, lang } = useLang();
  const { setQty, remove } = useCart();
  const { rows, total, pieces, anyWholesale, signedIn, local } = useCartPricing();
  const { content, productById } = useSiteContent();

  // Similar products: from the same departments as the cart's products, up to 4, the site's own product cards. Products already
  // in the cart, hidden or archived ones (productById leaves them out) and a second listing of a product already shown are skipped.
  // Nothing fills the gap: fewer than 4 means fewer cards, none means no section.
  const similar: OfferProduct[] = (() => {
    const inCart = new Set(rows.map((row) => row.line.id));
    const cartRows = content.products.filter((item) => inCart.has(item.id));
    const departments = [...new Set(cartRows.map((item) => productCategoryOf(item)).filter((id): id is string => Boolean(id)))];
    if (!departments.length) return [];
    const seenKeys = new Set(cartRows.map((item) => item.matchKey).filter((key): key is string => Boolean(key)));
    const picked: OfferProduct[] = [];
    for (const item of content.products) {
      if (picked.length >= SIMILAR_LIMIT) break;
      if (inCart.has(item.id) || (item.matchKey && seenKeys.has(item.matchKey))) continue;
      if (!departments.some((department) => productInCategory(item, department))) continue;
      const offer = productById(item.id);
      if (!offer) continue;
      if (item.matchKey) seenKeys.add(item.matchKey);
      picked.push(offer);
    }
    return picked;
  })();
  const copy = t.cartPage;
  const w = t.wholesale;
  const cur = t.deals.currency;

  const plural = (count: number, one: string, two: string, few: string, many: string) =>
    (count === 1 ? one : count === 2 ? two : count <= 10 ? few : many).replace("{count}", String(count));
  const summaryCount = `${plural(rows.length, copy.productsOne, copy.productsTwo, copy.productsFew, copy.productsMany)} · ${plural(pieces, copy.piecesOne, copy.piecesTwo, copy.piecesFew, copy.piecesMany)}`;

  return (
    <div className="inner-page-white min-h-svh bg-[var(--page-bg)] text-navy">
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <div className="mx-auto w-full max-w-[1240px] px-[18px] py-6">
        {rows.length === 0 ? (
          <section className="bg-white px-[22px] py-10">
            <h1 className="text-2xl font-semibold">{copy.title}</h1>
            <p className="mt-3 text-sm leading-7 text-navy/60">{t.cartEmptyMessage}</p>
            <Link href={`/${lang}`} className="mt-6 inline-flex h-11 items-center rounded-full bg-[#20C5D4] px-6 text-sm font-semibold text-navy transition-colors hover:bg-brand-hover">
              {CHECKOUT_COPY[lang].backToStore}
            </Link>
          </section>
        ) : (
          <div className="grid items-start gap-[19px] min-[900px]:grid-cols-[minmax(0,1fr)_282px]">
            <section aria-labelledby="cart-title" className="min-w-0 bg-white">
              <div className="flex h-[60px] items-center justify-between gap-4 border-b border-navy/10 px-[22px]">
                <h1 id="cart-title" className="text-2xl font-semibold">
                  {copy.title}
                </h1>
                <span className="text-sm text-ink-mute">{t.cartTotal}</span>
              </div>

              <ul className="divide-y divide-navy/10">
                {rows.map(({ line, product, copy: item, priced, wholesale, nudge, shop }) => {
                  const lineTotal = priced.unit * line.qty;
                  return (
                    <li key={line.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-5 gap-y-3 px-[22px] py-[17px] min-[640px]:grid-cols-[auto_minmax(0,1fr)_auto]">
                      <Link href={`/${lang}/p/${encodeURIComponent(line.id)}`} className="block w-24 shrink-0 min-[640px]:w-32" aria-hidden tabIndex={-1}>
                        <img src={productPhoto(product ?? { id: line.id })} alt="" className="max-h-[110px] w-full object-contain" />
                      </Link>

                      <div className="min-w-0">
                        <Link href={`/${lang}/p/${encodeURIComponent(line.id)}`} className="block text-base font-semibold leading-6 transition-colors hover:text-brand-ink">
                          {item?.name ?? line.id}
                        </Link>
                        {shop ? (
                          <p className="mt-0.5 text-sm text-ink-mute">
                            {t.compare.shopLabel}: {shopLabel(shop.name, lang, t)}
                          </p>
                        ) : null}
                        <p className="mt-2 text-lg font-semibold text-brand-ink">
                          {copy.perPiece.replace("{price}", money(priced.unit)).replace("{currency}", cur)}
                          {priced.wholesale ? <span className="ms-2 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold">{w.cartApplied}</span> : null}
                        </p>

                        {nudge && wholesale !== null ? (
                          <div className="mt-3 max-w-md rounded-xl bg-brand/10 px-3 py-2 text-xs leading-5 text-navy">
                            <p className="font-semibold">{w.cartNudge.replace("{price}", money(wholesale)).replace("{currency}", cur)}</p>
                            <p className="text-navy/70">{w.cartNudgeTotal.replace("{total}", money(wholesale * WHOLESALE_MIN)).replace("{currency}", cur)}</p>
                            {signedIn ? null : <p className="mt-1 text-navy/70">{w.loginRequired}</p>}
                          </div>
                        ) : null}
                        {!signedIn && wholesale !== null && line.qty >= WHOLESALE_MIN ? (
                          <p className="mt-3 max-w-md rounded-xl bg-brand/10 px-3 py-2 text-xs leading-5 text-navy/70">{w.loginRequired}</p>
                        ) : null}

                        <div className="mt-3 flex items-center gap-4">
                          <div className="inline-flex h-9 items-center rounded-full border border-navy/15 bg-white">
                            <button type="button" aria-label={t.deals.decrease} onClick={() => setQty(line.id, line.qty - 1)} className="grid size-9 cursor-pointer place-items-center">
                              <Minus className="size-4" aria-hidden />
                            </button>
                            <span className="w-7 text-center text-sm font-semibold" aria-live="polite">
                              {line.qty}
                            </span>
                            <button type="button" aria-label={t.deals.increase} onClick={() => setQty(line.id, line.qty + 1)} className="grid size-9 cursor-pointer place-items-center">
                              <Plus className="size-4" aria-hidden />
                            </button>
                          </div>
                          <button type="button" onClick={() => remove(line.id)} className="cursor-pointer text-sm text-navy/50 transition-colors hover:text-navy">
                            {t.cartRemove}
                          </button>
                        </div>
                      </div>

                      <div className="col-span-2 min-[640px]:col-span-1 min-[640px]:text-end">
                        <p className="text-lg font-semibold tabular-nums">
                          {money(lineTotal)} <span className="text-sm font-medium">{cur}</span>
                        </p>
                        {line.qty > 1 ? <p className="mt-0.5 text-xs text-ink-mute">{copy.lineBreakdown.replace("{qty}", String(line.qty)).replace("{price}", money(priced.unit))}</p> : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <aside aria-labelledby="summary-title" className="bg-white px-[22px] py-5">
              <h2 id="summary-title" className="text-lg font-semibold">
                {copy.summary}
              </h2>
              <p className="mt-3 text-sm text-ink-mute">{summaryCount}</p>
              <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-navy/10 pt-4">
                <span className="text-sm font-medium">{t.cartTotal}</span>
                <span className="text-lg font-bold tabular-nums text-brand-ink">
                  {money(total)} {cur}
                </span>
              </div>
              <Link
                href={`/${lang}/checkout`}
                className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#20C5D4] text-sm font-bold text-navy transition-colors hover:bg-brand-hover"
              >
                {CHECKOUT_COPY[lang].checkout}
              </Link>
              {/* Only the local preview is unconnected to the server: with the store's server the checkout prices the same way. */}
              {anyWholesale && local ? <p className="mt-3 text-xs leading-5 text-navy/55">{w.previewNote}</p> : null}
            </aside>
          </div>
        )}
        </div>

        {/* A white band across the whole screen; its content lines up with the cart above. */}
        {rows.length > 0 && similar.length > 0 ? (
          <section className="bg-white pb-10 pt-8" aria-labelledby="similar-title">
            <div className="mx-auto w-full max-w-[1240px] px-[18px]">
              <h2 id="similar-title" className="text-xl font-bold sm:text-2xl">
                {t.productPage.related}
              </h2>
              <OfferGrid products={similar} />
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
