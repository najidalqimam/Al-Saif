import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { Archive, ArchiveRestore, ChevronLeft, ExternalLink, FolderSearch, GripVertical, PackageSearch, Pencil, Plus, Save } from "lucide-react";
import { allCategories, categoryBlurb, categoryById, categoryLabel, type CatalogCategory } from "@/lib/catalog";
import { apiMessage } from "@/lib/api";
import { useSiteContent, type NewCategory } from "@/lib/site-content";
import { publicUrl } from "@/lib/utils";
import { ProductArt } from "@/components/site/card-art";
import { productInCategory } from "@/lib/product-categories";
import { onHashMove, pushHash, readHash, registerLeaveGuard } from "./nav";
import { ToggleRow } from "./Products";
import { Badge, BilingualField, Button, Confirm, Drawer, Empty, Field, IconButton, num, PageHead, Pager, Panel, rowOpen, sar, SearchBox, Switch, Tabs, usePager } from "./ui";

type Filter = "main" | "hidden" | "archived";

/** Main departments in storefront order (the store has no subcategories). */
function inTreeOrder(list: CatalogCategory[]) {
  return list.filter((item) => item.level === 1).sort((a, b) => a.sort - b.sort);
}

/** #departments, #departments/<id> (its products) or #departments/add (a new department). */
function parseRoute(view: string, sub: string | null) {
  if (view !== "departments" || !sub) return { open: null as string | null, adding: false };
  if (sub === "add") return { open: null, adding: true };
  return { open: sub, adding: false };
}

