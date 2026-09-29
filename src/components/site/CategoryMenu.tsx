import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, LayoutGrid } from "lucide-react";
import { Link } from "wouter";
import { catalogIcon } from "@/components/site/catalog-icons";
import {
  categoryBlurb,
  categoryLabel,
  childCategories,
  rootDepartments,
  type CatalogCategory,
} from "@/lib/catalog";
import { useLang } from "@/lib/i18n";
import { useSiteContent } from "@/lib/site-content";

export function CategoryMenu() {
  const { t, lang } = useLang();
  const { content } = useSiteContent();
  const roots = rootDepartments(content.categoryHidden);
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(roots[0]?.id ?? "");
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const active = roots.find((item) => item.id === activeId) ?? roots[0];
  const branches = active ? childCategories(active.id, content.categoryHidden) : [];

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-emerald px-4 text-sm font-medium text-white"
      >
        <LayoutGrid className="size-4" />
        {t.allCategories}
        <ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && active ? (
        <div
          id={menuId}
          className="absolute start-0 z-30 mt-2 w-[min(880px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-navy/10 bg-white text-navy shadow-xl"
        >
          <div className="flex h-[min(70vh,32rem)] min-h-0 flex-col sm:flex-row">
            <div className="min-h-0 max-h-[46%] overflow-y-auto overscroll-contain border-b border-navy/10 bg-[#f7f8f5] p-2 sm:max-h-none sm:w-60 sm:shrink-0 sm:border-b-0 sm:border-e">
              {roots.map((item) => {
                const selected = item.id === active.id;
                const Icon = catalogIcon(item.icon);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onMouseEnter={() => setActiveId(item.id)}
                    onFocus={() => setActiveId(item.id)}
                    onClick={() => setActiveId(item.id)}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-start text-sm ${
                      selected ? "bg-white font-semibold text-emerald shadow-sm" : "text-navy/80 hover:bg-white/70"
                    }`}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="line-clamp-2">{categoryLabel(item, lang)}</span>
                  </button>
                );
              })}
            </div>
            <DepartmentPanel
              active={active}
              branches={branches}
              hidden={content.categoryHidden}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DepartmentPanel({
  active,
  branches,
  hidden,
  onNavigate,
}: {
  active: CatalogCategory;
  branches: CatalogCategory[];
  hidden: readonly string[];
  onNavigate: () => void;
}) {
  const { t, lang } = useLang();

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-bold">{categoryLabel(active, lang)}</p>
          <p className="mt-1 text-xs leading-5 text-navy/55">{categoryBlurb(active, lang)}</p>
        </div>
        <Link
          href={`/${lang}/c/${active.slug}`}
          onClick={onNavigate}
          className="shrink-0 text-sm font-semibold text-emerald"
        >
          {t.categoryPage.open}
        </Link>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {branches.map((branch) => {
          const leaves = childCategories(branch.id, hidden);
          return (
            <div key={branch.id}>
              <Link
                href={`/${lang}/c/${branch.slug}`}
                onClick={onNavigate}
                className="text-sm font-semibold text-navy hover:text-emerald"
              >
                {categoryLabel(branch, lang)}
              </Link>
              {leaves.length > 0 ? (
                <ul className="mt-1.5 space-y-1">
                  {leaves.map((leaf) => (
                    <li key={leaf.id}>
                      <Link
                        href={`/${lang}/c/${leaf.slug}`}
                        onClick={onNavigate}
                        className="text-xs text-navy/60 hover:text-emerald"
                      >
                        {categoryLabel(leaf, lang)}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
