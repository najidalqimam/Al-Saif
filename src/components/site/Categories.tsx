import { useId, useState } from "react";
import { Link } from "wouter";
import { ChevronDown, LayoutGrid, type LucideIcon } from "lucide-react";
import { catalogIcon } from "@/components/site/catalog-icons";
import { categoryLabel, childCategories, rootDepartments } from "@/lib/catalog";
import { useLang } from "@/lib/i18n";
import { useSiteContent } from "@/lib/site-content";
import { publicUrl } from "@/lib/utils";

const INITIAL_COUNT = 14;
// Phones show fewer tiles (three rows of two) until the visitor expands the list.
const MOBILE_COUNT = 6;

function DepartmentTile({ name, image, icon: Icon, href }: { name: string; image?: string; icon: LucideIcon; href: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <Link href={href} className="dept-tile">
      <span className="dept-tile__media">
        {image && !failed ? (
          <img
            src={publicUrl(image)}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            className="dept-tile__img"
          />
        ) : (
          <Icon className="dept-tile__mark" strokeWidth={1.5} aria-hidden />
        )}
        {image && !failed ? (
          <span className="dept-tile__badge" aria-hidden>
            <Icon className="size-4" strokeWidth={1.75} />
          </span>
        ) : null}
      </span>
      <span className="dept-tile__name">{name}</span>
    </Link>
  );
}

export function Categories() {
  const { lang, t } = useLang();
  const [open, setOpen] = useState(false);
  const listId = useId();
  const { content } = useSiteContent();
  const catalog = content.catalog[lang];
  const all = rootDepartments(content.categoryHidden);
  const visible = open ? all : all.slice(0, INITIAL_COUNT);
  const hasMore = all.length > MOBILE_COUNT;
  const hasMoreDesktop = all.length > INITIAL_COUNT;
  // Departments without their own picture borrow the first listed sub-department's picture.
  const imageFor = (item: (typeof all)[number]) =>
    item.image || childCategories(item.id, content.categoryHidden).find((child) => child.image)?.image || undefined;

  const [titleHead, titleTail] = catalog.title.split(/(?<=[،,])\s+/, 2);

  return (
    <section className="section-y tone-b tone-white-light" aria-labelledby="categories-title">
      <div className="page-shell">
        <div className="reveal flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="flex max-w-2xl items-start gap-3.5">
            <span className="dept-heading-mark" aria-hidden>
              <LayoutGrid className="size-5" strokeWidth={1.75} />
            </span>
            <div>
              <h2 id="categories-title" className="section-title dept-title">
                {titleHead}
                {titleTail ? (
                  <>
                    {/* On phones, break after the comma so each line reads as a whole phrase. */}
                    <br className="sm:hidden" />
                    <span className="max-sm:hidden"> </span>
                    {titleTail}
                  </>
                ) : null}
              </h2>
              <p className="section-lead">{catalog.subtitle}</p>
            </div>
          </div>
          {hasMore ? (
            <button
              type="button"
              className={`dept-toggle ${hasMoreDesktop ? "" : "sm:hidden"}`}
              aria-expanded={open}
              aria-controls={listId}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? t.catalog.fewerDepartments : t.catalog.moreDepartments}
              <ChevronDown className="dept-toggle__icon size-4" aria-hidden />
            </button>
          ) : null}
        </div>

        <ul id={listId} className="reveal dept-grid mt-6" aria-label={catalog.title}>
          {visible.map((item, index) => (
            <li
              key={item.id}
              className={
                [index >= INITIAL_COUNT ? "dept-grid__more" : "", !open && index >= MOBILE_COUNT ? "max-sm:hidden" : ""]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
            >
              <DepartmentTile
                name={categoryLabel(item, lang)}
                image={imageFor(item)}
                icon={catalogIcon(item.icon)}
                href={`/${lang}/c/${item.slug}`}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
