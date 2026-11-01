import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useTheme } from "next-themes";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  Megaphone,
  Plus,
  ShoppingBag,
  Trash2,
  Upload,
  Building2,
  Eye,
  EyeOff,
  ExternalLink,
  Headphones,
  Images,
  LayoutGrid,
  Moon,
  Palette,
  PanelBottom,
  Pencil,
  Phone,
  Sparkles,
  Star,
  Tag,
  Type,
} from "lucide-react";
import { BrandMark } from "@/components/site/Brand";
import { ProductArt } from "@/components/site/card-art";
import { featuredDepartments, rootDepartments } from "@/lib/catalog";
import { useSiteContent, type CustomSection, type HomeBlock, type SectionKey } from "@/lib/site-content";
import { cn } from "@/lib/utils";
import { BlockFields, type BlockKey } from "./Blocks";
import { onHashMove, pushHash, readHash, replaceHash, type View } from "./nav";
import { SlidesEditor } from "./Sliders";
import { Badge, BilingualField, Button, Confirm, Drawer, Panel, Select, Switch, num, type IconType } from "./ui";

type Tab = "sections" | "hero" | "texts" | "footer" | "brand" | "look";
type TextBlock = Exclude<BlockKey, "footer">;
type Tone = "accent" | "blue" | "danger" | "warn" | "ok" | "muted";

const TABS: Array<{ id: Tab; label: string; icon: IconType }> = [
  { id: "sections", label: "الأقسام", icon: LayoutGrid },
  { id: "hero", label: "البانر الرئيسي", icon: Images },
  { id: "texts", label: "نصوص الأقسام", icon: Type },
  { id: "footer", label: "الفوتر", icon: PanelBottom },
  { id: "brand", label: "الشعار", icon: BadgeCheck },
  { id: "look", label: "المظهر", icon: Palette },
];

const TONES: Record<Tone, string> = {
  accent: "bg-(--a-accent-soft) text-(--a-accent-ink)",
  blue: "bg-(--a-blue-soft) text-(--a-blue)",
  danger: "bg-(--a-danger-soft) text-(--a-danger)",
  warn: "bg-(--a-warn-soft) text-(--a-warn)",
  ok: "bg-(--a-ok-soft) text-(--a-ok)",
  muted: "bg-(--a-surface-2) text-(--a-muted)",
};

type SectionCard = {
  id: SectionKey | "footer";
  title: string;
  titleEn: string;
  icon: IconType;
  tone: Tone;
  /** The tab (and text block) that edits this section. */
  edit: { tab: Tab; block?: TextBlock };
};

const SECTIONS: SectionCard[] = [
  {
    id: "hero",
    title: "البانر الرئيسي",
    titleEn: "Hero banner",
    icon: Images,
    tone: "accent",
    edit: { tab: "hero" },
  },
  {
    id: "catalog",
    title: "شبكة الأقسام",
    titleEn: "Departments",
    icon: LayoutGrid,
    tone: "blue",
    edit: { tab: "texts", block: "catalog" },
  },
  {
    id: "deals",
    title: "العروض",
    titleEn: "Offers",
    icon: Tag,
    tone: "danger",
    edit: { tab: "texts", block: "deals" },
  },
  {
    id: "bestsellers",
    title: "الأكثر مبيعًا",
    titleEn: "Best sellers",
    icon: Star,
    tone: "warn",
    edit: { tab: "texts", block: "bestsellers" },
  },
  {
    id: "addons",
    title: "الإكسسوارات",
    titleEn: "Accessories",
    icon: Headphones,
    tone: "ok",
    edit: { tab: "texts", block: "addons" },
  },
  {
    id: "setups",
    title: "حلول الأعمال",
    titleEn: "Business solutions",
    icon: Building2,
    tone: "blue",
    edit: { tab: "texts", block: "setups" },
  },
  {
    id: "footer",
    title: "الفوتر",
    titleEn: "Footer",
    icon: PanelBottom,
    tone: "muted",
    edit: { tab: "footer" },
  },
];

