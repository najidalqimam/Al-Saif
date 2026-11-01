import { useState } from "react";
import { Archive, ArchiveRestore, ChevronDown } from "lucide-react";
import { heroDefaultLink } from "@/components/site/Hero";
import { categoryLabel, childCategories, rootDepartments } from "@/lib/catalog";
import { translations } from "@/lib/i18n";
import { useSiteContent } from "@/lib/site-content";
import { cn, publicUrl } from "@/lib/utils";
import { Badge, BilingualField, Button, Confirm, IconButton, Select, Switch, num } from "./ui";

// Same artwork order as the storefront hero.
export const SLIDE_ART = ["/hero-visuals/console.png?v=4", "/hero-visuals/headset.png?v=6", "/hero-visuals/phone.png?v=4"];

/** Slide list for the hero card's drawer: switch, edit and archive each slide. */
export function SlidesEditor() {
  const { content, updateHero, setSlideHidden, setSlideArchived } = useSiteContent();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [archiving, setArchiving] = useState<number | null>(null);

  const slides = content.hero.ar.map((slide, index) => ({ index, ar: slide, en: content.hero.en[index] }));
  // Pages a slide's button can open: the offers page, then every department and the categories inside it.
  const destinations: Array<[string, string]> = [["offers", "صفحة العروض"]];
  for (const root of rootDepartments(content.categoryHidden)) {
    destinations.push([`c/${root.slug}`, categoryLabel(root, "ar")]);
    for (const child of childCategories(root.id, content.categoryHidden)) {
      destinations.push([`c/${child.slug}`, `${categoryLabel(root, "ar")} ← ${categoryLabel(child, "ar")}`]);
    }
  }
  const active = slides.filter(({ index }) => !content.heroArchived.includes(index));
  const archived = slides.filter(({ index }) => content.heroArchived.includes(index));

  return (
    <div className="space-y-3">
      <p className="text-sm leading-7 text-(--a-muted)">أوقف الشريحة لتختفي مؤقتًا من البانر. لو أوقفت الكل يرجع البانر يعرضها كلها.</p>

      {active.map(({ index, ar, en }) => {
        const on = !content.heroHidden.includes(index);
        const expanded = openIndex === index;
        return (
          <article key={index} className="overflow-hidden rounded-xl border border-(--a-line) bg-(--a-surface)">
            <div className="flex items-center gap-3 p-3">
              <span
                className={cn("relative h-14 w-20 shrink-0 overflow-hidden rounded-lg transition", on ? "" : "opacity-50 grayscale")}
                style={{ background: "radial-gradient(60% 75% at 50% 60%, rgba(37,217,230,.2), transparent 70%), linear-gradient(180deg,#111d32,#1a2c47)" }}
              >
                <img src={publicUrl(SLIDE_ART[index] ?? SLIDE_ART[0])} alt="" className="absolute inset-x-0 bottom-[6%] mx-auto h-[82%] w-auto max-w-[90%] object-contain" />
              </span>
              <button type="button" onClick={() => setOpenIndex(expanded ? null : index)} aria-expanded={expanded} className="min-w-0 flex-1 text-start">
                <p className="flex items-center gap-2 text-xs text-(--a-muted)">
                  الشريحة {num.format(index + 1)}
                  <Badge tone={on ? "accent" : "muted"}>{on ? "مفعّلة" : "موقوفة"}</Badge>
                </p>
                <p className="mt-1 line-clamp-1 text-sm font-medium">
                  {ar.title} {ar.titleRest}
                </p>
              </button>
              <Switch checked={on} label={`تفعيل الشريحة ${index + 1}`} onChange={(next) => setSlideHidden(index, !next)} />
              <IconButton icon={Archive} label={`حذف الشريحة ${index + 1}`} tone="danger" onClick={() => setArchiving(index)} />
              <button
                type="button"
                onClick={() => setOpenIndex(expanded ? null : index)}
                aria-label={expanded ? "إخفاء الحقول" : "تعديل النصوص"}
                className="grid size-9 place-items-center rounded-lg text-(--a-muted) hover:bg-(--a-surface-2)"
              >
                <ChevronDown className={cn("size-4 transition", expanded ? "rotate-180" : "")} />
              </button>
            </div>
            {expanded && en ? (
              <div className="space-y-4 border-t border-(--a-line) p-4">
                <BilingualField label="العنوان" ar={ar.title} en={en.title} onAr={(value) => updateHero("ar", index, { title: value })} onEn={(value) => updateHero("en", index, { title: value })} />
                <BilingualField
                  label="تكملة العنوان"
                  ar={ar.titleRest}
                  en={en.titleRest}
                  onAr={(value) => updateHero("ar", index, { titleRest: value })}
                  onEn={(value) => updateHero("en", index, { titleRest: value })}
                />
                <BilingualField
                  label="الوصف"
                  ar={ar.lead}
                  en={en.lead}
                  onAr={(value) => updateHero("ar", index, { lead: value })}
                  onEn={(value) => updateHero("en", index, { lead: value })}
                  multiline
                />

                <div className="space-y-4 rounded-xl border border-(--a-line) bg-(--a-surface-2) p-3">
                  <p className="text-xs font-medium text-(--a-muted)">الزرار</p>
                  <BilingualField
                    label="المكتوب على الزرار"
                    ar={ar.primary ?? translations.ar.hero.slides[index]?.primary ?? ""}
                    en={en.primary ?? translations.en.hero.slides[index]?.primary ?? ""}
                    onAr={(value) => updateHero("ar", index, { primary: value })}
                    onEn={(value) => updateHero("en", index, { primary: value })}
                  />
                  <Select
                    label="الزرار يفتح"
                    value={ar.link ?? heroDefaultLink(index)}
                    options={destinations}
                    onChange={(link) => {
                      updateHero("ar", index, { link });
                      updateHero("en", index, { link });
                    }}
                  />
                </div>

                <div className="space-y-4 rounded-xl border border-(--a-line) bg-(--a-surface-2) p-3">
                  <p className="text-xs font-medium text-(--a-muted)">البطاقة تحت الزرار</p>
                  <BilingualField
                    label="عنوان البطاقة"
                    ar={ar.offer ?? translations.ar.hero.slides[index]?.offer ?? ""}
                    en={en.offer ?? translations.en.hero.slides[index]?.offer ?? ""}
                    onAr={(value) => updateHero("ar", index, { offer: value })}
                    onEn={(value) => updateHero("en", index, { offer: value })}
                  />
                  <BilingualField
                    label="الجمل (كل جملة في سطر)"
                    ar={(ar.points ?? translations.ar.hero.slides[index]?.points ?? []).join("\n")}
                    en={(en.points ?? translations.en.hero.slides[index]?.points ?? []).join("\n")}
                    onAr={(value) => updateHero("ar", index, { points: value.split("\n") })}
                    onEn={(value) => updateHero("en", index, { points: value.split("\n") })}
                    multiline
                  />
                  <p className="text-xs leading-6 text-(--a-muted)">لو فضّيت العنوان والجمل، البطاقة تختفي من الشريحة.</p>
                </div>
              </div>
            ) : null}
          </article>
        );
      })}

      {archived.length ? (
        <div className="rounded-xl border border-dashed border-(--a-line) p-3">
          <p className="mb-2 text-xs font-medium text-(--a-muted)">الأرشيف</p>
          <ul className="space-y-2">
            {archived.map(({ index, ar }) => (
              <li key={index} className="flex items-center justify-between gap-3">
                <span className="line-clamp-1 text-sm">
                  #{num.format(index + 1)} · {ar.title} {ar.titleRest}
                </span>
                <Button icon={ArchiveRestore} onClick={() => setSlideArchived(index, false)}>
                  استرجاع
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Confirm
        open={archiving !== null}
        onClose={() => setArchiving(null)}
        onConfirm={() => archiving !== null && setSlideArchived(archiving, true)}
        title={`حذف الشريحة ${archiving !== null ? num.format(archiving + 1) : ""}؟`}
        lead="الشريحة تختفي من البانر وتنتقل للأرشيف، ونصوصها تبقى محفوظة."
        action="نقل للأرشيف"
      />
    </div>
  );
}
