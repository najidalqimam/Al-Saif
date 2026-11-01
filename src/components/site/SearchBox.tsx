import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { catalogIcon } from "@/components/site/catalog-icons";
import { categoryLabel, categoryTrail } from "@/lib/catalog";
import { useLang } from "@/lib/i18n";
import { productPhoto } from "@/lib/products";
import { searchStore } from "@/lib/search";
import { useSiteContent } from "@/lib/site-content";

// The header search box. While typing, a list under it suggests matching departments and products,
// like a browser's address bar; Enter (or the first row) opens the full results page.

const MAX_CATEGORIES = 4;
const MAX_PRODUCTS = 5;

type Suggestion = { key: string; href: string; content: ReactNode };

/** Bolds the part of the label that matches what was typed, when it appears as typed. */
function highlight(label: string, query: string) {
  const at = label.toLowerCase().indexOf(query.toLowerCase());
  if (!query || at < 0) return label;
  return (
    <>
      {label.slice(0, at)}
      <strong className="font-bold">{label.slice(at, at + query.length)}</strong>
      {label.slice(at + query.length)}
    </>
  );
}

export function SearchBox({ overHero, light }: { overHero: boolean; light: boolean }) {
  const { t, lang } = useLang();
  const { content, productById, copyOf } = useSiteContent();
  const [location, navigate] = useLocation();
  const search = useSearch();
  const onSearchPage = /^\/(ar|en)\/search$/.test(location);
  const urlQuery = onSearchPage ? (new URLSearchParams(search).get("q") ?? "") : "";
  const [query, setQuery] = useState(urlQuery);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  // The box shows the current search on the results page and clears when leaving it.
  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  // A new page (picking a suggestion, pressing Enter) closes the list.
  useEffect(() => {
    setOpen(false);
    setActive(-1);
  }, [location, search]);

  const text = query.trim();
  const searchHref = `/${lang}/search?q=${encodeURIComponent(text)}`;
  const suggestions: Suggestion[] = [];

  if (text) {
    const result = searchStore(text, content.products, content.categoryHidden);
    suggestions.push({
      key: "search",
      href: searchHref,
      content: (
        <>
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand-ink">
            <Search className="size-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1 truncate">{t.searchFor.replace("{query}", text)}</span>
        </>
      ),
    });
    for (const category of result.categories.slice(0, MAX_CATEGORIES)) {
      const Icon = catalogIcon(category.icon);
      const parent = categoryTrail(category.id).slice(0, -1).pop();
      suggestions.push({
        key: `c:${category.id}`,
        href: `/${lang}/c/${category.slug}`,
        content: (
          <>
            <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-[var(--tone-b)]">
              {category.image ? (
                <img src={category.image} alt="" className="size-9 object-contain" loading="lazy" />
              ) : (
                <Icon className="size-4 text-brand-ink" aria-hidden />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate">{highlight(categoryLabel(category, lang), text)}</span>
              <span className={`block truncate text-xs ${overHero ? "text-white/55" : "text-ink-mute"}`}>
                {parent ? `${t.searchDepartment} · ${categoryLabel(parent, lang)}` : t.searchDepartment}
              </span>
            </span>
          </>
        ),
      });
    }
    for (const id of result.productIds) {
      if (suggestions.length >= 1 + MAX_CATEGORIES + MAX_PRODUCTS) break;
      const product = productById(id);
      const copy = copyOf(lang, id);
      if (!product || !copy) continue;
      suggestions.push({
        key: `p:${id}`,
        href: `/${lang}/p/${encodeURIComponent(id)}`,
        content: (
          <>
            <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white">
              <img src={productPhoto(product)} alt="" className="size-9 object-contain" loading="lazy" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate">{highlight(copy.name, text)}</span>
              <span className={`block truncate text-xs ${overHero ? "text-white/55" : "text-ink-mute"}`}>{copy.category}</span>
            </span>
            <span className={`shrink-0 text-sm font-semibold ${overHero ? "text-mint" : "text-brand-ink"}`}>
              {product.price.toLocaleString("en-US")} {t.deals.currency}
            </span>
          </>
        ),
      });
    }
  }

  const showList = open && suggestions.length > 0;

  function go(href: string) {
    setOpen(false);
    setActive(-1);
    inputRef.current?.blur();
    navigate(href);
  }

  return (
    <form
      className="relative order-last w-full md:order-none md:min-w-0 md:flex-1"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        if (showList && active >= 0) go(suggestions[active].href);
        else if (text) go(searchHref);
      }}
    >
      <label className="relative block">
        <span className="sr-only">{t.searchLabel}</span>
        <Search
          className={`pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 ${
            overHero ? "text-white/60" : "text-ink-mute"
          }`}
        />
        <input
          ref={inputRef}
          type="search"
          name="q"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              setActive(-1);
            } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              if (!suggestions.length) return;
              event.preventDefault();
              setOpen(true);
              const step = event.key === "ArrowDown" ? 1 : -1;
              // Cycles through the rows and back to the box itself (-1).
              setActive((current) => {
                const next = current + step;
                if (next >= suggestions.length) return -1;
                if (next < -1) return suggestions.length - 1;
                return next;
              });
            }
          }}
          enterKeyHint="search"
          placeholder={t.searchPlaceholder}
          className={`h-11 w-full rounded-full border ps-11 pe-4 text-sm outline-none transition duration-300 placeholder:transition-colors focus:border-brand ${
            overHero
              ? "border-white/20 bg-white/10 text-white placeholder:text-white/65 focus:bg-white/15"
              : light
                ? "border-navy/15 bg-white/70 text-navy placeholder:text-ink-mute focus:bg-white"
                : "border-navy/15 bg-[#f4f7fb] text-navy placeholder:text-ink-mute focus:bg-white"
          }`}
        />
      </label>

      {showList ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={t.searchLabel}
          className={`absolute inset-x-0 top-full z-50 mt-2 max-h-[70svh] overflow-y-auto rounded-2xl border p-1.5 shadow-[0_18px_40px_rgba(11,18,32,0.18)] ${
            overHero ? "border-white/10 bg-[#142238] text-white" : "border-navy/10 bg-white text-navy"
          }`}
        >
          {suggestions.map((item, index) => (
            <li
              key={item.key}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              // Keeps focus in the box so the blur that closes the list doesn't swallow the click.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => go(item.href)}
              onMouseEnter={() => setActive(index)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm ${
                index === active ? (overHero ? "bg-white/10" : "bg-[var(--tone-b)]") : ""
              }`}
            >
              {item.content}
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}
