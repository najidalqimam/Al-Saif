import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Archive, ArchiveRestore, ArrowRight, ChevronLeft, ExternalLink, FolderSearch, PackageSearch, Pencil, Plus } from "lucide-react";
import { allCategories, categoryById, categoryTrail, rootDepartments, type CatalogCategory } from "@/lib/catalog";
import { apiMessage } from "@/lib/api";
import { useSiteContent, type NewCategory } from "@/lib/site-content";
import { publicUrl } from "@/lib/utils";
import { ProductArt } from "@/components/site/card-art";
import { productInCategory } from "@/lib/product-categories";
import { onHashMove, pushHash, readHash, replaceHash } from "./nav";
import { ToggleRow } from "./Products";
import { Badge, BilingualField, Button, Confirm, DemoNote, Drawer, Empty, Field, IconButton, PageHead, Panel, SearchBox, Select, Switch, Tabs, num, sar } from "./ui";

type Filter = "main" | "hidden" | "archived";

/** Depth-first in storefront order: each department followed by its own subcategories. */
function inTreeOrder(list: CatalogCategory[]) {
  const under = (parentId: string | null): CatalogCategory[] =>
    list
      .filter((item) => item.parentId === parentId)
      .sort((a, b) => a.sort - b.sort)
      .flatMap((item) => [item, ...under(item.id)]);
  return under(null);
}

