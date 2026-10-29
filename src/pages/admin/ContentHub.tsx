import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  Headphones,
  Images,
  LayoutGrid,
  PanelBottom,
  Pencil,
  Settings,
  Star,
  Tag,
} from "lucide-react";
import { featuredDepartments } from "@/lib/catalog";
import { useSiteContent, type SectionKey } from "@/lib/site-content";
import { cn } from "@/lib/utils";
import { BlockFields, type BlockKey } from "./Blocks";
import type { View } from "./nav";
import { SlidesEditor } from "./Sliders";
import { Button, Drawer, PageHead, Switch, num, type IconType } from "./ui";

type CardId = SectionKey | "footer";

type Card = {
  id: CardId;
  title: string;
  where: string;
  icon: IconType;
  preview: string;
  meta: string;
  /** Where the card's products or categories are managed, if anywhere. */
  manage?: { view: View; label: string };
};

export function ContentHub({ onOpen }: { onOpen: (view: View) => void }) {
  const { content, setSectionHidden } = useSiteContent();
  const [editing, setEditing] = useState<CardId | null>(null);

  const liveSlides = content.hero.ar.filter((_, index) => !content.heroHidden.includes(index) && !content.heroArchived.includes(index)).length;
  const liveProducts = content.products.filter((item) => !item.hidden && !item.archived);
  const homeOffers = liveProducts.filter((item) => item.onHome).length;

  const cards: Card[] = [
    {
      id: "hero",
      title: "البانر الرئيسي",
      where: "أعلى الصفحة الرئيسية",
      icon: Images,
      preview: `${content.hero.ar[0]?.title ?? ""} ${content.hero.ar[0]?.titleRest ?? ""}`,
      meta: `${num.format(liveSlides)} من ${num.format(content.hero.ar.length)} شرائح مفعّلة`,
    },
    {
      id: "catalog",
      title: "شبكة الأقسام",
      where: "تحت البانر",
      icon: LayoutGrid,
      preview: content.catalog.ar.title,
      meta: `${num.format(featuredDepartments(content.categoryHidden).length)} قسم ظاهر`,
      manage: { view: "departments", label: "إدارة التصنيفات" },
    },
    {
      id: "deals",
      title: "العروض",
      where: "الصفحة الرئيسية وصفحة العروض",
      icon: Tag,
      preview: content.deals.ar.title,
      meta: `${num.format(homeOffers)} منتج في العروض`,
      manage: { view: "products", label: "اختيار المنتجات" },
    },
    {
      id: "bestsellers",
      title: "الأكثر مبيعًا",
      where: "الصفحة الرئيسية",
      icon: Star,
      preview: content.bestsellers.ar.title,
      meta: `${num.format(liveProducts.length)} منتج معروض`,
      manage: { view: "products", label: "إدارة المنتجات" },
    },
    {
      id: "addons",
      title: "الإكسسوارات",
      where: "بعد الأكثر مبيعًا",
      icon: Headphones,
      preview: content.addons.ar.title,
      meta: "٥ منتجات مختارة",
    },
    {
      id: "setups",
      title: "حلول الأعمال",
      where: "آخر الصفحة الرئيسية",
      icon: Building2,
      preview: content.setups.ar.title,
      meta: content.setups.ar.action,
    },
    {
      id: "footer",
      title: "الفوتر",
      where: "أسفل كل صفحات الموقع",
      icon: PanelBottom,
      preview: content.footer.ar.shipping,
      meta: "يظهر دائمًا",
    },
  ];

  const sections = cards.filter((card): card is Card & { id: SectionKey } => card.id !== "footer");
  const liveSections = sections.filter((card) => !content.sectionHidden.includes(card.id)).length;
  const current = cards.find((card) => card.id === editing) ?? null;

  return (
    <div className="space-y-8">
      <PageHead
        title="المحتوى والوسائط"
        lead="كل أقسام الصفحة الرئيسية في مكان واحد. شغّل أو أوقف أي قسم، وعدّل نصوصه بالعربي والإنجليزي. التعديل يتحفظ ويظهر على المتجر مباشرة."
        actions={
          <Link href="/ar" className="inline-flex h-10 items-center gap-2 rounded-xl border border-(--a-line) bg-(--a-surface) px-4 text-sm hover:bg-(--a-surface-2)">
            <ExternalLink className="size-4" />
            معاينة الصفحة الرئيسية
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Summary icon={LayoutGrid} label="أقسام مفعّلة" value={`${num.format(liveSections)} / ${num.format(sections.length)}`} />
        <Summary icon={Images} label="شرائح البانر" value={num.format(liveSlides)} />
        <Summary icon={Tag} label="منتجات في العروض" value={num.format(homeOffers)} />
        <Summary icon={Building2} label="أقسام ظاهرة" value={num.format(featuredDepartments(content.categoryHidden).length)} />
      </div>

      <section>
        <SectionHead title="أقسام الصفحة الرئيسية" lead="مرتبة بنفس ترتيبها في الصفحة. أوقف أي قسم ليختفي من المتجر فورًا." />
        <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card, index) => {
            const toggleable = card.id !== "footer";
            const on = !toggleable || !content.sectionHidden.includes(card.id as SectionKey);
            const Icon = card.icon;
            return (
              <article
                key={card.id}
                className={cn(
                  "group flex flex-col overflow-hidden rounded-2xl border bg-(--a-surface) transition duration-200 hover:-translate-y-0.5 hover:shadow-(--a-shadow)",
                  on ? "border-(--a-line) hover:border-(--a-accent)/35" : "border-dashed border-(--a-line)",
                )}
              >
                <div className="flex items-center justify-between gap-3 border-b border-(--a-line) bg-(--a-surface-2)/40 px-5 py-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-xl transition-colors",
                        on ? "bg-(--a-accent-soft) text-(--a-accent-ink)" : "bg-(--a-surface-2) text-(--a-muted)",
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="text-xs font-medium text-(--a-muted)">القسم {num.format(index + 1)}</span>
                  </div>
                  <label className="flex shrink-0 cursor-pointer items-center gap-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                        on ? "bg-(--a-ok-soft) text-(--a-ok)" : "bg-(--a-surface-2) text-(--a-muted)",
                      )}
                    >
                      <span className={cn("size-1.5 rounded-full", on ? "bg-(--a-ok)" : "bg-(--a-muted)")} />
                      {on ? "مفعّل" : "موقوف"}
                    </span>
                    {toggleable ? (
                      <Switch checked={on} label={`تفعيل قسم ${card.title}`} onChange={(next) => setSectionHidden(card.id as SectionKey, !next)} />
                    ) : (
                      <Switch checked label="الفوتر يظهر دائمًا" onChange={() => {}} disabled />
                    )}
                  </label>
                </div>

                <div className={cn("flex flex-1 flex-col px-5 pt-5 pb-4 transition-opacity", on ? "" : "opacity-60")}>
                  <h3 className="text-base leading-7 font-bold">{card.title}</h3>
                  <p className="mt-0.5 text-[13px] leading-6 text-(--a-muted)">{card.where}</p>

                  <div className="mt-4 rounded-xl border border-(--a-line) bg-(--a-bg)/60 px-4 py-3">
                    <p className="text-[11px] font-medium text-(--a-muted)">النص الحالي</p>
                    <p className="mt-1 line-clamp-2 min-h-12 text-sm leading-6">{card.preview}</p>
                  </div>

                  <p className="mt-3 flex items-center gap-2 text-xs text-(--a-muted)">
                    <span className="size-1 rounded-full bg-(--a-accent)" />
                    {card.meta}
                  </p>
                </div>

                <div className="flex items-center gap-2 border-t border-(--a-line) px-5 py-3.5">
                  <Button icon={Pencil} onClick={() => setEditing(card.id)} className="h-9 flex-1 px-3">
                    تعديل المحتوى
                  </Button>
                  {card.manage ? (
                    <Button icon={ArrowLeft} onClick={() => onOpen(card.manage!.view)} className="h-9 border-transparent bg-transparent px-3 text-(--a-muted) hover:text-(--a-text)">
                      {card.manage.label}
                    </Button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <button
        type="button"
        onClick={() => onOpen("settings")}
        className="flex w-full items-center gap-4 rounded-2xl border border-(--a-line) bg-(--a-surface) p-5 text-start transition hover:-translate-y-0.5 hover:shadow-(--a-shadow)"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--a-surface-2) text-(--a-muted)">
          <Settings className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold">المظهر وإرجاع المحتوى الأصلي</span>
          <span className="mt-0.5 block text-[13px] text-(--a-muted)">انتقلت إلى صفحة إعدادات المتجر.</span>
        </span>
        <ArrowLeft className="size-4 text-(--a-muted)" />
      </button>

      <Drawer
        open={current !== null}
        onClose={() => setEditing(null)}
        title={current ? current.title : ""}
        lead={current ? `${current.where} · التعديل يتحفظ تلقائيًا.` : undefined}
        footer={
          current ? (
            <>
              {current.manage ? (
                <Button
                  icon={ArrowLeft}
                  onClick={() => {
                    setEditing(null);
                    onOpen(current.manage!.view);
                  }}
                >
                  {current.manage.label}
                </Button>
              ) : null}
              <Button variant="primary" onClick={() => setEditing(null)}>
                تم
              </Button>
            </>
          ) : null
        }
      >
        {current ? (
          <div className="space-y-5">
            {current.id !== "footer" ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-(--a-line) p-4">
                <span className="text-sm">القسم ظاهر في الصفحة الرئيسية</span>
                <Switch
                  checked={!content.sectionHidden.includes(current.id)}
                  label={`تفعيل قسم ${current.title}`}
                  onChange={(next) => setSectionHidden(current.id as SectionKey, !next)}
                />
              </div>
            ) : null}
            {current.id === "hero" ? <SlidesEditor /> : <BlockFields block={current.id as BlockKey} />}
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}

function Summary({ icon: Icon, label, value }: { icon: IconType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-(--a-line) bg-(--a-surface) p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--a-blue-soft) text-(--a-blue)">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xl leading-7 font-bold tabular-nums">{value}</p>
        <p className="truncate text-xs text-(--a-muted)">{label}</p>
      </div>
    </div>
  );
}

function SectionHead({ title, lead }: { title: string; lead: string }) {
  return (
    <div className="flex items-end justify-between gap-3 border-b border-(--a-line) pb-3">
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-1 text-sm text-(--a-muted)">{lead}</p>
      </div>
    </div>
  );
}