export function Departments() {
  const { content, setCategoryHidden, setCategoryArchived, updateProduct, reorderCategories } = useSiteContent();
  // The store has main departments only; products sit straight under a department.
  const catalog = inTreeOrder(allCategories());
  const isAdded = (id: string) => content.addedCategories.some((item) => item.id === id);
  const [filter, setFilter] = useState<Filter>("main");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<CatalogCategory | null>(null);
  // The department being browsed lives in the URL (#departments/<id>), so back returns to the level above.
  // "Add department" is its own page (#departments/add), also reached from the overview's quick actions.
  const [route, setRoute] = useState(() => parseRoute(readHash().view, readHash().sub));
  useEffect(() => onHashMove(() => setRoute(parseRoute(readHash().view, readHash().sub))), []);
  const openId = route.open;
  const adding = route.adding;
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
  const productsOf = (id: string) => content.products.filter((item) => !item.archived && productInCategory(item, id));
  // A department opens onto its products.
  const showingProducts = opened !== null;
  const needle = query.trim().toLowerCase();
  const productRows = showingProducts ? productsOf(opened.id).filter((item) => !needle || [item.nameAr, item.nameEn].some((text) => text.toLowerCase().includes(needle))) : [];
  const allRows = catalog.filter((item) => {
    const gone = archived.includes(item.id);
    if (filter === "archived" ? !gone : gone) return false;
    if (filter === "hidden" && !(hiddenOnly(item) || !item.active)) return false;
    if (needle && ![item.nameAr, item.nameEn, item.slug].some((text) => text.toLowerCase().includes(needle))) return false;
    return true;
  });
  const rowsPager = usePager(allRows, `${filter}|${query}|${opened?.id ?? ""}`);
  const productsPager = usePager(productRows, `${query}|${opened?.id ?? ""}`);
  // Departments can be dragged into a new order, but not while searching or on the stopped / deleted tabs,
  // where the list is not the full set of departments.
  const orderable = !showingProducts && !needle && filter === "main";
  const rows = orderable ? allRows : rowsPager.rows;
  const [drag, setDrag] = useState<{ id: string; over: string | null; after: boolean } | null>(null);
  const [orderError, setOrderError] = useState("");
  function dropAt(targetId: string, after: boolean) {
    if (!drag || drag.id === targetId) return setDrag(null);
    const ids = allRows.map((item) => item.id).filter((id) => id !== drag.id);
    const at = ids.indexOf(targetId);
    ids.splice(at + (after ? 1 : 0), 0, drag.id);
    setDrag(null);
    setOrderError("");
    reorderCategories(ids).catch((failure) => setOrderError(apiMessage(failure)));
  }

  if (adding) return <AddDepartmentPage onClose={() => pushHash("departments")} />;

  return (
    <div className="space-y-6">
      <PageHead
        title="الأقسام"
        lead="نفس أقسام الموقع وترتيبها. اضغط على القسم لتشوف منتجاته."
        actions={
          showingProducts ? (
            <Button variant="primary" icon={Plus} onClick={() => pushHash("products", `${opened.id}/add`)}>
              إضافة منتج
            </Button>
          ) : (
            <Button variant="primary" icon={Plus} onClick={() => pushHash("departments", "add")}>
              إضافة قسم
            </Button>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        {opened ? null : (
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

      {orderError ? (
        <p role="alert" className="rounded-xl border border-(--a-danger)/30 px-4 py-3 text-sm text-(--a-danger)">
          {orderError}
        </p>
      ) : null}
      {orderable ? <p className="text-xs text-(--a-muted)">اسحب أي قسم من المقبض وغيّر مكانه. الترتيب يتحفظ فورًا ويظهر في الموقع.</p> : null}

      <Panel>
        {showingProducts ? (
          productRows.length ? (
            <ul className="divide-y divide-(--a-line)">
              {productsPager.rows.map((item) => (
                <li
                  key={item.id}
                  {...rowOpen(() => pushHash("products", `${opened.id}/edit-${item.id}`))}
                  className="flex cursor-pointer flex-wrap items-center gap-4 px-5 py-2.5"
                >
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
              lead={needle ? "جرّب كلمة بحث ثانية." : "هذا القسم ما فيه منتجات لسه. أضف منتج من زر إضافة منتج."}
            />
          )
        ) : rows.length ? (
          <ul className="divide-y divide-(--a-line)">
            {rows.map((item) => {
              const gone = archived.includes(item.id);
              const visible = item.active && !content.categoryHidden.includes(item.id);
              // A department opens onto its products.
              const opens = !gone;
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
                      <span>{num.format(productsOf(item.id).length)} منتج</span>
                    </span>
                  </span>
                  {opens ? <ChevronLeft className="size-4 shrink-0 text-(--a-muted) transition group-hover:text-(--a-accent-ink)" /> : null}
                </>
              );
              return (
                <li
                  key={item.id}
                  {...(gone
                    ? {}
                    : rowOpen(() => {
                        if (opens) {
                          setOpenId(item.id);
                          setQuery("");
                        } else setEditingId(item.id);
                      }))}
                  draggable={orderable}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", item.id);
                    setDrag({ id: item.id, over: null, after: false });
                  }}
                  onDragOver={(event) => {
                    if (!drag) return;
                    event.preventDefault();
                    const box = event.currentTarget.getBoundingClientRect();
                    const after = event.clientY > box.top + box.height / 2;
                    if (drag.over !== item.id || drag.after !== after) setDrag({ ...drag, over: item.id, after });
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    dropAt(item.id, drag?.after ?? false);
                  }}
                  onDragEnd={() => setDrag(null)}
                  className={`flex flex-wrap items-center gap-4 px-5 py-2.5${gone ? "" : " cursor-pointer"}${drag?.id === item.id ? " opacity-40" : ""}${drag?.over === item.id && drag.id !== item.id ? (drag.after ? " shadow-[inset_0_-2px_0_var(--a-accent)]" : " shadow-[inset_0_2px_0_var(--a-accent)]") : ""}`}
                >
                  {orderable ? (
                    <span title="اسحب لإعادة الترتيب" aria-label={`اسحب ${item.nameAr} لإعادة الترتيب`} className="-ms-2 grid size-8 shrink-0 cursor-grab place-items-center rounded-lg text-(--a-muted) hover:bg-(--a-surface-2) active:cursor-grabbing">
                      <GripVertical className="size-4" />
                    </span>
                  ) : null}
                  {opens ? (
                    <button
                      type="button"
                      onClick={() => {
                        setOpenId(item.id);
                        setQuery("");
                      }}
                      aria-label={`فتح منتجات ${item.nameAr}`}
                      className="group -my-2 -ms-2 flex min-w-0 flex-1 items-center gap-4 rounded-xl py-2 ps-2 text-start transition hover:bg-(--a-surface-2)/60"
                    >
                      {details}
                    </button>
                  ) : (
                    <div className="flex min-w-0 flex-1 items-center gap-4">{details}</div>
                  )}
                  <div className="flex items-center gap-1.5">
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
          <Empty icon={FolderSearch} title="ما فيه أقسام هنا" lead={filter === "archived" ? "الأقسام المحذوفة تنتقل للأرشيف وتقدر تسترجعها." : "جرّب كلمة بحث ثانية أو غيّر الفلتر."} />
        )}
        {orderable ? null : <Pager pager={showingProducts ? productsPager : rowsPager} />}
      </Panel>

      <EditDepartment
        category={editing}
        hidden={editing ? content.categoryHidden.includes(editing.id) : false}
        canRename={editing ? isAdded(editing.id) : false}
        onClose={() => setEditingId(null)}
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

const EMPTY: NewCategory = { nameAr: "", nameEn: "", nameUr: "", descriptionAr: "", descriptionEn: "", descriptionUr: "", parentId: null, featured: false };

/** The Urdu name and description a department shows now: its own, else the built-in Urdu copy; empty when it only has the Arabic fallback. */
function urduOf(category: CatalogCategory) {
  const name = categoryLabel(category, "ur");
  const text = categoryBlurb(category, "ur");
  return { name: name === category.nameAr ? "" : name, description: text === category.descriptionAr ? "" : text };
}

/** Edit drawer for a department: changes stay as a draft until Save. */
function EditDepartment({
  category,
  hidden,
  canRename,
  onClose,
}: {
  category: CatalogCategory | null;
  hidden: boolean;
  canRename: boolean;
  onClose: () => void;
}) {
  const { saveCategory } = useSiteContent();
  const [draft, setDraft] = useState({ nameAr: "", nameEn: "", nameUr: "", descriptionAr: "", descriptionEn: "", descriptionUr: "", hidden: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!category) return;
    setDraft({
      nameAr: category.nameAr,
      nameEn: category.nameEn,
      nameUr: urduOf(category).name,
      descriptionAr: category.descriptionAr,
      descriptionEn: category.descriptionEn,
      descriptionUr: urduOf(category).description,
      hidden,
    });
    setError("");
  }, [category, hidden]);

  const dirty = useMemo(() => {
    if (!category) return false;
    return (
      draft.nameAr !== category.nameAr ||
      draft.nameEn !== category.nameEn ||
      draft.nameUr !== urduOf(category).name ||
      draft.descriptionAr !== category.descriptionAr ||
      draft.descriptionEn !== category.descriptionEn ||
      draft.descriptionUr !== urduOf(category).description ||
      draft.hidden !== hidden
    );
  }, [category, draft, hidden]);

  async function save() {
    if (!category || !dirty || saving) return;
    setSaving(true);
    setError("");
    try {
      await saveCategory(category.id, {
        nameAr: draft.nameAr.trim(),
        nameEn: draft.nameEn.trim(),
        nameUr: draft.nameUr.trim(),
        descriptionAr: draft.descriptionAr.trim(),
        descriptionEn: draft.descriptionEn.trim(),
        descriptionUr: draft.descriptionUr.trim(),
        hidden: draft.hidden,
      });
      onClose();
    } catch (failure) {
      setError(apiMessage(failure));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      open={category !== null}
      onClose={onClose}
      title={category ? `قسم ${category.nameAr}` : ""}
      lead="عدّل البيانات ثم اضغط حفظ عشان تظهر على الموقع."
      footer={
        category ? (
          <>
            <Link href={`/ar/c/${category.slug}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-(--a-line) px-4 text-sm">
              <ExternalLink className="size-4" />
              فتح في المتجر
            </Link>
            <Button onClick={onClose}>إلغاء</Button>
            <Button variant="primary" icon={Save} onClick={save} disabled={!dirty || saving}>
              {saving ? "جاري الحفظ…" : "حفظ"}
            </Button>
          </>
        ) : null
      }
    >
      {category ? (
        <div className="space-y-5">
          {category.image ? (
            <div className="grid place-items-center rounded-2xl bg-(--a-surface-2) py-6">
              <img src={publicUrl(category.image)} alt="" className="size-32 object-contain" />
            </div>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm text-(--a-danger)">
              {error}
            </p>
          ) : null}
          <BilingualField
            label="اسم القسم"
            ar={draft.nameAr}
            en={draft.nameEn}
            ur={draft.nameUr}
            onAr={(nameAr) => setDraft((current) => ({ ...current, nameAr }))}
            onEn={(nameEn) => setDraft((current) => ({ ...current, nameEn }))}
            onUr={(nameUr) => setDraft((current) => ({ ...current, nameUr }))}
            disabled={!canRename}
          />
          <BilingualField
            label="الوصف"
            ar={draft.descriptionAr}
            en={draft.descriptionEn}
            ur={draft.descriptionUr}
            onAr={(descriptionAr) => setDraft((current) => ({ ...current, descriptionAr }))}
            onEn={(descriptionEn) => setDraft((current) => ({ ...current, descriptionEn }))}
            onUr={(descriptionUr) => setDraft((current) => ({ ...current, descriptionUr }))}
            multiline
            disabled={!canRename}
          />
          <Field label="الرابط" value={category.slug} onChange={() => {}} dir="ltr" disabled />
          <div className="rounded-xl border border-(--a-line) p-4">
            <ToggleRow
              label="ظاهر في المتجر"
              checked={category.active && !draft.hidden}
              disabled={!category.active}
              onChange={(next) => setDraft((current) => ({ ...current, hidden: !next }))}
            />
          </div>
        </div>
      ) : null}
    </Drawer>
  );
}

/** Add department page (#departments/add): saved with the site content and shown in the store right away. */
function AddDepartmentPage({ onClose }: { onClose: () => void }) {
  const { addCategory } = useSiteContent();
  const initial = EMPTY;
  const [form, setForm] = useState<NewCategory>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (patch: Partial<NewCategory>) => setForm((current) => ({ ...current, ...patch }));
  const ready = form.nameAr.trim() !== "" && form.nameEn.trim() !== "";
  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);
  const unsaved = useRef(false);
  unsaved.current = dirty;

  // Leaving with unsaved input asks first; the prompt can save the department (it only leaves when the save worked).
  const saveRef = useRef<(leave: boolean) => Promise<boolean>>(async () => true);
  useEffect(() => registerLeaveGuard(() => unsaved.current, { save: () => saveRef.current(false), anySub: true }), []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function save(leave = true): Promise<boolean> {
    if (saving) return false;
    if (!ready) {
      setError("اسم القسم بالعربي والإنجليزي مطلوب قبل الحفظ.");
      return false;
    }
    setSaving(true);
    setError("");
    try {
      await addCategory({ ...form, nameAr: form.nameAr.trim(), nameEn: form.nameEn.trim(), nameUr: (form.nameUr ?? "").trim(), descriptionAr: form.descriptionAr.trim(), descriptionEn: form.descriptionEn.trim(), descriptionUr: (form.descriptionUr ?? "").trim() });
      // Saved: nothing is left to lose, so the leave prompt must not ask again.
      unsaved.current = false;
      if (leave) onClose();
      return true;
    } catch (failure) {
      setError(apiMessage(failure));
      return false;
    } finally {
      setSaving(false);
    }
  }
  saveRef.current = save;

  return (
    <div className="space-y-6">
      <PageHead
        title="إضافة قسم"
        lead={dirty ? "فيه تعديلات غير محفوظة. اضغط حفظ عشان يظهر القسم في الموقع." : "القسم يظهر في قائمة أقسام الموقع وفي فلتر المنتجات أول ما تحفظه."}
        actions={
          <Button variant="primary" icon={Save} onClick={() => void save()} disabled={!ready || saving}>
            {saving ? "جاري الحفظ…" : "حفظ القسم"}
          </Button>
        }
      />

      {error ? (
        <p role="alert" className="rounded-xl border border-(--a-danger)/30 px-4 py-3 text-sm text-(--a-danger)">
          {error}
        </p>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <Panel title="البيانات الأساسية">
            <div className="space-y-5 p-5">
              <BilingualField label="اسم القسم" ar={form.nameAr} en={form.nameEn} ur={form.nameUr ?? ""} onAr={(nameAr) => set({ nameAr })} onEn={(nameEn) => set({ nameEn })} onUr={(nameUr) => set({ nameUr })} />
              <BilingualField
                label="الوصف"
                ar={form.descriptionAr}
                en={form.descriptionEn}
                ur={form.descriptionUr ?? ""}
                onAr={(descriptionAr) => set({ descriptionAr })}
                onEn={(descriptionEn) => set({ descriptionEn })}
                onUr={(descriptionUr) => set({ descriptionUr })}
                multiline
              />
              <p className="text-xs leading-6 text-(--a-muted)">الحقول المطلوبة: اسم القسم بالعربي والإنجليزي. الأوردو اختياري، وإن تُرك فارغًا يظهر الاسم الأوردو الجاهز للأقسام الأساسية أو العربي. القسم يتحفظ في قاعدة بيانات المتجر.</p>
            </div>
          </Panel>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24">
          <Panel title="الصورة">
            <div className="grid place-items-center gap-3 p-5">
              <div className="grid w-full place-items-center rounded-2xl bg-(--a-surface-2) py-6">
                <span className="grid size-40 place-items-center rounded-2xl border border-dashed border-(--a-line) text-xs text-(--a-muted)">بدون صورة</span>
              </div>
              <p className="text-center text-xs leading-6 text-(--a-muted)">صورة القسم تتفعّل لاحقًا مع تخزين الصور، وحاليًا يظهر بأيقونة.</p>
            </div>
          </Panel>
          {form.parentId === null ? (
            <Panel title="الظهور">
              <div className="p-5">
                <ToggleRow label="يظهر في شبكة أقسام الصفحة الرئيسية" checked={form.featured} onChange={(featured) => set({ featured })} />
              </div>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
