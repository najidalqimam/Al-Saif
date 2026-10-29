import { useState } from "react";
import { BadgePercent, PackageSearch, Pencil, Tag, Ticket } from "lucide-react";
import { ProductArt } from "@/components/site/card-art";
import { useSiteContent } from "@/lib/site-content";
import type { View } from "./nav";
import { Badge, Button, Empty, NumberField, PageHead, Panel, StatCard, Switch, Tabs, num, sar } from "./ui";

type Filter = "home" | "discounted" | "all";

const discountOf = (price: number, compareAt: number) => (compareAt > price ? Math.round((1 - price / compareAt) * 100) : 0);

export function Offers({ onOpen }: { onOpen: (view: View) => void }) {
  const { content, updateProduct } = useSiteContent();
  const [filter, setFilter] = useState<Filter>("home");

  const live = content.products.filter((item) => !item.archived && !item.hidden);
  const discounted = live.filter((item) => discountOf(item.price, item.compareAt) > 0);
  const onHome = live.filter((item) => item.onHome);
  const best = Math.max(0, ...discounted.map((item) => discountOf(item.price, item.compareAt)));
  const rows = filter === "home" ? onHome : filter === "discounted" ? discounted : live;

  return (
    <div className="space-y-6">
      <PageHead
        title="العروض والخصومات"
        lead="اختر المنتجات اللي تظهر في قسم العروض، وعدّل السعر قبل وبعد الخصم. التعديل يظهر على المتجر مباشرة."
        actions={
          <Button icon={Pencil} onClick={() => onOpen("content")}>
            نصوص قسم العروض
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="في قسم العروض" value={num.format(onHome.length)} note="يظهر أول ١٠ منها في الرئيسية" icon={Tag} tone="accent" onClick={() => setFilter("home")} />
        <StatCard label="منتجات عليها خصم" value={num.format(discounted.length)} note="السعر قبل الخصم أعلى من الحالي" icon={BadgePercent} tone="ok" onClick={() => setFilter("discounted")} />
        <StatCard label="أعلى خصم" value={`${num.format(best)}٪`} note="من المنتجات المعروضة" icon={BadgePercent} tone="blue" />
      </div>

      <Panel>
        <div className="border-b border-(--a-line) px-5 py-3">
          <Tabs
            value={filter}
            onChange={setFilter}
            items={[
              ["home", "في العروض", onHome.length],
              ["discounted", "عليها خصم", discounted.length],
              ["all", "كل المنتجات المعروضة", live.length],
            ]}
          />
        </div>
        {rows.length ? (
          <ul className="divide-y divide-(--a-line)">
            {rows.map((item) => {
              const off = discountOf(item.price, item.compareAt);
              return (
                <li key={item.id} className="flex flex-wrap items-center gap-4 px-5 py-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-(--a-surface-2)">
                    <ProductArt id={item.id} className="size-9" />
                  </span>
                  <div className="min-w-40 flex-1">
                    <p className="font-medium">{item.nameAr}</p>
                    <p className="mt-0.5 text-xs text-(--a-muted)">{item.categoryAr}</p>
                  </div>
                  {off ? <Badge tone="ok">خصم {num.format(off)}٪</Badge> : <Badge>بدون خصم</Badge>}
                  <div className="grid w-full grid-cols-2 gap-2 sm:w-64">
                    <NumberField label="السعر الحالي" suffix="ر.س" value={item.price} onChange={(value) => updateProduct(item.id, { price: value ?? 0 })} />
                    <NumberField label="قبل الخصم" suffix="ر.س" value={item.compareAt} onChange={(value) => updateProduct(item.id, { compareAt: value ?? 0 })} />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-(--a-muted)">
                    في العروض
                    <Switch checked={item.onHome} label={`إظهار ${item.nameAr} في العروض`} onChange={(next) => updateProduct(item.id, { onHome: next })} />
                  </label>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty icon={PackageSearch} title="ما فيه منتجات هنا" lead="فعّل منتجات من تبويب كل المنتجات المعروضة." />
        )}
      </Panel>

      <Panel title="كوبونات الخصم" lead="أكواد خصم يكتبها العميل عند الدفع" actions={<Badge tone="blue">قريبًا</Badge>}>
        <Empty icon={Ticket} title="ما فيه كوبونات" lead="الكوبونات تحتاج صفحة دفع مربوطة بقاعدة البيانات عشان تنطبق على الطلب. تتفعّل بعد المرحلة الثالثة." />
      </Panel>

      <p className="text-xs text-(--a-muted)">{sar.format(onHome.reduce((sum, item) => sum + Math.max(0, item.compareAt - item.price), 0))} مجموع التوفير على منتجات قسم العروض.</p>
    </div>
  );
}
