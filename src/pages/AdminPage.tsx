import { useState, type ComponentType } from "react";
import { Link } from "wouter";
import {
  ExternalLink,
  Building2,
  Headphones,
  Image,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Package,
  PanelBottom,
  Pencil,
  RotateCcw,
  Star,
  Tag,
  Type,
} from "lucide-react";
import { ADMIN_USER, loginAdmin, logoutAdmin, isAdmin } from "@/lib/admin-auth";
import { CATALOG, featuredDepartments } from "@/lib/catalog";
import type { Lang } from "@/lib/i18n";
import { useSiteContent, type SiteContent } from "@/lib/site-content";

type Tab = "overview" | "products" | "hero" | "deals" | "bestsellers" | "addons" | "setups" | "catalog" | "footer";

const NAV: Array<{ id: Tab; label: string; icon: ComponentType<{ className?: string }> }> = [
  { id: "overview", label: "لوحة التحكم", icon: LayoutDashboard },
  { id: "hero", label: "البانر الرئيسي", icon: Image },
  { id: "catalog", label: "الأقسام", icon: LayoutGrid },
  { id: "deals", label: "العروض", icon: Tag },
  { id: "bestsellers", label: "الأكثر مبيعًا", icon: Star },
  { id: "addons", label: "الإكسسوارات", icon: Headphones },
  { id: "setups", label: "حلول الأعمال", icon: Building2 },
  { id: "products", label: "المنتجات", icon: Package },
  { id: "footer", label: "الفوتر", icon: PanelBottom },
];

