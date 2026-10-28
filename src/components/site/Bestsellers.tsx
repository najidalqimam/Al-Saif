import { useState } from "react";
import { Boxes } from "lucide-react";
import { ProductDialog, type OfferProduct } from "@/components/site/Offers";
import { IconTile, ProductCard } from "@/components/site/showcase";
import { useFavorites } from "@/lib/favorites";
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
  const { has, toggle } = useFavorites();
  const [openId, setOpenId] = useState<string | null>(null);

  const selectedFilter = t.bestsellers.filters.find((filter) => filter.id === group) ?? t.bestsellers.filters[0];
  const title = t.bestsellers.titleFrom.replace("{name}", selectedFilter.label);
  const ids = GROUPS[group] ?? GROUPS.all;
  const products = ids
    .map((id) => productById(id))
    .filter((item): item is OfferProduct => item !== undefined);
  const openProduct = openId ? productById(openId) ?? null : null;

  return (
    <section className="ambient section-y tone-b tone-swap-light" aria-labelledby="bestsellers-title">
      <div className="page-shell">
        <div className="reveal flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">{block.eyebrow}</p>
            <h2 id="bestsellers-title" className="section-title">
              {title}
            </h2>
            <p className="section-lead">{block.lead}</p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <button
              type="button"
              onClick={() => setGroup("all")}
              className="inline-flex h-11 cursor-pointer items-center rounded-full bg-navy px-5 text-sm font-semibold text-white transition-colors hover:bg-deep"
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
                    className={`h-11 cursor-pointer rounded-full px-4 text-sm font-medium transition-colors ${
                      selected
                        ? "bg-brand text-navy"
                        : "border border-navy/15 bg-white text-navy hover:border-brand hover:text-brand-ink"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="reveal-stagger mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {products.map((product) => {
            const copy = copyOf(lang, product.id) ?? t.deals.products[product.id];
            return (
              <ProductCard
                key={product.id}
                product={product}
                name={copy?.name ?? ""}
                category={copy?.category ?? ""}
                liked={has(product.id)}
                badge={t.bestsellers.badges[product.id]}
                onOpen={() => setOpenId(product.id)}
                onToggleSave={() => toggle(product.id)}
              />
            );
          })}
        </div>

        <div className="mt-10 flex flex-col gap-5 promo-strip rounded-3xl border px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-4">
            <IconTile icon={Boxes} />
            <div>
              <p className="text-base font-bold text-navy">{block.bannerTitle}</p>
              <p className="mt-1 text-sm leading-6 text-ink-soft">{block.bannerLead}</p>
            </div>
          </div>
          <button type="button" className="btn-brand shrink-0">
            {t.bestsellers.bannerAction}
          </button>
        </div>
      </div>

      {openProduct ? (
        <ProductDialog
          product={openProduct}
          liked={has(openProduct.id)}
          onClose={() => setOpenId(null)}
          onToggleSave={() => toggle(openProduct.id)}
        />
      ) : null}
    </section>
  );
}
