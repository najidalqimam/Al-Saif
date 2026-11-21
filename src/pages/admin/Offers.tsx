import { useEffect, useRef, useState } from "react";
import { BadgePercent, Check, PackageSearch, Pencil, Plus, Tag, Ticket } from "lucide-react";
import { ProductArt } from "@/components/site/card-art";
import { useSiteContent, type ProductRow } from "@/lib/site-content";
import { registerLeaveGuard, type View } from "./nav";
import { useShopScope } from "./shopScope";
import { Badge, Button, Drawer, Empty, num, NumberField, PageHead, Pager, Panel, sar, SearchBox, StatCard, Switch, Tabs, usePager } from "./ui";

type Filter = "home" | "discounted" | "all";

const discountOf = (price: number, compareAt: number) => (compareAt > price ? Math.round((1 - price / compareAt) * 100) : 0);

type Draft = Partial<Pick<ProductRow, "price" | "compareAt" | "onHome">>;

export function Offers({ onOpen }: { onOpen: (view: View) => void }) {
  const { content, updateProduct } = useSiteContent();
  const shopScope = useShopScope();
  const [filter, setFilter] = useState<Filter>("home");
  // Edits made here wait as a draft until "تأكيد التعديلات" saves them to the products.
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [adding, setAdding] = useState(false);
  const [pick, setPick] = useState("");

  const saved = content.products.filter((item) => !item.archived && !item.hidden);
  const live = saved.map((item) => ({ ...item, ...drafts[item.id] }));
  const draftCount = Object.keys(drafts).length;

  // Unconfirmed edits: ask before leaving this section (dashboard links, back button) or closing / refreshing the tab.
  const unsaved = useRef(false);
  unsaved.current = draftCount > 0;
  useEffect(() => registerLeaveGuard(() => unsaved.current), []);
  useEffect(() => {
    if (draftCount === 0) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [draftCount]);

  function setDraft(id: string, patch: Draft) {
    const base = saved.find((item) => item.id === id);
    if (!base) return;
    const next: Draft = { ...drafts[id], ...patch };
    for (const key of Object.keys(next) as Array<keyof Draft>) if (next[key] === base[key]) delete next[key];
    setConfirmed(false);
    setDrafts((current) => {
      const { [id]: _removed, ...rest } = current;
      return Object.keys(next).length ? { ...rest, [id]: next } : rest;
    });
  }

  function confirmEdits() {
    for (const [id, patch] of Object.entries(drafts)) updateProduct(id, patch);
    setDrafts({});
    setConfirmed(true);
  }

  const discounted = live.filter((item) => discountOf(item.price, item.compareAt) > 0);
  const onHome = live.filter((item) => item.onHome);
  const best = Math.max(0, ...discounted.map((item) => discountOf(item.price, item.compareAt)));
  // A product switched off here stays in the "في العروض" list until the edits are confirmed, so the switch can be undone.
  const wasOnHome = new Set(saved.filter((item) => item.onHome).map((item) => item.id));
  const rows = filter === "home" ? live.filter((item) => item.onHome || wasOnHome.has(item.id)) : filter === "discounted" ? discounted : live;
  const pager = usePager(rows, filter);
  const needle = pick.trim().toLowerCase();
  const candidates = live.filter((item) => !item.onHome && (!needle || [item.nameAr, item.nameEn, item.categoryAr].some((text) => text.toLowerCase().includes(needle))));

  return (
    <div className="space-y-6">
      <PageHead
        title="العروض والخصومات"
        lead="منتجات قسم العروض وأسعارها قبل وبعد الخصم."
        actions={
          shopScope ? undefined : (
            <Button icon={Pencil} onClick={() => onOpen("content")}>
              نصوص قسم العروض
            </Button>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="في قسم العروض" value={num.format(onHome.length)} note="يظهر أول 10 منها في الرئيسية" icon={Tag} tone="blue" onClick={() => setFilter("home")} />
        <StatCard label="منتجات عليها خصم" value={num.format(discounted.length)} note="السعر قبل الخصم أعلى من الحالي" icon={BadgePercent} tone="ok" onClick={() => setFilter("discounted")} />
        <StatCard label="أعلى خصم" value={`${num.format(best)}٪`} note="من المنتجات المعروضة" icon={BadgePercent} tone="blue" />
      </div>

      <Panel>
        <div className="sticky top-16 z-10 flex flex-wrap items-center gap-3 rounded-t-2xl border-b border-(--a-line) bg-(--a-surface) px-5 py-3">
          <Tabs
            value={filter}
            onChange={setFilter}
            items={[
              ["home", "في العروض", onHome.length],
              ["discounted", "عليها خصم", discounted.length],
              ["all", "كل المنتجات المعروضة", live.length],
            ]}
          />
          <div className="ms-auto flex flex-wrap items-center gap-2">
            {draftCount ? (
              <span role="status" className="text-xs text-(--a-muted)">
                {num.format(draftCount)} منتج بتعديلات بانتظار التأكيد
              </span>
            ) : confirmed ? (
              <span role="status" className="inline-flex items-center gap-1 text-xs text-(--a-ok)">
                <Check className="size-3.5" aria-hidden />
                تم تأكيد التعديلات
              </span>
            ) : null}
            <Button icon={Plus} onClick={() => setAdding(true)}>
              إضافة منتج للخصومات
            </Button>
            <Button variant="primary" icon={Check} onClick={confirmEdits} disabled={draftCount === 0}>
              تأكيد التعديلات
            </Button>
          </div>
        </div>
        {rows.length ? (
          <ul className="divide-y divide-(--a-line)">
            {pager.rows.map((item) => {
              const off = discountOf(item.price, item.compareAt);
              return (
                <li key={item.id} className="flex flex-wrap items-center gap-4 px-5 py-2.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--a-surface-2)">
                    <ProductArt id={item.id} className="size-8" />
                  </span>
                  <div className="min-w-40 flex-1">
                    <p className="font-medium">{item.nameAr}</p>
                    <p className="mt-0.5 text-xs text-(--a-muted)">{item.categoryAr}</p>
                  </div>
                  {off ? <Badge tone="ok">خصم {num.format(off)}٪</Badge> : <Badge>بدون خصم</Badge>}
                  <div className="grid w-full grid-cols-2 gap-2 sm:w-64">
                    <NumberField label="السعر الحالي" suffix="ر.س" value={item.price} onChange={(value) => setDraft(item.id, { price: value ?? 0 })} />
                    <NumberField label="قبل الخصم" suffix="ر.س" value={item.compareAt} onChange={(value) => setDraft(item.id, { compareAt: value ?? 0 })} />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-(--a-muted)">
                    في العروض
                    <Switch size="sm" checked={item.onHome} label={`إظهار ${item.nameAr} في العروض`} onChange={(next) => setDraft(item.id, { onHome: next })} />
                  </label>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty icon={PackageSearch} title="ما فيه منتجات هنا" lead="فعّل منتجات من تبويب كل المنتجات المعروضة." />
        )}
        <Pager pager={pager} />
      </Panel>

      <Panel title="كوبونات الخصم" lead="أكواد خصم يكتبها العميل عند الدفع" actions={<Badge tone="blue">قريبًا</Badge>}>
        <Empty icon={Ticket} title="ما فيه كوبونات" lead="الكوبونات تحتاج صفحة دفع مربوطة بقاعدة البيانات عشان تنطبق على الطلب. تتفعّل بعد المرحلة الثالثة." />
      </Panel>

      <Drawer
        open={adding}
        onClose={() => {
          setAdding(false);
          setPick("");
        }}
        title="إضافة منتج للخصومات"
        lead="اختر منتجًا يظهر في قسم العروض. تعدّل سعره وخصمه بعدها، وتأكيد التعديلات يحفظ كل شيء."
        footer={
          <Button
            variant="primary"
            onClick={() => {
              setAdding(false);
              setPick("");
            }}
          >
            تم
          </Button>
        }
      >
        <div className="space-y-4">
          <SearchBox value={pick} onChange={setPick} placeholder="ابحث باسم المنتج أو القسم" />
          {candidates.length ? (
            <ul className="divide-y divide-(--a-line) rounded-xl border border-(--a-line)">
              {candidates.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--a-surface-2)">
                    <ProductArt id={item.id} className="size-8" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium">{item.nameAr}</p>
                    <p className="text-xs text-(--a-muted)">{item.categoryAr}</p>
                  </div>
                  <Button
                    icon={Plus}
                    onClick={() => {
                      setDraft(item.id, { onHome: true });
                      setFilter("home");
                    }}
                  >
                    إضافة
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <Empty icon={PackageSearch} title="ما فيه منتجات للإضافة" lead={needle ? "جرّب كلمة بحث ثانية." : "كل المنتجات المعروضة موجودة في قسم العروض."} />
          )}
        </div>
      </Drawer>

      <p className="text-xs text-(--a-muted)">{sar.format(onHome.reduce((sum, item) => sum + Math.max(0, item.compareAt - item.price), 0))} مجموع التوفير على منتجات قسم العروض.</p>
    </div>
  );
}