const TEXT_BLOCKS: Array<{
  id: TextBlock;
  label: string;
  manage?: { view: View; label: string };
}> = [
  {
    id: "catalog",
    label: "شبكة الأقسام",
    manage: { view: "departments", label: "إدارة الأقسام" },
  },
  {
    id: "deals",
    label: "العروض",
    manage: { view: "offers", label: "اختيار منتجات العروض" },
  },
  {
    id: "bestsellers",
    label: "الأكثر مبيعًا",
    manage: { view: "products", label: "إدارة المنتجات" },
  },
  { id: "addons", label: "الإكسسوارات" },
  { id: "setups", label: "حلول الأعمال" },
];

function readTab(): Tab {
  const sub = readHash().sub;
  return TABS.some((tab) => tab.id === sub) ? (sub as Tab) : "sections";
}

export function ContentHub({ onOpen }: { onOpen: (view: View) => void }) {
  const { content, setSectionHidden, moveSection, addCustomSection, updateCustomSection } = useSiteContent();
  // The open tab lives in the URL (#content/hero), so back and refresh return to it.
  const [tab, setTab] = useState<Tab>(readTab);
  const [block, setBlock] = useState<TextBlock>("catalog");
  // "Add a home section" from the overview's quick actions arrives as #content/add.
  const [choosing, setChoosing] = useState(() => readHash().view === "content" && readHash().sub === "add");
  const [editingCustom, setEditingCustom] = useState<string | null>(null);
  useEffect(() => onHashMove(() => setTab(readTab())), []);

  const open = (next: Tab, nextBlock?: TextBlock) => {
    if (nextBlock) setBlock(nextBlock);
    pushHash("content", next === "sections" ? null : next);
  };

  // Home sections in the order the storefront shows them, custom ones included; the footer stays last.
  const ordered: OrderedCard[] = [
    ...content.homeOrder.flatMap((id): OrderedCard[] => {
      const custom = content.customSections.find((item) => item.id === id);
      if (custom) {
        return [
          {
            id,
            title: custom.ar.title || "قسم بدون عنوان",
            titleEn: custom.en.title || (custom.kind === "banner" ? "Banner" : "Products"),
            icon: custom.kind === "banner" ? Megaphone : ShoppingBag,
            tone: custom.kind === "banner" ? "accent" : "ok",
            on: !custom.hidden,
            note: custom.kind === "banner" ? "إعلان مضاف" : `${num.format(custom.productIds.length)} منتج · مضاف`,
            toggle: (next) => updateCustomSection(id, { hidden: !next }),
            edit: () => setEditingCustom(id),
          },
        ];
      }
      const card = SECTIONS.find((item) => item.id === id);
      if (!card) return [];
      return [
        {
          ...card,
          id,
          on: !content.sectionHidden.includes(id as SectionKey),
          toggle: (next) => setSectionHidden(id as SectionKey, !next),
          edit: () => open(card.edit.tab, card.edit.block),
        },
      ];
    }),
  ];
  const footer = SECTIONS.find((item) => item.id === "footer")!;
  const liveSections = ordered.filter((card) => card.on).length;
  const liveSlides = content.hero.ar.filter((_, index) => !content.heroHidden.includes(index) && !content.heroArchived.includes(index)).length;
  const currentBlock = TEXT_BLOCKS.find((item) => item.id === block) ?? TEXT_BLOCKS[0];

  return (
    <div className="space-y-6">
      <header
        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-(--a-line) p-6 shadow-(--a-shadow)"
        style={{
          backgroundImage: "linear-gradient(135deg, rgb(37 217 230 / 0.10), rgb(100 124 255 / 0.08) 55%, transparent)",
          backgroundColor: "var(--a-surface)",
        }}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">المحتوى والوسائط</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-(--a-blue)/25 bg-(--a-blue-soft) px-3 py-1 text-xs font-medium text-(--a-blue)">
              <Sparkles className="size-3.5" />
              شكل الموقع والصفحة الرئيسية
            </span>
          </div>
          <p className="mt-2 text-sm text-(--a-muted)">أقسام الموقع ونصوصه وشعاره ومظهره، والتعديل يظهر على الموقع مباشرة.</p>
        </div>
        <Link
          href="/ar"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-(--a-line) bg-(--a-surface) px-4 text-sm font-medium shadow-(--a-shadow) hover:bg-(--a-surface-2)"
        >
          <ExternalLink className="size-4" />
          فتح الموقع
        </Link>
      </header>

      <nav aria-label="أقسام المحتوى" className="grid grid-cols-3 gap-1 rounded-2xl border border-(--a-line) bg-(--a-surface) p-1.5 lg:grid-cols-6">
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => open(item.id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm transition",
                active
                  ? "bg-(--a-blue-soft) font-semibold text-(--a-blue)"
                  : "text-(--a-muted) hover:bg-(--a-surface-2) hover:text-(--a-text)",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {tab === "sections" ? (
        <Panel>
          <TabHead
            icon={LayoutGrid}
            title="إدارة أقسام الموقع"
            lead={`تفعيل / إخفاء وترتيب الأقسام · اضغط ✎ للتعديل · ${num.format(liveSections)} ظاهر من ${num.format(ordered.length)}`}
            action={
              <Button variant="primary" icon={Plus} onClick={() => setChoosing(true)}>
                إضافة قسم
              </Button>
            }
          />
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {ordered.map((card, index) => (
              <SectionTile
                key={card.id}
                card={card}
                position={index + 1}
                onUp={index > 0 ? () => moveSection(card.id as HomeBlock, -1) : undefined}
                onDown={index < ordered.length - 1 ? () => moveSection(card.id as HomeBlock, 1) : undefined}
              />
            ))}
            <SectionTile
              card={{
                ...footer,
                on: true,
                fixed: true,
                toggle: () => {},
                edit: () => open("footer"),
              }}
              position={ordered.length + 1}
            />
          </div>
        </Panel>
      ) : null}

      {tab === "hero" ? (
        <Panel>
          <TabHead
            icon={Images}
            title="البانر الرئيسي"
            lead={`أعلى الصفحة الرئيسية · ${num.format(liveSlides)} من ${num.format(content.hero.ar.length)} شرائح مفعّلة`}
            action={<SectionSwitch id="hero" title="البانر الرئيسي" />}
          />
          <div className="p-5">
            <SlidesEditor />
          </div>
        </Panel>
      ) : null}

      {tab === "texts" ? (
        <Panel>
          <TabHead
            icon={Type}
            title="نصوص الأقسام"
            lead="اختر القسم وعدّل عناوينه ووصفه بالعربي والإنجليزي."
            action={<SectionSwitch id={block} title={currentBlock.label} />}
          />
          <div className="space-y-5 p-5">
            <div className="flex flex-wrap gap-2">
              {TEXT_BLOCKS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setBlock(item.id)}
                  aria-pressed={block === item.id}
                  className={cn(
                    "h-9 rounded-full border px-4 text-sm transition",
                    block === item.id
                      ? "border-(--a-blue)/50 bg-(--a-blue-soft) font-semibold text-(--a-blue)"
                      : "border-(--a-line) text-(--a-muted) hover:text-(--a-text)",
                  )}
                >
                  {item.label}
                  {content.sectionHidden.includes(item.id) ? <span className="ms-1.5 text-xs text-(--a-muted)">(مخفي)</span> : null}
                </button>
              ))}
            </div>
            <BlockFields block={block} />
            {currentBlock.manage ? (
              <Button icon={ArrowLeft} onClick={() => onOpen(currentBlock.manage!.view)}>
                {currentBlock.manage.label}
              </Button>
            ) : null}
          </div>
        </Panel>
      ) : null}

      {tab === "footer" ? (
        <Panel>
          <TabHead icon={PanelBottom} title="الفوتر" lead="أسفل كل صفحات الموقع، ويظهر دائمًا." />
          <div className="p-5">
            <BlockFields block="footer" />
          </div>
        </Panel>
      ) : null}

      {tab === "brand" ? <BrandTab /> : null}

      {tab === "look" ? <LookTab onOpen={onOpen} featured={featuredDepartments(content.categoryHidden).length} /> : null}
      <Drawer
        open={choosing}
        onClose={() => {
          setChoosing(false);
          if (readHash().sub === "add") replaceHash("content");
        }}
        title="إضافة قسم للصفحة الرئيسية"
        lead="اختر نوع القسم. يظهر في آخر الصفحة، وتقدر تغيّر مكانه بالأسهم."
      >
        <div className="grid gap-3">
          {(
            [
              ["banner", Megaphone, "إعلان", "عنوان ووصف وزر يودّي لأي صفحة في الموقع، زي العروض أو قسم معيّن."],
              ["products", ShoppingBag, "منتجات مختارة", "مجموعة منتجات تختارها بنفسك تظهر بنفس شكل كروت المنتجات في الموقع."],
            ] as const
          ).map(([kind, Icon, title, lead]) => (
            <button
              key={kind}
              type="button"
              onClick={() => {
                const id = addCustomSection(kind);
                setChoosing(false);
                if (readHash().sub === "add") replaceHash("content");
                setEditingCustom(id);
              }}
              className="flex items-start gap-4 rounded-2xl border border-(--a-line) p-5 text-start transition hover:border-(--a-blue)/50 hover:bg-(--a-blue-soft)"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-(--a-blue-soft) text-(--a-blue)">
                <Icon className="size-6" />
              </span>
              <span>
                <span className="block font-bold">{title}</span>
                <span className="mt-1 block text-sm leading-6 text-(--a-muted)">{lead}</span>
              </span>
            </button>
          ))}
        </div>
      </Drawer>

      <CustomEditor id={editingCustom} onClose={() => setEditingCustom(null)} />
    </div>
  );
}

