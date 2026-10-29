import { useState } from "react";
import { Link } from "wouter";
import { Archive, ArchiveRestore, ExternalLink, FolderSearch, Pencil, Plus } from "lucide-react";
import { CATALOG, categoryById, type CatalogCategory } from "@/lib/catalog";
import { useSiteContent } from "@/lib/site-content";
import { publicUrl } from "@/lib/utils";
import { ToggleRow } from "./Products";
import { Badge, BilingualField, Button, Confirm, Drawer, Empty, Field, IconButton, PageHead, Panel, PendingNote, SearchBox, Switch, Tabs, num } from "./ui";

type Filter = "home" | "all" | "hidden" | "archived";

export function Departments() {
  const { content, setCategoryHidden, setCategoryArchived } = useSiteContent();
  const [filter, setFilter] = useState<Filter>("home");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<CatalogCategory | null>(null);
  const [adding, setAdding] = useState(false);
  const [archiving, setArchiving] = useState<CatalogCategory | null>(null);

  const archived = content.categoryArchived;
  const hiddenOnly = (item: CatalogCategory) => content.categoryHidden.includes(item.id) && !archived.includes(item.id);
  const isHome = (item: CatalogCategory) => item.featured && item.level === 1;
  const counts = {
    home: CATALOG.filter((item) => isHome(item) && !archived.includes(item.id)).length,
    all: CATALOG.filter((item) => !archived.includes(item.id)).length,
    hidden: CATALOG.filter((item) => hiddenOnly(item) || !item.active).length,
    archived: archived.length,
  };
  const needle = query.trim().toLowerCase();
  const rows = CATALOG.filter((item) => {
    const gone = archived.includes(item.id);
    if (filter === "archived" ? !gone : gone) return false;
    if (filter === "home" && !isHome(item)) return false;
    if (filter === "hidden" && !(hiddenOnly(item) || !item.active)) return false;
    if (needle && ![item.nameAr, item.nameEn, item.slug].some((text) => text.toLowerCase().includes(needle))) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHead
        title="التصنيفات"
        lead="شجرة أقسام المتجر. أوقف القسم ليختفي من الصفحة الرئيسية والقوائم بدون ما تحذفه. عناوين شبكة الأقسام في صفحة المحتوى والإعدادات."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setAdding(true)}>
            إضافة قسم
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={filter}
          onChange={setFilter}
          items={[
            ["home", "الرئيسية", counts.home],
            ["all", "كل التصنيفات", counts.all],
            ["hidden", "موقوف", counts.hidden],
            ["archived", "الأرشيف", counts.archived],
          ]}
        />
        <SearchBox value={query} onChange={setQuery} placeholder="ابحث باسم القسم" />
      </div>

      <Panel>
        {rows.length ? (
          <ul className="divide-y divide-(--a-line)">
            {rows.map((item) => {
              const gone = archived.includes(item.id);
              const visible = item.active && !content.categoryHidden.includes(item.id);
              const parent = item.parentId ? categoryById(item.parentId) : null;
              return (
                <li key={item.id} className="flex flex-wrap items-center gap-4 px-5 py-3">
                  <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-(--a-surface-2)">
                    {item.image ? <img src={publicUrl(item.image)} alt="" className="size-10 object-contain" /> : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.nameAr}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-(--a-muted)">
                      <span dir="ltr">{item.nameEn}</span>
                      <span>·</span>
                      <span>{parent ? `داخل ${parent.nameAr}` : "قسم رئيسي"}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge>مستوى {num.format(item.level)}</Badge>
                    {isHome(item) ? <Badge tone="accent">في الرئيسية</Badge> : null}
                    {!item.active ? <Badge tone="warn">غير نشط</Badge> : null}
                  </div>
                  <div className="flex items-center gap-1">
                    {gone ? (
                      <Button icon={ArchiveRestore} onClick={() => setCategoryArchived(item.id, false)}>
                        استرجاع
                      </Button>
                    ) : (
                      <>
                        <Switch checked={visible} disabled={!item.active} label={`إظهار قسم ${item.nameAr}`} onChange={(next) => setCategoryHidden(item.id, !next)} />
                        <span className="w-2" />
                        <IconButton icon={Pencil} label={`تعديل ${item.nameAr}`} onClick={() => setEditing(item)} />
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
      </Panel>

      <Drawer
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `قسم ${editing.nameAr}` : ""}
        lead="الظهور يتحفظ مباشرة. تعديل الاسم والصورة يتفعّل مع قاعدة البيانات."
        footer={
          editing ? (
            <>
              <Link href={`/ar/c/${editing.slug}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-(--a-line) px-4 text-sm">
                <ExternalLink className="size-4" />
                فتح في المتجر
              </Link>
              <Button variant="primary" onClick={() => setEditing(null)}>
                تم
              </Button>
            </>
          ) : null
        }
      >
        {editing ? (
          <div className="space-y-5">
            <div className="grid place-items-center rounded-2xl bg-(--a-surface-2) py-6">
              {editing.image ? <img src={publicUrl(editing.image)} alt="" className="size-32 object-contain" /> : null}
            </div>
            <BilingualField label="اسم القسم" ar={editing.nameAr} en={editing.nameEn} onAr={() => {}} onEn={() => {}} disabled />
            <BilingualField label="الوصف" ar={editing.descriptionAr} en={editing.descriptionEn} onAr={() => {}} onEn={() => {}} multiline disabled />
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

      <Drawer
        open={adding}
        onClose={() => setAdding(false)}
        title="إضافة قسم"
        footer={
          <>
            <Button onClick={() => setAdding(false)}>إلغاء</Button>
            <Button variant="primary" disabled>
              حفظ القسم
            </Button>
          </>
        }
      >
        <PendingNote />
        <div className="space-y-5">
          <BilingualField label="اسم القسم" ar="" en="" onAr={() => {}} onEn={() => {}} disabled />
          <BilingualField label="الوصف" ar="" en="" onAr={() => {}} onEn={() => {}} multiline disabled />
          <Field label="القسم الأب" value="" onChange={() => {}} placeholder="قسم رئيسي" disabled />
          <Field label="صورة القسم" value="" onChange={() => {}} placeholder="رفع الصورة إلى Supabase Storage" disabled />
        </div>
      </Drawer>

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