export function Departments() {
  const { content, setCategoryHidden, setCategoryArchived, updateAddedCategory, updateProduct } = useSiteContent();
  // The store works in two levels: main departments, then subcategories that hold the products.
  // Deeper categories from the original tree stay in the data, and their products count toward the subcategory above.
  const catalog = inTreeOrder(allCategories()).filter((item) => item.level <= 2);
  const isAdded = (id: string) => content.addedCategories.some((item) => item.id === id);
  const [filter, setFilter] = useState<Filter>("main");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  // "Add department" from the overview's quick actions arrives as #departments/add.
  const [adding, setAdding] = useState(() => readHash().view === "departments" && readHash().sub === "add");
  const [archiving, setArchiving] = useState<CatalogCategory | null>(null);
  // The department being browsed lives in the URL (#departments/<id>), so back returns to the level above.
  const [openId, setOpenIdState] = useState<string | null>(() => (readHash().sub === "add" ? null : readHash().sub));
  useEffect(() => onHashMove(() => setOpenIdState(readHash().sub)), []);
  const setOpenId = (id: string | null) => pushHash("departments", id);

  const archived = content.categoryArchived;
  const hiddenOnly = (item: CatalogCategory) => content.categoryHidden.includes(item.id) && !archived.includes(item.id);
  const counts = {
    main: catalog.filter((item) => item.level === 1 && !archived.includes(item.id)).length,
    hidden: catalog.filter((item) => hiddenOnly(item) || !item.active).length,
    archived: archived.length,
  };
  const editing = editingId ? categoryById(editingId) : null;
  const opened = openId ? categoryById(openId) : null;
  const childrenOf = (id: string) => catalog.filter((item) => item.parentId === id && !archived.includes(item.id));
  const productsOf = (id: string) => content.products.filter((item) => !item.archived && productInCategory(item, id));
  // A subcategory opens onto its products instead of another level of categories.
  const showingProducts = opened !== null && opened.level >= 2;
  const needle = query.trim().toLowerCase();
  const productRows = showingProducts ? productsOf(opened.id).filter((item) => !needle || [item.nameAr, item.nameEn].some((text) => text.toLowerCase().includes(needle))) : [];
  const rows = catalog.filter((item) => {
    const gone = archived.includes(item.id);
    if (opened) {
      if (gone || item.parentId !== opened.id) return false;
    } else {
      if (filter === "archived" ? !gone : gone) return false;
      // Searching the main list also finds subcategories.
      if (filter === "main" && item.level !== 1 && !needle) return false;
    }
    if (!opened && filter === "hidden" && !(hiddenOnly(item) || !item.active)) return false;
    if (needle && ![item.nameAr, item.nameEn, item.slug].some((text) => text.toLowerCase().includes(needle))) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHead
        title="الأقسام"
        lead="نفس أقسام الموقع وترتيبها: قسم رئيسي، ثم أقسام فرعية، ثم المنتجات."
        actions={
          showingProducts ? (
            <Button variant="primary" icon={Plus} onClick={() => pushHash("products", `${opened.id}/add`)}>
              إضافة منتج
            </Button>
          ) : (
            <Button variant="primary" icon={Plus} onClick={() => setAdding(true)}>
              {opened ? "إضافة قسم فرعي" : "إضافة قسم"}
            </Button>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        {opened ? (
          <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-xl border border-(--a-line) bg-(--a-surface) p-1 pe-3">
            <Button
              icon={ArrowRight}
              onClick={() => {
                setOpenId(opened.parentId);
                setQuery("");
              }}
              className="h-8 border-transparent px-3"
            >
              رجوع
            </Button>
            <nav aria-label="مسار القسم" className="flex flex-wrap items-center gap-1 text-sm">
              <button type="button" onClick={() => setOpenId(null)} className="text-(--a-muted) hover:text-(--a-text)">
                الأقسام
              </button>
              {categoryTrail(opened.id).map((step) => (
                <span key={step.id} className="flex items-center gap-1">
                  <ChevronLeft className="size-3.5 text-(--a-muted)" />
                  {step.id === opened.id ? (
                    <span className="font-semibold">{step.nameAr}</span>
                  ) : (
                    <button type="button" onClick={() => setOpenId(step.id)} className="text-(--a-muted) hover:text-(--a-text)">
                      {step.nameAr}
                    </button>
                  )}
                </span>
              ))}
            </nav>
          </div>
        ) : (
          <Tabs
            value={filter}
            onChange={setFilter}
            items={[
              ["main", "الأقسام", counts.main],
              ["hidden", "موقوف", counts.hidden],
              ["archived", "الأرشيف", counts.archived],
            ]}
          />
        )}
        <SearchBox value={query} onChange={setQuery} placeholder={opened ? `ابحث داخل ${opened.nameAr}` : "ابحث باسم القسم"} />
      </div>

      <Panel>
        {showingProducts ? (
          productRows.length ? (
            <ul className="divide-y divide-(--a-line)">
              {productRows.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center gap-4 px-5 py-2.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--a-surface-2)">
                    <ProductArt id={item.id} className="size-8" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5">
                      <span className="line-clamp-1 font-medium">{item.nameAr}</span>
                      {item.source === "demo" ? <Badge tone="blue">تجريبي</Badge> : item.source === "added" ? <Badge tone="blue">مضاف</Badge> : null}
                    </p>
                    <p className="mt-0.5 text-xs text-(--a-muted)">{item.categoryAr}</p>
                  </div>
                  <div className="text-end">
                    <p className="font-semibold tabular-nums">{sar.format(item.price)}</p>
                    {item.compareAt > item.price ? <s className="text-xs text-(--a-muted) tabular-nums">{sar.format(item.compareAt)}</s> : null}
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch size="sm" checked={!item.hidden} label={`إظهار ${item.nameAr}`} onChange={(next) => updateProduct(item.id, { hidden: !next })} />
                    <span className="w-2" />
                    <IconButton icon={Pencil} label={`تعديل ${item.nameAr}`} onClick={() => pushHash("products", `${opened.id}/edit-${item.id}`)} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty
              icon={PackageSearch}
              title="ما فيه منتجات هنا"
              lead={needle ? "جرّب كلمة بحث ثانية." : "هذا القسم الفرعي ما فيه منتجات لسه. أضف منتج من زر إضافة منتج."}
            />
          )
        ) : rows.length ? (
          <ul className="divide-y divide-(--a-line)">
            {rows.map((item) => {
              const gone = archived.includes(item.id);
              const visible = item.active && !content.categoryHidden.includes(item.id);
              const parent = item.parentId ? categoryById(item.parentId) : null;
              const subs = gone ? 0 : childrenOf(item.id).length;
              // Main departments open onto their subcategories, subcategories onto their products.
              const opens = !gone && (item.level >= 2 || subs > 0);
              const details = (
                <>
                  <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-(--a-surface-2)">
                    {item.image ? <img src={publicUrl(item.image)} alt="" className="size-8 object-contain" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{item.nameAr}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-(--a-muted)">
                      <span dir="ltr">{item.nameEn}</span>
                      <span>·</span>
                      <span>
                        {item.level >= 2
                          ? `${num.format(productsOf(item.id).length)} منتج${parent && !opened ? ` · داخل ${parent.nameAr}` : ""}`
                          : subs
                            ? `${num.format(subs)} أقسام فرعية`
                            : "قسم رئيسي"}
                      </span>
                    </span>
                  </span>
                  {opens ? <ChevronLeft className="size-4 shrink-0 text-(--a-muted) transition group-hover:text-(--a-accent-ink)" /> : null}
                </>
              );
              return (
                <li key={item.id} className="flex flex-wrap items-center gap-4 px-5 py-2.5">
                  {opens ? (
                    <button
                      type="button"
                      onClick={() => {
                        setOpenId(item.id);
                        setQuery("");
                      }}
                      aria-label={item.level >= 2 ? `فتح منتجات ${item.nameAr}` : `فتح الأقسام الفرعية في ${item.nameAr}`}
                      className="group -my-2 -ms-2 flex min-w-0 flex-1 items-center gap-4 rounded-xl py-2 ps-2 text-start transition hover:bg-(--a-surface-2)/60"
                    >
                      {details}
                    </button>
                  ) : (
                    <div className="flex min-w-0 flex-1 items-center gap-4">{details}</div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Badge>مستوى {num.format(item.level)}</Badge>
                    {!item.active ? <Badge tone="warn">غير نشط</Badge> : null}
                    {isAdded(item.id) ? <Badge tone="blue">مضاف من اللوحة</Badge> : null}
                  </div>
                  <div className="flex items-center gap-1">
                    {gone ? (
                      <Button icon={ArchiveRestore} onClick={() => setCategoryArchived(item.id, false)}>
                        استرجاع
                      </Button>
                    ) : (
                      <>
                        <Switch size="sm" checked={visible} disabled={!item.active} label={`إظهار قسم ${item.nameAr}`} onChange={(next) => setCategoryHidden(item.id, !next)} />
                        <span className="w-2" />
                        <IconButton icon={Pencil} label={`تعديل ${item.nameAr}`} onClick={() => setEditingId(item.id)} />
                        <IconButton icon={Archive} label={`حذف ${item.nameAr}`} tone="danger" onClick={() => setArchiving(item)} />
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty icon={FolderSearch} title="ما فيه أقسام هنا" lead={opened && !needle ? "ما فيه أقسام فرعية داخل هذا القسم. تقدر تضيف واحد من زر إضافة قسم فرعي." : filter === "archived" && !opened ? "الأقسام المحذوفة تنتقل للأرشيف وتقدر تسترجعها." : "جرّب كلمة بحث ثانية أو غيّر الفلتر."} />
        )}
      </Panel>

      <Drawer
        open={editing !== null}
        onClose={() => setEditingId(null)}
        title={editing ? `قسم ${editing.nameAr}` : ""}
        lead={editing && isAdded(editing.id) ? "قسم مضاف من اللوحة. التعديل يتحفظ ويظهر في الموقع مباشرة." : "قسم أساسي من الموقع. الظهور يتحفظ مباشرة، وتعديل الاسم والصورة يتفعّل مع قاعدة البيانات."}
        footer={
          editing ? (
            <>
              <Link href={`/ar/c/${editing.slug}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-(--a-line) px-4 text-sm">
                <ExternalLink className="size-4" />
                فتح في المتجر
              </Link>
              <Button variant="primary" onClick={() => setEditingId(null)}>
                تم
              </Button>
            </>
          ) : null
        }
      >
        {editing ? (
          <div className="space-y-5">
            {editing.image ? (
              <div className="grid place-items-center rounded-2xl bg-(--a-surface-2) py-6">
                <img src={publicUrl(editing.image)} alt="" className="size-32 object-contain" />
              </div>
            ) : null}
            <BilingualField
              label="اسم القسم"
              ar={editing.nameAr}
              en={editing.nameEn}
              onAr={(nameAr) => updateAddedCategory(editing.id, { nameAr })}
              onEn={(nameEn) => updateAddedCategory(editing.id, { nameEn })}
              disabled={!isAdded(editing.id)}
            />
            <BilingualField
              label="الوصف"
              ar={editing.descriptionAr}
              en={editing.descriptionEn}
              onAr={(descriptionAr) => updateAddedCategory(editing.id, { descriptionAr })}
              onEn={(descriptionEn) => updateAddedCategory(editing.id, { descriptionEn })}
              multiline
              disabled={!isAdded(editing.id)}
            />
            <Field label="الرابط" value={editing.slug} onChange={() => {}} dir="ltr" disabled />
            <div className="rounded-xl border border-(--a-line) p-4">
              <ToggleRow
                label="ظاهر في المتجر"
                checked={editing.active && !content.categoryHidden.includes(editing.id)}
                disabled={!editing.active}
                onChange={(next) => setCategoryHidden(editing.id, !next)}
              />
            </div>
          </div>
        ) : null}
      </Drawer>

      <AddDepartment
        open={adding}
        onClose={() => {
          setAdding(false);
          if (readHash().sub === "add") replaceHash("departments");
        }}
        parentId={opened?.id ?? null}
      />

      <Confirm
        open={archiving !== null}
        onClose={() => setArchiving(null)}
        onConfirm={() => archiving && setCategoryArchived(archiving.id, true)}
        title={`حذف قسم ${archiving?.nameAr ?? ""}؟`}
        lead="القسم يختفي من المتجر وينتقل للأرشيف. تقدر تسترجعه في أي وقت."
        action="نقل للأرشيف"
      />
    </div>
  );
}

const EMPTY: NewCategory = { nameAr: "", nameEn: "", descriptionAr: "", descriptionEn: "", parentId: null, featured: false };

/** Adds a department or a subcategory; it is saved with the site content and shows in the store right away. */
function AddDepartment({ open, onClose, parentId }: { open: boolean; onClose: () => void; parentId: string | null }) {
  const { content, addCategory } = useSiteContent();
  const [form, setForm] = useState<NewCategory>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // Opening the form inside a department places the new one there.
  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, parentId });
      setError("");
    }
  }, [open, parentId]);
  const set = (patch: Partial<NewCategory>) => setForm((current) => ({ ...current, ...patch }));
  const ready = form.nameAr.trim() !== "" && form.nameEn.trim() !== "";
  // New categories go at most two levels deep: a main department or a subcategory inside one.
  const parents = rootDepartments(content.categoryHidden);

  function close() {
    setForm(EMPTY);
    onClose();
  }

  async function save() {
    if (!ready || saving) return;
    setSaving(true);
    setError("");
    try {
      await addCategory({ ...form, nameAr: form.nameAr.trim(), nameEn: form.nameEn.trim(), descriptionAr: form.descriptionAr.trim(), descriptionEn: form.descriptionEn.trim() });
      close();
    } catch (failure) {
      setError(apiMessage(failure));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={close}
      title={form.parentId ? `إضافة قسم فرعي داخل ${categoryById(form.parentId)?.nameAr ?? ""}` : "إضافة قسم"}
      lead="القسم يظهر في قائمة أقسام الموقع وفي فلتر المنتجات أول ما تحفظه."
      footer={
        <>
          <Button onClick={close}>إلغاء</Button>
          <Button variant="primary" icon={Plus} onClick={save} disabled={!ready || saving}>
            {saving ? "جاري الحفظ…" : "حفظ القسم"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <DemoNote title="محفوظ في قاعدة البيانات">القسم يتحفظ في قاعدة بيانات المتجر. صورة القسم تتفعّل لاحقًا، وحاليًا يظهر بأيقونة.</DemoNote>
        {error ? (
          <p role="alert" className="text-sm text-(--a-danger)">
            {error}
          </p>
        ) : null}
        <BilingualField label="اسم القسم" ar={form.nameAr} en={form.nameEn} onAr={(nameAr) => set({ nameAr })} onEn={(nameEn) => set({ nameEn })} />
        <BilingualField
          label="الوصف"
          ar={form.descriptionAr}
          en={form.descriptionEn}
          onAr={(descriptionAr) => set({ descriptionAr })}
          onEn={(descriptionEn) => set({ descriptionEn })}
          multiline
        />
        <Select
          label="مكان القسم"
          value={form.parentId ?? ""}
          onChange={(parentId) => set({ parentId: parentId || null })}
          options={[["", "قسم رئيسي في الموقع"], ...parents.map((item): [string, string] => [item.id, `قسم فرعي داخل ${item.nameAr}`])]}
        />
        {form.parentId === null ? (
          <div className="rounded-xl border border-(--a-line) p-4">
            <ToggleRow label="يظهر في شبكة أقسام الصفحة الرئيسية" checked={form.featured} onChange={(featured) => set({ featured })} />
          </div>
        ) : null}
        <Field label="صورة القسم" value="" onChange={() => {}} placeholder="رفع الصور يتفعّل مع Supabase Storage" disabled />
      </div>
    </Drawer>
  );
}