type OrderedCard = {
  id: HomeBlock | "footer";
  title: string;
  titleEn: string;
  icon: IconType;
  tone: Tone;
  on: boolean;
  fixed?: boolean;
  note?: string;
  toggle: (next: boolean) => void;
  edit: () => void;
};

function SectionTile({ card, position, onUp, onDown }: { card: OrderedCard; position: number; onUp?: () => void; onDown?: () => void }) {
  const Icon = card.icon;
  const on = card.on;
  const small =
    "grid size-8 place-items-center rounded-lg text-(--a-muted) transition hover:bg-(--a-surface-2) hover:text-(--a-text) disabled:pointer-events-none disabled:opacity-30";
  return (
    <article
      className={cn(
        "flex flex-col rounded-2xl border p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-(--a-shadow)",
        on ? "border-(--a-line) bg-(--a-surface) shadow-(--a-shadow)" : "border-dashed border-(--a-line) bg-(--a-surface)",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="relative">
          <span className={cn("grid size-12 place-items-center rounded-2xl transition", on ? TONES.blue : TONES.muted)}>
            <Icon className="size-6" />
          </span>
          <span className="absolute -end-1.5 -top-1.5 grid size-6 place-items-center rounded-full border border-(--a-line) bg-(--a-surface) text-[11px] font-bold tabular-nums">
            {num.format(position)}
          </span>
        </span>
        <div className="flex items-center gap-0.5">
          {card.fixed ? null : (
            <>
              <button type="button" onClick={onUp} disabled={!onUp} aria-label={`تقديم ${card.title}`} title="تقديم" className={small}>
                <ChevronUp className="size-4" />
              </button>
              <button type="button" onClick={onDown} disabled={!onDown} aria-label={`تأخير ${card.title}`} title="تأخير" className={small}>
                <ChevronDown className="size-4" />
              </button>
            </>
          )}
          <button type="button" onClick={card.edit} aria-label={`تعديل ${card.title}`} title={`تعديل ${card.title}`} className={small}>
            <Pencil className="size-3.5" />
          </button>
          <span className={cn("ms-1 size-2.5 rounded-full", on ? "bg-(--a-ok) shadow-[0_0_0_4px_var(--a-ok-soft)]" : "bg-(--a-muted)/50")} aria-hidden="true" />
        </div>
      </div>
      <h3 className="mt-5 line-clamp-1 text-lg font-bold">{card.title}</h3>
      <p className="text-sm text-(--a-muted)" dir="ltr">
        <span className="block truncate text-end">{card.titleEn}</span>
      </p>
      {card.note ? <p className="mt-1 text-xs text-(--a-muted)">{card.note}</p> : null}
      <div className="mt-auto pt-5">
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-(--a-line) bg-(--a-surface) px-4 py-3">
          <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", on ? "text-(--a-ok)" : "text-(--a-muted)")}>
            {on ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            {card.fixed ? "ظاهر دائمًا" : on ? "ظاهر" : "مخفي"}
          </span>
          <Switch checked={on} disabled={card.fixed} label={card.fixed ? "يظهر دائمًا" : `إظهار ${card.title}`} onChange={card.toggle} />
        </label>
      </div>
    </article>
  );
}

/** Edits a section added from the dashboard: its copy, where the button goes, or which products it shows. */
function CustomEditor({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { content, updateCustomSection, updateCustomCopy, removeCustomSection } = useSiteContent();
  const [removing, setRemoving] = useState(false);
  const section = content.customSections.find((item) => item.id === id) ?? null;
  const products = content.products.filter((item) => !item.archived);
  const links: Array<[string, string]> = [
    ["/offers", "صفحة العروض"],
    ["/", "الصفحة الرئيسية"],
    ["/favorites", "المفضلة"],
    ...rootDepartments(content.categoryHidden).map((item): [string, string] => [`/c/${item.slug}`, `قسم ${item.nameAr}`]),
  ];
  const copyField = (field: keyof CustomSection["ar"], label: string, multiline = false) =>
    section ? (
      <BilingualField
        label={label}
        ar={section.ar[field]}
        en={section.en[field]}
        multiline={multiline}
        onAr={(value) => updateCustomCopy(section.id, "ar", { [field]: value })}
        onEn={(value) => updateCustomCopy(section.id, "en", { [field]: value })}
      />
    ) : null;

  return (
    <>
      <Drawer
        open={section !== null}
        onClose={onClose}
        title={section ? (section.kind === "banner" ? "قسم إعلان" : "قسم منتجات مختارة") : ""}
        lead="قسم مضاف من اللوحة. التعديل يتحفظ ويظهر في الصفحة الرئيسية مباشرة."
        footer={
          section ? (
            <>
              <Button variant="danger" icon={Trash2} onClick={() => setRemoving(true)}>
                حذف القسم
              </Button>
              <Button variant="primary" onClick={onClose}>
                تم
              </Button>
            </>
          ) : null
        }
      >
        {section ? (
          <div className="space-y-5">
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-(--a-line) p-4">
              <span className="text-sm">القسم ظاهر في الصفحة الرئيسية</span>
              <Switch checked={!section.hidden} label="إظهار القسم" onChange={(next) => updateCustomSection(section.id, { hidden: !next })} />
            </label>
            {copyField("eyebrow", "السطر الصغير")}
            {copyField("title", "العنوان")}
            {copyField("lead", "الوصف", true)}
            {section.kind === "banner" ? (
              <>
                {copyField("action", "نص الزر")}
                <Select
                  label="الزر يودّي على"
                  value={links.some(([value]) => value === section.link) ? section.link : "/offers"}
                  onChange={(link) => updateCustomSection(section.id, { link })}
                  options={links}
                />
              </>
            ) : (
              <fieldset>
                <legend className="mb-2 text-xs font-medium text-(--a-muted)">
                  المنتجات ({num.format(section.productIds.length)} مختار) · القسم ما يظهر في الموقع لو ما فيه منتجات
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {products.map((item) => {
                    const picked = section.productIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={picked}
                        onClick={() =>
                          updateCustomSection(section.id, {
                            productIds: picked ? section.productIds.filter((value) => value !== item.id) : [...section.productIds, item.id],
                          })
                        }
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-2 text-start text-sm transition",
                          picked ? "border-(--a-blue)/60 bg-(--a-blue-soft)" : "border-(--a-line) hover:bg-(--a-surface-2)",
                          item.hidden && "opacity-60",
                        )}
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-(--a-surface-2)">
                          <ProductArt id={item.id} className="size-8" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-1 font-medium">{item.nameAr}</span>
                          {item.hidden ? <span className="text-xs text-(--a-muted)">مخفي في المتجر</span> : null}
                        </span>
                        <span
                          className={cn(
                            "grid size-5 place-items-center rounded-md border text-[11px]",
                            picked ? "border-transparent bg-(--a-blue) text-white" : "border-(--a-line)",
                          )}
                        >
                          {picked ? "✓" : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}
          </div>
        ) : null}
      </Drawer>
      <Confirm
        open={removing}
        onClose={() => setRemoving(false)}
        onConfirm={() => {
          if (section) removeCustomSection(section.id);
          onClose();
        }}
        title="حذف القسم؟"
        lead="القسم يختفي من الصفحة الرئيسية ويتحذف من اللوحة. لو تبي تخفيه مؤقتًا استخدم زر الإظهار بدل الحذف."
        action="حذف القسم"
      />
    </>
  );
}

/** Store name, tagline and logo used in the storefront header and footer. */
function BrandTab() {
  const { content, updateBrand } = useSiteContent();
  const { brand } = content;
  const [error, setError] = useState("");

  function upload(file: File | undefined) {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("اختر ملف صورة (PNG أو JPG أو SVG أو WebP).");
      return;
    }
    // Shrink to at most 256px so the logo stays small enough to save in the browser.
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, 256 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
        updateBrand({ logo: canvas.toDataURL("image/png") });
      };
      image.onerror = () => setError("ما قدرنا نقرأ الصورة. جرّب ملف ثاني.");
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <Panel>
      <TabHead icon={BadgeCheck} title="الشعار واسم المتجر" lead="يظهر في أعلى الموقع وفي الفوتر بالعربي والإنجليزي." />
      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <BilingualField
            label="اسم المتجر"
            ar={brand.name.ar}
            en={brand.name.en}
            onAr={(ar) => updateBrand({ name: { ar } })}
            onEn={(en) => updateBrand({ name: { en } })}
          />
          <BilingualField
            label="السطر تحت الاسم (اختياري)"
            ar={brand.tagline.ar}
            en={brand.tagline.en}
            onAr={(ar) => updateBrand({ tagline: { ar } })}
            onEn={(en) => updateBrand({ tagline: { en } })}
          />
          <div className="rounded-xl border border-dashed border-(--a-line) p-4">
            <p className="text-sm font-medium">صورة الشعار</p>
            <p className="mt-1 text-xs leading-6 text-(--a-muted)">بدون صورة يظهر شعار المتجر الأساسي. صورة مربعة أفضل، تتصغّر تلقائيًا وتتحفظ في هذا المتصفح لحد ربط قاعدة البيانات.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-(--a-accent) px-4 text-sm font-medium text-[#0b1220] hover:brightness-110">
                <Upload className="size-4" />
                {brand.logo ? "تغيير الصورة" : "رفع صورة"}
                <input type="file" accept="image/*" className="sr-only" onChange={(event) => upload(event.target.files?.[0])} />
              </label>
              {brand.logo ? (
                <Button icon={Trash2} onClick={() => updateBrand({ logo: "" })}>
                  إزالة الصورة
                </Button>
              ) : null}
            </div>
            {error ? <p className="mt-2 text-sm text-(--a-danger)">{error}</p> : null}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium text-(--a-muted)">معاينة</p>
          {(["ar", "en"] as const).map((lang) => (
            <div
              key={lang}
              dir={lang === "ar" ? "rtl" : "ltr"}
              className="flex items-center gap-3 rounded-2xl border border-(--a-line) bg-[#0b1220] p-4 text-white"
            >
              <BrandMark />
              <span className="min-w-0 leading-tight">
                <span className="block truncate font-semibold">{brand.name[lang]}</span>
                {brand.tagline[lang] ? <span className="block truncate text-xs text-white/70">{brand.tagline[lang]}</span> : null}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function TabHead({ icon: Icon, title, lead, action }: { icon: IconType; title: string; lead: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--a-line) px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-(--a-blue-soft) text-(--a-blue)">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-bold">{title}</h2>
          <p className="mt-0.5 text-xs text-(--a-muted)">{lead}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

/** Show/hide switch for one home section, used in the edit tabs' headers. */
function SectionSwitch({ id, title }: { id: SectionKey; title: string }) {
  const { content, setSectionHidden } = useSiteContent();
  const on = !content.sectionHidden.includes(id);
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-(--a-line) px-3 py-2">
      <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", on ? "text-(--a-ok)" : "text-(--a-muted)")}>
        {on ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        {on ? "ظاهر في الموقع" : "مخفي من الموقع"}
      </span>
      <Switch checked={on} label={`إظهار ${title}`} onChange={(next) => setSectionHidden(id, !next)} />
    </label>
  );
}

function LookTab({ onOpen, featured }: { onOpen: (view: View) => void; featured: number }) {
  const { theme, setTheme } = useTheme();
  return (
    <Panel>
      <TabHead icon={Palette} title="مظهر الموقع" lead="ألوان الموقع وأقسامه الظاهرة في الصفحة الرئيسية." />
      <div className="grid gap-4 p-5 md:grid-cols-3">
        <LookCard icon={Moon} title="الوضع الفاتح للموقع" lead="يغيّر ألوان واجهة الموقع على هذا الجهاز. الوضع الداكن هو الأساسي.">
          <Switch checked={theme === "light"} label="الوضع الفاتح للموقع" onChange={(next) => setTheme(next ? "light" : "dark")} />
        </LookCard>
        <LookCard icon={LayoutGrid} title="أقسام الصفحة الرئيسية" lead={`${num.format(featured)} قسم ظاهر في شبكة الأقسام. التحكم فيها من صفحة الأقسام.`}>
          <Button onClick={() => onOpen("departments")} className="h-9 px-3">
            فتح
          </Button>
        </LookCard>
        <LookCard icon={Phone} title="بيانات التواصل" lead="الجوال والواتساب والبريد في الموقع. تتفعّل مع قاعدة البيانات.">
          <Badge tone="blue">قريبًا</Badge>
        </LookCard>
      </div>
    </Panel>
  );
}

function LookCard({ icon: Icon, title, lead, children }: { icon: IconType; title: string; lead: string; children: React.ReactNode }) {
  return (
    <article className="flex flex-col rounded-2xl border border-(--a-line) p-5 transition hover:shadow-(--a-shadow)">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-(--a-surface-2) text-(--a-muted)">
          <Icon className="size-5" />
        </span>
        {children}
      </div>
      <h3 className="mt-4 font-bold">{title}</h3>
      <p className="mt-1 text-[13px] leading-6 text-(--a-muted)">{lead}</p>
    </article>
  );
}
