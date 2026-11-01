import { useEffect, useId } from "react";
import { Minus, Plus, X } from "lucide-react";
import { Link } from "wouter";
import { useCart } from "@/lib/cart";
import { CHECKOUT_COPY } from "@/lib/checkout-copy";
import { useLang } from "@/lib/i18n";
import { OFFER_PRODUCTS, productPhoto } from "@/lib/products";
import { useSiteContent } from "@/lib/site-content";

function money(value: number) {
  return value.toLocaleString("en-US");
}


export function CartDrawer() {
  const { t, lang } = useLang();
  const { copyOf, productById } = useSiteContent();
  const { lines, open, setOpen, setQty, remove } = useCart();
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  if (!open) return null;

  const rows = lines.map((line) => {
    const product = productById(line.id) ?? OFFER_PRODUCTS.find((item) => item.id === line.id);
    const copy = copyOf(lang, line.id) ?? t.deals.products[line.id];
    return { line, product, copy };
  });
  const total = rows.reduce((sum, row) => sum + (row.product?.price ?? 0) * row.line.qty, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-navy/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col bg-white text-navy shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 bg-navy px-4 py-4 text-white">
          <h2 id={titleId} className="text-lg font-bold">
            {t.cart}
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t.deals.close}
            className="grid size-9 place-items-center rounded-full border border-white/20"
          >
            <X className="size-4" />
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="px-4 py-10 text-sm leading-7 text-navy/55">{t.cartEmptyMessage}</p>
        ) : (
          <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {rows.map(({ line, product, copy }) => (
              // The whole card opens the product page and closes the cart; the quantity and remove buttons sit above the link.
              <li key={line.id} className="group relative flex gap-3 rounded-2xl border border-navy/10 p-3 transition-colors hover:border-brand/40 hover:bg-brand/5">
                <img src={productPhoto(product ?? { id: line.id })} alt="" className="size-16 shrink-0 object-contain" />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/${lang}/p/${encodeURIComponent(line.id)}`}
                    onClick={() => setOpen(false)}
                    className="block truncate text-sm font-semibold transition-colors group-hover:text-brand-ink after:absolute after:inset-0 after:rounded-2xl after:content-['']"
                  >
                    {copy?.name ?? line.id}
                  </Link>
                  <p className="mt-1 text-sm font-bold text-brand-ink">
                    {product ? `${money(product.price)} ${t.deals.currency}` : ""}
                  </p>
                  <div className="relative z-10 mt-2 flex items-center justify-between gap-2">
                    <div className="inline-flex h-8 items-center rounded-full border border-navy/10 bg-white">
                      <button
                        type="button"
                        aria-label={t.deals.decrease}
                        onClick={() => setQty(line.id, line.qty - 1)}
                        className="grid size-8 place-items-center"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{line.qty}</span>
                      <button
                        type="button"
                        aria-label={t.deals.increase}
                        onClick={() => setQty(line.id, line.qty + 1)}
                        className="grid size-8 place-items-center"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <button type="button" onClick={() => remove(line.id)} className="text-xs font-medium text-navy/45">
                      {t.cartRemove}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {rows.length > 0 ? (
          <div className="border-t border-navy/10 px-4 py-4">
            <p className="flex items-center justify-between text-sm">
              <span className="text-navy/60">{t.cartTotal}</span>
              <span className="text-lg font-bold text-brand-ink">
                {money(total)} {t.deals.currency}
              </span>
            </p>
            <Link
              href={`/${lang}/checkout`}
              onClick={() => setOpen(false)}
              className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#20C5D4] text-sm font-bold text-navy transition-colors hover:bg-brand-hover"
            >
              {CHECKOUT_COPY[lang].checkout}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
