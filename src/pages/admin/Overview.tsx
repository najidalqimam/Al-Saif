import { useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, ArrowLeft, Boxes, CheckCircle2, CreditCard, ExternalLink, Images, LayoutGrid, Package, PackageX, Percent, ShoppingCart, Store, Truck, Wallet } from "lucide-react";
import { featuredDepartments } from "@/lib/catalog";
import { useSiteContent } from "@/lib/site-content";
import { cn } from "@/lib/utils";
import { OrderDrawer, OrdersTable } from "./OrdersPage";
import { SHIP_STAGE, shipStage, stockLevel, useOps } from "./ops";
import type { Order } from "./orders";
import type { View } from "./nav";
import { Badge, Button, PageHead, Panel, StatCard, num, sar, type IconType } from "./ui";

const DAYS = 7;

export function Overview({ onOpen }: { onOpen: (view: View) => void }) {
  const { content } = useSiteContent();
  const { ops, orders } = useOps();
  const [viewing, setViewing] = useState<Order | null>(null);

  const kept = orders.filter((order) => order.status !== "cancelled");
  const sales = kept.reduce((sum, order) => sum + order.total, 0);
  const awaiting = orders.filter((order) => shipStage(order.status) === "awaiting").length;
  const live = content.products.filter((item) => !item.hidden && !item.archived);
  const counted = live.filter((item) => ops.stock[item.id] !== undefined);
  const low = counted.filter((item) => {
    const level = stockLevel(ops.stock[item.id], ops.lowStock);
    return level === "low" || level === "out";
  });

  const hiddenProducts = content.products.filter((item) => item.hidden && !item.archived).length;
  const archivedProducts = content.products.filter((item) => item.archived).length;
  const hiddenCategories = content.categoryHidden.filter((id) => !content.categoryArchived.includes(id)).length;
  const slidesOff = content.heroHidden.length + content.heroArchived.length;
  const sectionsOff = content.sectionHidden.length;
  const noDiscount = live.filter((item) => item.onHome && item.compareAt <= item.price).length;

  return (
    <div className="space-y-6">
      <PageHead
        title="نظرة عامة"
        lead="ملخص المتجر في صفحة واحدة. أرقام المبيعات والطلبات تجريبية، وأرقام المنتجات والمحتوى حقيقية من المتجر."
        actions={
          <Link href="/ar" className="inline-flex h-10 items-center gap-2 rounded-xl border border-(--a-line) bg-(--a-surface) px-4 text-sm font-medium hover:bg-(--a-surface-2)">
            <ExternalLink className="size-4" />
            فتح المتجر
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="إجمالي المبيعات" value={sar.format(sales)} note={`من ${num.format(kept.length)} طلب غير ملغي`} icon={Wallet} tone="accent" demo onClick={() => onOpen("reports")} />
        <StatCard label="الطلبات" value={num.format(orders.length)} note={`${num.format(awaiting)} بانتظار الشحن`} icon={ShoppingCart} tone="blue" demo onClick={() => onOpen("orders")} />
        <StatCard
          label="المنتجات المعروضة"
          value={`${num.format(live.length)} / ${num.format(content.products.length)}`}
          note={`${num.format(live.filter((item) => item.onHome).length)} في عروض الرئيسية`}
          icon={Package}
          tone="ok"
          onClick={() => onOpen("products")}
        />
        <StatCard
          label="منتجات قليلة المخزون"
          value={counted.length ? num.format(low.length) : "—"}
          note={counted.length ? `من ${num.format(counted.length)} منتج مسجّل كميته` : "ما سجّلت كميات بعد. سجّلها من المخزون."}
          icon={PackageX}
          tone={low.length ? "danger" : "warn"}
          onClick={() => onOpen("inventory")}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SalesChart orders={orders} className="xl:col-span-2" />
        <Panel title="الشحن" lead="حالة الطلبات التجريبية" actions={<Badge tone="blue">تجريبي</Badge>}>
          <ul className="space-y-4 p-5">
            {(["awaiting", "shipped", "delivered"] as const).map((stage) => {
              const value = orders.filter((order) => shipStage(order.status) === stage).length;
              const tone = SHIP_STAGE[stage].tone;
              return (
                <li key={stage}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{SHIP_STAGE[stage].label}</span>
                    <span className="font-semibold tabular-nums">{num.format(value)}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-(--a-surface-2)">
                    <div
                      className={cn("h-full rounded-full", tone === "warn" ? "bg-(--a-warn)" : tone === "blue" ? "bg-(--a-blue)" : "bg-(--a-ok)")}
                      style={{ width: `${orders.length ? (value / orders.length) * 100 : 0}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-(--a-line) p-4">
            <Button icon={Truck} onClick={() => onOpen("shipping")} className="w-full">
              إعدادات الشحن
            </Button>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="آخر الطلبات"
          lead="طلبات نموذجية لعرض شكل الجدول"
          actions={
            <Button onClick={() => onOpen("orders")} className="h-9 px-3">
              كل الطلبات
              <ArrowLeft className="size-4" />
            </Button>
          }
        >
          <OrdersTable orders={orders.slice(0, 5)} onView={setViewing} compact />
        </Panel>

        <Panel title="يحتاج انتباهك" lead="من محتوى المتجر الحقيقي">
          <ul className="divide-y divide-(--a-line)">
            <AttentionRow icon={Package} label="منتجات مخفية" value={hiddenProducts} onClick={() => onOpen("products")} />
            <AttentionRow icon={Package} label="منتجات في الأرشيف" value={archivedProducts} onClick={() => onOpen("products")} />
            <AttentionRow icon={LayoutGrid} label="تصنيفات مخفية" value={hiddenCategories} onClick={() => onOpen("departments")} />
            <AttentionRow icon={Images} label="شرائح بانر موقوفة" value={slidesOff} onClick={() => onOpen("content")} />
            <AttentionRow icon={LayoutGrid} label="أقسام رئيسية موقوفة" value={sectionsOff} onClick={() => onOpen("content")} />
            <AttentionRow icon={Percent} label="عروض بدون خصم ظاهر" value={noDiscount} onClick={() => onOpen("offers")} />
          </ul>
        </Panel>
      </div>

      <section>
        <h2 className="text-base font-semibold">اختصارات</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Shortcut icon={Package} label="المنتجات" onClick={() => onOpen("products")} />
          <Shortcut icon={Boxes} label="المخزون" onClick={() => onOpen("inventory")} />
          <Shortcut icon={Images} label="المحتوى والوسائط" onClick={() => onOpen("content")} />
          <Shortcut icon={Truck} label="الشحن والتوصيل" onClick={() => onOpen("shipping")} />
          <Shortcut icon={CreditCard} label="المدفوعات" onClick={() => onOpen("payments")} />
          <Link href="/ar" className={shortcutClass}>
            <ShortcutBody icon={Store} label="معاينة المتجر" />
          </Link>
        </div>
        <p className="mt-3 text-xs text-(--a-muted)">{num.format(featuredDepartments(content.categoryHidden).length)} تصنيف ظاهر في الصفحة الرئيسية الآن.</p>
      </section>

      <OrderDrawer order={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}

function SalesChart({ orders, className }: { orders: Order[]; className?: string }) {
  const latest = orders.reduce((max, order) => (order.date > max ? order.date : max), orders[0]?.date ?? "");
  const end = latest ? new Date(`${latest}T00:00:00`) : new Date();
  const days = Array.from({ length: DAYS }, (_, index) => {
    const day = new Date(end);
    day.setDate(end.getDate() - (DAYS - 1 - index));
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    const total = orders.filter((order) => order.date === key && order.status !== "cancelled").reduce((sum, order) => sum + order.total, 0);
    return { key, label: day.toLocaleDateString("ar-SA", { weekday: "short" }), date: day.toLocaleDateString("ar-SA", { day: "numeric", month: "short" }), total };
  });
  const peak = Math.max(...days.map((day) => day.total), 1);
  const sum = days.reduce((total, day) => total + day.total, 0);

  return (
    <Panel className={className} title="المبيعات" lead={`آخر ${num.format(DAYS)} أيام`} actions={<Badge tone="blue">تجريبي</Badge>}>
      <div className="p-5">
        <p className="text-2xl font-bold tabular-nums">{sar.format(sum)}</p>
        <p className="text-xs text-(--a-muted)">إجمالي الفترة بدون الطلبات الملغية</p>
        <div className="mt-6 grid h-40 grid-cols-7 items-end gap-2 sm:gap-4" role="img" aria-label="مبيعات آخر سبعة أيام">
          {days.map((day) => (
            <div key={day.key} className="group flex h-full flex-col items-center justify-end gap-2">
              <span className="text-[11px] whitespace-nowrap text-(--a-muted) tabular-nums opacity-0 transition group-hover:opacity-100">{day.total ? sar.format(day.total) : "٠"}</span>
              <div
                className={cn("w-full max-w-10 rounded-t-lg transition-colors", day.total ? "bg-(--a-accent)/80 group-hover:bg-(--a-accent)" : "bg-(--a-surface-2)")}
                style={{ height: `${Math.max((day.total / peak) * 100, 3)}%` }}
                title={`${day.date}: ${sar.format(day.total)}`}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-2 border-t border-(--a-line) pt-2 text-center text-[11px] text-(--a-muted) sm:gap-4">
          {days.map((day) => (
            <span key={day.key}>
              <span className="block">{day.label}</span>
              <span className="block tabular-nums">{day.date}</span>
            </span>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function AttentionRow({ icon: Icon, label, value, onClick }: { icon: IconType; label: string; value: number; onClick: () => void }) {
  const clear = value === 0;
  return (
    <li>
      <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-5 py-3.5 text-start transition hover:bg-(--a-surface-2)/60">
        <span className={cn("grid size-9 place-items-center rounded-lg", clear ? "bg-(--a-ok-soft) text-(--a-ok)" : "bg-(--a-warn-soft) text-(--a-warn)")}>
          {clear ? <CheckCircle2 className="size-4" /> : value > 2 ? <AlertTriangle className="size-4" /> : <Icon className="size-4" />}
        </span>
        <span className="flex-1 text-sm">{label}</span>
        <span className={cn("min-w-7 rounded-full px-2 py-0.5 text-center text-xs font-semibold tabular-nums", clear ? "text-(--a-muted)" : "bg-(--a-warn-soft) text-(--a-warn)")}>{num.format(value)}</span>
        <ArrowLeft className="size-4 text-(--a-muted)" />
      </button>
    </li>
  );
}

const shortcutClass =
  "flex flex-col items-center gap-2.5 rounded-2xl border border-(--a-line) bg-(--a-surface) px-3 py-4 text-center text-sm font-medium transition duration-200 hover:-translate-y-0.5 hover:border-(--a-accent)/40 hover:shadow-(--a-shadow)";

function Shortcut({ icon, label, onClick }: { icon: IconType; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={shortcutClass}>
      <ShortcutBody icon={icon} label={label} />
    </button>
  );
}

function ShortcutBody({ icon: Icon, label }: { icon: IconType; label: string }) {
  return (
    <>
      <span className="grid size-10 place-items-center rounded-xl bg-(--a-accent-soft) text-(--a-accent-ink)">
        <Icon className="size-5" />
      </span>
      {label}
    </>
  );
}
