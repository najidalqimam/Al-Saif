import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, LayoutGrid } from "lucide-react";
import { Link } from "wouter";
import { catalogIcon } from "@/components/site/catalog-icons";
import {
  categoryBlurb,
  categoryLabel,
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
        className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full bg-brand px-4 text-sm font-bold text-navy transition-colors hover:bg-brand-hover"
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
            <div className="min-h-0 max-h-[46%] overflow-y-auto overscroll-contain border-b border-navy/10 bg-[#f4f7fb] p-2 sm:max-h-none sm:w-60 sm:shrink-0 sm:border-b-0 sm:border-e">
              {roots.map((item) => {
                const selected = item.id === active.id;
                const Icon = catalogIcon(item.icon);
                return (
                  <Link
                    key={item.id}
                    href={`/${lang}/c/${item.slug}`}
                    onMouseEnter={() => setActiveId(item.id)}
                    onFocus={() => setActiveId(item.id)}
                    onClick={(event) => {
                      // Touch screens have no hover, so a tap previews the department first.
                      if (window.matchMedia("(hover: none)").matches && item.id !== activeId) {
                        event.preventDefault();
                        setActiveId(item.id);
                        return;
                      }
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-start text-sm ${
                      selected ? "bg-white font-semibold text-brand-ink shadow-sm" : "text-navy/80 hover:bg-white/70"
                    }`}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="line-clamp-2">{categoryLabel(item, lang)}</span>
                  </Link>
                );
              })}
            </div>
            <DepartmentPanel active={active} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DepartmentPanel({ active, onNavigate }: { active: CatalogCategory; onNavigate: () => void }) {
  const { t, lang } = useLang();

  // The store has main departments only: the panel names the department and opens its products.
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
      <p className="text-base font-bold">{categoryLabel(active, lang)}</p>
      <p className="mt-1 text-xs leading-5 text-ink-soft">{categoryBlurb(active, lang)}</p>
      <Link
        href={`/${lang}/c/${active.slug}`}
        onClick={onNavigate}
        className="mt-4 inline-flex h-10 items-center rounded-full bg-brand px-5 text-sm font-semibold text-navy transition-colors hover:bg-brand-hover"
      >
        {t.categoryPage.open}
      </Link>
    </div>
  );
}
