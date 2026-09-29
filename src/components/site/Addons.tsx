import { useState } from "react";
import { Check, Puzzle } from "lucide-react";
import { ProductDialog, type OfferProduct } from "@/components/site/Offers";
import { ProductCard } from "@/components/site/showcase";
import { useLang } from "@/lib/i18n";
import { useSiteContent } from "@/lib/site-content";

const PRODUCT_IDS = ["controller-extra", "gaming-earbuds", "charger", "drive-512", "dock"] as const;

export function Addons() {
  const { t, lang } = useLang();
  const { content, copyOf, productById } = useSiteContent();
  const block = content.addons[lang];
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [openId, setOpenId] = useState<string | null>(null);

  const products = PRODUCT_IDS.map((id) => productById(id)).filter((item): item is OfferProduct => item !== undefined);
  const openProduct = openId ? productById(openId) ?? null : null;

  return (
    <section className="bg-white pb-12" aria-labelledby="addons-title">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-sm font-medium text-navy/55">
              <Puzzle className="size-4 text-emerald" />
              {block.eyebrow}
            </p>
            <h2 id="addons-title" className="mt-2 text-2xl font-bold leading-tight text-navy sm:text-3xl">
              {block.title}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-navy/55">{block.lead}</p>
          </div>
          <p className="flex items-center gap-2 text-sm font-medium text-emerald">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald text-white">
              <Check className="size-3.5" />
            </span>
            {block.ready}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {products.map((product) => {
            const copy = copyOf(lang, product.id) ?? t.deals.products[product.id];
            return (
              <ProductCard
                key={product.id}
                product={product}
                name={copy?.name ?? ""}
                category={copy?.category ?? ""}
                liked={saved[product.id] ?? false}
                badge={t.addons.badges[product.id]}
                onOpen={() => setOpenId(product.id)}
                onToggleSave={() => setSaved((current) => ({ ...current, [product.id]: !current[product.id] }))}
              />
            );
          })}
        </div>
      </div>

      {openProduct ? (
        <ProductDialog
          product={openProduct}
          liked={saved[openProduct.id] ?? false}
          onClose={() => setOpenId(null)}
          onToggleSave={() =>
            setSaved((current) => ({ ...current, [openProduct.id]: !current[openProduct.id] }))
          }
        />
      ) : null}
    </section>
  );
}