export function AdminPage() {
  const [authed, setAuthed] = useState(isAdmin);

  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;
  return <Dashboard onLogout={() => setAuthed(false)} />;
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (loginAdmin(username, password)) {
      onSuccess();
      return;
    }
    setError(true);
  }

  return (
    <div dir="rtl" className="grid min-h-svh place-items-center bg-[#eef3f1] px-4 text-navy">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-navy/10 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-emerald">سوق الالكترونيات</p>
        <h1 className="mt-2 text-2xl font-bold">لوحة التحكم</h1>
        <p className="mt-2 text-sm leading-7 text-navy/60">ادخل بحساب الإدارة عشان تعدّل محتوى الصفحة الرئيسية.</p>
        <label className="mt-6 block text-sm font-medium">
          اسم المستخدم
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            className="mt-2 h-11 w-full rounded-xl border border-navy/15 px-3 text-sm outline-none focus:border-emerald"
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          كلمة السر
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="mt-2 h-11 w-full rounded-xl border border-navy/15 px-3 text-sm outline-none focus:border-emerald"
          />
        </label>
        {error ? <p className="mt-3 text-sm text-burgundy">اسم المستخدم أو كلمة السر غير صحيحة.</p> : null}
        <button type="submit" className="mt-6 h-11 w-full rounded-full bg-emerald text-sm font-medium text-white">
          دخول
        </button>
      </form>
    </div>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const { content, reset } = useSiteContent();
  const [tab, setTab] = useState<Tab>("overview");
  const current = NAV.find((item) => item.id === tab) ?? NAV[0];

  function signOut() {
    logoutAdmin();
    onLogout();
  }

  function restore() {
    if (window.confirm("نرجّع كل النصوص والأسعار للنسخة الأصلية؟")) reset();
  }

  return (
    <div dir="rtl" className="min-h-svh bg-[#eef3f1] text-navy lg:flex">
      <aside className="flex w-full flex-col bg-[#084233] text-white lg:sticky lg:top-0 lg:h-svh lg:w-60 lg:shrink-0">
        <div className="flex items-center gap-2.5 px-4 py-4">
          <span className="grid size-9 place-items-center rounded-xl bg-white/15 text-base font-semibold">س</span>
          <span>
            <span className="block text-sm font-semibold">سوق الالكترونيات</span>
            <span className="block text-xs text-white/70">إدارة محتوى الموقع</span>
          </span>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-start text-[13px] ${
                  active ? "bg-[#e7f3c4] font-medium text-navy" : "text-white/85 hover:bg-white/10"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="space-y-1 p-2.5">
          <button
            type="button"
            onClick={restore}
            className="flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-[13px] text-white/80 hover:bg-white/10"
          >
            <RotateCcw className="size-4" />
            إرجاع الأصل
          </button>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-black/15 px-3 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">سوق الالكترونيات</p>
              <p className="truncate text-xs text-white/65">{ADMIN_USER}</p>
            </div>
            <button type="button" onClick={signOut} aria-label="خروج" className="grid size-9 place-items-center rounded-full bg-white/10">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <p className="text-sm text-navy/70">{current.label}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-9 items-center rounded-full bg-white px-3 text-sm shadow-sm">Admin سوق الالكترونيات</span>
            <Link
              href="/ar"
              className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-3 text-sm shadow-sm"
            >
              <ExternalLink className="size-3.5" />
              معاينة الموقع
            </Link>
          </div>
        </header>

        <main className="px-4 pb-10 sm:px-6">
          {tab === "overview" ? <Overview content={content} onOpen={setTab} /> : null}
          {tab !== "overview" ? (
            <button type="button" onClick={() => setTab("overview")} className="mb-4 text-sm font-medium text-emerald">
              رجوع إلى لوحة التحكم
            </button>
          ) : null}
          {tab === "products" ? <ProductsEditor /> : null}
          {tab === "hero" ? <HeroEditor /> : null}
          {tab === "catalog" ? <CatalogManager /> : null}
          {tab === "deals" ? (
            <BlockEditor
              block="deals"
              title="بانر العروض"
              fields={["eyebrow", "title", "highlight", "lead"]}
              labels={{ eyebrow: "السطر الصغير", title: "العنوان", highlight: "جملة الخصم", lead: "الوصف" }}
            />
          ) : null}
          {tab === "bestsellers" ? (
            <BlockEditor
              block="bestsellers"
              title="الأكثر مبيعًا"
              fields={["eyebrow", "title", "lead", "bannerTitle", "bannerLead"]}
              labels={{
                eyebrow: "السطر الصغير",
                title: "العنوان",
                lead: "الوصف",
                bannerTitle: "عنوان شريط التجهيز",
                bannerLead: "وصف شريط التجهيز",
              }}
            />
          ) : null}
          {tab === "addons" ? (
            <BlockEditor
              block="addons"
              title="الإكسسوارات"
              fields={["eyebrow", "title", "lead", "ready"]}
              labels={{ eyebrow: "السطر الصغير", title: "العنوان", lead: "الوصف", ready: "سطر الجاهزية" }}
            />
          ) : null}
          {tab === "setups" ? (
            <BlockEditor
              block="setups"
              title="حلول الأعمال"
              fields={["eyebrow", "title", "lead", "action"]}
              labels={{ eyebrow: "السطر الصغير", title: "العنوان", lead: "الوصف", action: "نص الزر" }}
            />
          ) : null}
          {tab === "footer" ? (
            <BlockEditor
              block="footer"
              title="الفوتر"
              fields={["about", "shipping", "warranty"]}
              labels={{ about: "نبذة المتجر", shipping: "سطر الشحن", warranty: "سطر الضمان" }}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}

function Overview({ content, onOpen }: { content: SiteContent; onOpen: (tab: Tab) => void }) {
  const visibleDepartments = featuredDepartments(content.categoryHidden).length;
  const homeOffers = content.products.filter((item) => item.onHome && !item.hidden).length;
  const cards: Array<{ id: Tab; title: string; where: string; hint: string; icon: ComponentType<{ className?: string }> }> = [
    { id: "hero", title: "البانر الرئيسي", where: "الصفحة الرئيسية", hint: content.hero.ar[0]?.title ?? "", icon: Image },
    {
      id: "catalog",
      title: "الأقسام",
      where: "الصفحة الرئيسية والقائمة",
      hint: `${visibleDepartments} قسم مهم ظاهر من ${CATALOG.length} تصنيف`,
      icon: LayoutGrid,
    },
    { id: "deals", title: "العروض", where: "الصفحة الرئيسية وصفحة العروض", hint: content.deals.ar.title, icon: Tag },
    { id: "bestsellers", title: "الأكثر مبيعًا", where: "الصفحة الرئيسية", hint: content.bestsellers.ar.title, icon: Star },
    { id: "addons", title: "الإكسسوارات", where: "الصفحة الرئيسية", hint: content.addons.ar.title, icon: Headphones },
    { id: "setups", title: "حلول الأعمال", where: "الصفحة الرئيسية", hint: content.setups.ar.title, icon: Building2 },
    {
      id: "products",
      title: "المنتجات",
      where: "العروض والأكثر مبيعًا والإكسسوارات",
      hint: `${homeOffers} منتج ظاهر في عروض الرئيسية`,
      icon: Package,
    },
    { id: "footer", title: "الفوتر", where: "كل صفحات الموقع", hint: content.footer.ar.shipping, icon: PanelBottom },
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] bg-white px-6 py-8 shadow-sm sm:px-8">
        <h1 className="text-2xl font-bold">لوحة التحكم</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-navy/60">
          من هنا تعدّل نصوص الصفحة الرئيسية، وأسعار المنتجات، والأقسام الظاهرة على الموقع. التعديل يتحفظ في هذا المتصفح ويظهر على الموقع فورًا.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-bold">دليل محتوى الصفحات</h2>
        <p className="mt-1 text-sm text-navy/55">اختار القسم لتعدّل البيانات الظاهرة على الموقع.</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.id} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold">{card.title}</h3>
                    <p className="mt-1 text-sm text-navy/50">{card.where}</p>
                  </div>
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eef6f2] text-emerald">
                    <Icon className="size-5" />
                  </span>
                </div>
                <p className="mt-3 line-clamp-1 text-sm text-navy/70">{card.hint}</p>
                <button
                  type="button"
                  onClick={() => onOpen(card.id)}
                  className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#f3f6f4] text-sm font-medium text-emerald"
                >
                  <Pencil className="size-3.5" />
                  تعديل
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CatalogManager() {
  const { content, updateBlock, setCategoryHidden } = useSiteContent();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"home" | "all" | "inactive">("home");
  const needle = query.trim().toLowerCase();
  const rows = CATALOG.filter((item) => {
    if (filter === "home" && !(item.featured && item.active && item.level === 1)) return false;
    if (filter === "inactive" && item.active) return false;
    if (
      needle &&
      !item.nameAr.toLowerCase().includes(needle) &&
      !item.nameEn.toLowerCase().includes(needle) &&
      !item.slug.includes(needle)
    ) {
      return false;
    }
    return true;
  });

  return (
    <section className="space-y-4">
      <EditorIntro
        title="الأقسام"
        badge={`${CATALOG.length} تصنيف`}
        summary="عناوين قسم الأقسام بالعربي والإنجليزي، وإظهار الأقسام أو إخفاؤها من الموقع."
      />
      <EditorCard heading="عناوين القسم" note="العنوان والوصف يظهران فوق شبكة الأقسام في الصفحة الرئيسية.">
        <BilingualField
          label="العنوان"
          ar={content.catalog.ar.title}
          en={content.catalog.en.title}
          onAr={(value) => updateBlock("catalog", "ar", { title: value })}
          onEn={(value) => updateBlock("catalog", "en", { title: value })}
        />
        <BilingualField
          label="الوصف"
          ar={content.catalog.ar.subtitle}
          en={content.catalog.en.subtitle}
          onAr={(value) => updateBlock("catalog", "ar", { subtitle: value })}
          onEn={(value) => updateBlock("catalog", "en", { subtitle: value })}
          multiline
        />
      </EditorCard>
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["home", "الرئيسية"],
            ["all", "كل التصنيفات"],
            ["inactive", "غير نشط"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`h-9 rounded-full px-4 text-sm ${filter === id ? "bg-navy text-white" : "border border-navy/10 bg-white"}`}
          >
            {label}
          </button>
        ))}
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ابحث باسم القسم"
          className="h-9 min-w-48 flex-1 rounded-full border border-navy/15 bg-white px-4 text-sm outline-none focus:border-emerald"
        />
      </div>
      <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
        {rows.map((item) => {
          const hidden = content.categoryHidden.includes(item.id);
          return (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-navy/5 px-4 py-3 last:border-0">
              <div className="min-w-0">
                <p className="font-medium">{item.nameAr}</p>
                <p className="text-xs text-navy/45" dir="ltr">
                  {item.nameEn}
                </p>
                <p className="text-xs text-navy/45">
                  مستوى {item.level} · {item.slug} · {item.active ? "نشط" : "غير نشط"}
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!hidden && item.active}
                  disabled={!item.active}
                  onChange={(event) => setCategoryHidden(item.id, !event.target.checked)}
                />
                ظاهر في الموقع
              </label>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ProductsEditor() {
  const { content, updateProduct } = useSiteContent();

  return (
    <section className="space-y-4">
      <EditorIntro
        title="المنتجات"
        badge={`${content.products.length} منتج`}
        summary="الاسم والقسم بالعربي والإنجليزي معًا. السعر واحد ويظهر في العروض والأكثر مبيعًا والإكسسوارات."
      />
      {content.products.map((product) => (
        <EditorCard
          key={product.id}
          heading={product.nameAr}
          note="الاسم والقسم"
          extra={
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={product.onHome}
                  onChange={(event) => updateProduct(product.id, { onHome: event.target.checked })}
                />
                في عروض الرئيسية
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={product.hidden}
                  onChange={(event) => updateProduct(product.id, { hidden: event.target.checked })}
                />
                مخفي
              </label>
            </div>
          }
        >
          <BilingualField
            label="الاسم"
            ar={product.nameAr}
            en={product.nameEn}
            onAr={(value) => updateProduct(product.id, { nameAr: value })}
            onEn={(value) => updateProduct(product.id, { nameEn: value })}
          />
          <BilingualField
            label="القسم"
            ar={product.categoryAr}
            en={product.categoryEn}
            onAr={(value) => updateProduct(product.id, { categoryAr: value })}
            onEn={(value) => updateProduct(product.id, { categoryEn: value })}
          />
          <div className="grid gap-4 py-5 sm:grid-cols-2">
            <Field
              label="السعر"
              type="number"
              value={String(product.price)}
              onChange={(value) => {
                const next = Number(value);
                if (Number.isFinite(next) && next >= 0) updateProduct(product.id, { price: next });
              }}
            />
            <Field
              label="السعر قبل الخصم"
              type="number"
              value={String(product.compareAt)}
              onChange={(value) => {
                const next = Number(value);
                if (Number.isFinite(next) && next >= 0) updateProduct(product.id, { compareAt: next });
              }}
            />
          </div>
        </EditorCard>
      ))}
    </section>
  );
}

function HeroEditor() {
  const { content, updateHero } = useSiteContent();

  const slides = content.hero.ar;

  return (
    <section className="space-y-4">
      <EditorIntro
        title="البانر الرئيسي"
        badge={`${slides.length} شرائح`}
        summary="كل شريحة بالعربي والإنجليزي جنب بعض. النص يظهر في البانر أعلى الصفحة الرئيسية."
      />
      {slides.map((slide, index) => {
        const english = content.hero.en[index];
        if (!english) return null;
        return (
          <EditorCard key={index} heading={`الشريحة ${index + 1}`} note="العنوان والوصف">
            <BilingualField
              label="العنوان"
              ar={slide.title}
              en={english.title}
              onAr={(value) => updateHero("ar", index, { title: value })}
              onEn={(value) => updateHero("en", index, { title: value })}
            />
            <BilingualField
              label="تكملة العنوان"
              ar={slide.titleRest}
              en={english.titleRest}
              onAr={(value) => updateHero("ar", index, { titleRest: value })}
              onEn={(value) => updateHero("en", index, { titleRest: value })}
            />
            <BilingualField
              label="الوصف"
              ar={slide.lead}
              en={english.lead}
              onAr={(value) => updateHero("ar", index, { lead: value })}
              onEn={(value) => updateHero("en", index, { lead: value })}
              multiline
            />
          </EditorCard>
        );
      })}
    </section>
  );
}

function BlockEditor<K extends "catalog" | "deals" | "bestsellers" | "addons" | "setups" | "footer">({
  block,
  title,
  fields,
  labels,
}: {
  block: K;
  title: string;
  fields: Array<keyof SiteContent[K]["ar"] & string>;
  labels: Record<string, string>;
}) {
  const { content, updateBlock } = useSiteContent();

  const arabic = content[block].ar as Record<string, string>;
  const english = content[block].en as Record<string, string>;

  return (
    <section className="space-y-4">
      <EditorIntro title={title} badge="عربي وإنجليزي" summary="كل خانة فيها النص العربي والإنجليزي جنب بعض، والتعديل يظهر على الموقع." />
      <EditorCard heading="نصوص القسم" note="العربي على اليمين والإنجليزي على الشمال.">
        {fields.map((field) => {
          const ar = arabic[field] ?? "";
          const en = english[field] ?? "";
          return (
            <BilingualField
              key={field}
              label={labels[field] ?? field}
              ar={ar}
              en={en}
              multiline={ar.length > 40 || en.length > 40}
              onAr={(value) => updateBlock(block, "ar", { [field]: value } as Partial<SiteContent[K][Lang]>)}
              onEn={(value) => updateBlock(block, "en", { [field]: value } as Partial<SiteContent[K][Lang]>)}
            />
          );
        })}
      </EditorCard>
    </section>
  );
}

function EditorIntro({ title, badge, summary }: { title: string; badge: string; summary: string }) {
  return (
    <div className="rounded-[28px] bg-white px-6 py-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{title}</h1>
        <span className="rounded-full bg-[#eef6f2] px-3 py-1 text-xs font-medium text-emerald">{badge}</span>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-navy/55">{summary}</p>
    </div>
  );
}

function EditorCard({
  heading,
  note,
  extra,
  children,
}: {
  heading: string;
  note?: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-[28px] bg-white px-5 shadow-sm sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy/5 py-4">
        <div className="min-w-0">
          <h2 className="font-semibold">{heading}</h2>
          {note ? <p className="mt-1 text-xs text-navy/45">{note}</p> : null}
        </div>
        <div className="flex items-center gap-3">
          {extra}
          <span className="grid size-9 place-items-center rounded-xl bg-[#eef6f2] text-emerald">
            <Type className="size-4" />
          </span>
        </div>
      </div>
      {children}
    </article>
  );
}

function BilingualField({
  label,
  ar,
  en,
  onAr,
  onEn,
  multiline = false,
}: {
  label: string;
  ar: string;
  en: string;
  onAr: (value: string) => void;
  onEn: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="border-b border-navy/5 py-5 last:border-0">
      <p className="text-sm font-semibold">{label}</p>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <LangBox lang="ar" label={label} value={ar} onChange={onAr} multiline={multiline} />
        <LangBox lang="en" label={label} value={en} onChange={onEn} multiline={multiline} />
      </div>
    </div>
  );
}

function LangBox({
  lang,
  label,
  value,
  onChange,
  multiline,
}: {
  lang: Lang;
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline: boolean;
}) {
  const english = lang === "en";
  const control = "w-full rounded-xl border border-navy/10 bg-white px-3 text-sm font-normal outline-none focus:border-emerald";

  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-medium">
        <span className={english ? "font-semibold text-gold" : "rounded-full bg-emerald/10 px-2 py-0.5 text-emerald"}>
          {english ? "EN" : "عربي"}
        </span>
        <span className="text-navy/60">{label}</span>
      </span>
      {multiline ? (
        <textarea
          dir={english ? "ltr" : "rtl"}
          value={value}
          rows={3}
          onChange={(event) => onChange(event.target.value)}
          className={`${control} py-2 ${english ? "text-left" : ""}`}
        />
      ) : (
        <input
          dir={english ? "ltr" : "rtl"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${control} h-11 ${english ? "text-left" : ""}`}
        />
      )}
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  multiline?: boolean;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className="mt-2 w-full rounded-xl border border-navy/15 px-3 py-2 text-sm font-normal outline-none focus:border-emerald"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-2 h-11 w-full rounded-xl border border-navy/15 px-3 text-sm font-normal outline-none focus:border-emerald"
        />
      )}
    </label>
  );
}
