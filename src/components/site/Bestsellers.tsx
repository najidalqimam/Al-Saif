import { useState } from "react";
import { Boxes } from "lucide-react";
import { ProductDialog, type OfferProduct } from "@/components/site/Offers";
import { ProductCard, ShowcaseStage } from "@/components/site/showcase";
import { useLang } from "@/lib/i18n";
import { useSiteContent } from "@/lib/site-content";

const GROUPS: Record<string, readonly string[]> = {
  all: ["phone", "console", "controller", "earbuds", "headset"],
  phones: ["phone", "phone-mini", "case", "charger", "cable"],
  playstation: ["console", "controller", "game", "headset", "controller-extra"],
  accessories: ["earbuds", "charger", "storage", "dock", "cable"],
};

export function Bestsellers() {
  const { t, lang } = useLang();
  const { content, copyOf, productById } = useSiteContent();
  const block = content.bestsellers[lang];
  const [group, setGroup] = useState("all");
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [openId, setOpenId] = useState<string | null>(null);

  const selectedFilter = t.bestsellers.filters.find((filter) => filter.id === group) ?? t.bestsellers.filters[0];
  const title = t.bestsellers.titleFrom.replace("{name}", selectedFilter.label);
  const ids = GROUPS[group] ?? GROUPS.all;
  const products = ids
    .map((id) => productById(id))
    .filter((item): item is OfferProduct => item !== undefined);
  const openProduct = openId ? productById(openId) ?? null : null;

  return (
    <section className="ambient bg-[#F7F8F5] py-10" aria-labelledby="bestsellers-title">
      <div className="mx-auto max-w-7xl px-4">
        <div className="reveal flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-navy/55">{block.eyebrow}</p>
            <h2 id="bestsellers-title" className="mt-2 text-2xl font-bold leading-tight text-navy sm:text-3xl">
              {title}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-navy/55">{block.lead}</p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <button
              type="button"
              onClick={() => setGroup("all")}
              className="inline-flex h-10 items-center rounded-full bg-navy px-5 text-sm font-medium text-white"
            >
              {t.bestsellers.viewAll}
            </button>
            <div className="flex flex-wrap gap-2">
              {t.bestsellers.filters.map((filter) => {
                const selected = filter.id === group;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setGroup(filter.id)}
                    className={`h-9 rounded-full px-4 text-sm ${
                      selected ? "bg-navy text-white" : "border border-navy/10 bg-white text-navy"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="reveal-stagger mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {products.map((product) => {
            const copy = copyOf(lang, product.id) ?? t.deals.products[product.id];
            return (
              <ProductCard
                key={product.id}
                product={product}
                name={copy?.name ?? ""}
                category={copy?.category ?? ""}
                liked={saved[product.id] ?? false}
                badge={t.bestsellers.badges[product.id]}
                onOpen={() => setOpenId(product.id)}
                onToggleSave={() => setSaved((current) => ({ ...current, [product.id]: !current[product.id] }))}
              />
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-[#e7f6ee] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-3">
            <ShowcaseStage size="icon">
              <Boxes />
            </ShowcaseStage>
            <div>
              <p className="font-bold text-navy">{block.bannerTitle}</p>
              <p className="mt-1 text-sm leading-6 text-navy/60">{block.bannerLead}</p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-emerald px-5 text-sm font-semibold text-white"
          >
            {t.bestsellers.bannerAction}
          </button>
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
