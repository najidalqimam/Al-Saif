import { useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, ArrowLeft, Boxes, CheckCircle2, CreditCard, ExternalLink, FolderPlus, LayoutTemplate, Package, PackageX, Percent, Plus, ShoppingCart, Truck, Wallet } from "lucide-react";
import { featuredDepartments } from "@/lib/catalog";
import { useSiteContent } from "@/lib/site-content";
import { cn } from "@/lib/utils";
import { OrderDrawer, OrdersTable } from "./OrdersPage";
import { SHIP_STAGE, shipStage, stockLevel, useOps } from "./ops";
import type { Order } from "./orders";
import { pushHash, type View } from "./nav";
import { AR_DATE, Button, PageHead, Panel, StatCard, num, sar, type IconType } from "./ui";

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

  const newOrders = orders.filter((order) => order.status === "new").length;
  const failedPayments = orders.filter((order) => order.paymentStatus === "failed").length;
  const outOfStock = counted.filter((item) => stockLevel(ops.stock[item.id], ops.lowStock) === "out").length;
  const noDiscount = live.filter((item) => item.onHome && item.compareAt <= item.price).length;
  const sectionsOn = content.homeOrder.filter((id) => (id.startsWith("custom-") ? !content.customSections.find((item) => item.id === id)?.hidden : !content.sectionHidden.includes(id as never))).length;
  // Only things that need someone to act; counts come straight from the orders, stock and offers data.
  const attention = [
    { key: "new", icon: ShoppingCart, label: "طلبات جديدة بانتظار التجهيز", value: newOrders, tone: "warn" as const, open: () => pushHash("orders", "new") },
    { key: "failed", icon: CreditCard, label: "طلبات فشل دفعها", value: failedPayments, tone: "danger" as const, open: () => onOpen("payments") },
    { key: "out", icon: PackageX, label: "منتجات نفدت من المخزون", value: outOfStock, tone: "danger" as const, open: () => onOpen("inventory") },
    { key: "low", icon: Boxes, label: "منتجات مخزونها منخفض", value: low.length - outOfStock, tone: "warn" as const, open: () => onOpen("inventory") },
    { key: "discount", icon: Percent, label: "منتجات في العروض بدون خصم ظاهر", value: noDiscount, tone: "warn" as const, open: () => onOpen("offers") },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6">
      <PageHead
        title="نظرة عامة"
        lead="ملخص الطلبات والمبيعات والمنتجات في صفحة واحدة."
        actions={
          <Link href="/ar" className="inline-flex h-10 items-center gap-2 rounded-xl border border-(--a-line) bg-(--a-surface) px-4 text-sm font-medium hover:bg-(--a-surface-2)">
            <ExternalLink className="size-4" />
            فتح المتجر
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="إجمالي المبيعات" value={sar.format(sales)} note={`من ${num.format(kept.length)} طلب غير ملغي`} icon={Wallet} tone="blue" onClick={() => onOpen("reports")} />
        <StatCard label="الطلبات" value={num.format(orders.length)} note={`${num.format(awaiting)} بانتظار الشحن`} icon={ShoppingCart} tone={awaiting ? "warn" : "blue"} onClick={() => onOpen("orders")} />
        <StatCard
          label="المنتجات المعروضة"
          value={`${num.format(live.length)} / ${num.format(content.products.length)}`}
          note={`${num.format(live.filter((item) => item.onHome).length)} في عروض الرئيسية`}
          icon={Package}
          tone="blue"
          onClick={() => onOpen("products")}
        />
        <StatCard
          label="منتجات قليلة المخزون"
          value={counted.length ? num.format(low.length) : "—"}
          note={counted.length ? `من ${num.format(counted.length)} منتج مسجّل كميته` : "ما سجّلت كميات بعد. سجّلها من المخزون."}
          icon={PackageX}
          tone={!counted.length ? "blue" : outOfStock ? "danger" : low.length ? "warn" : "ok"}
          onClick={() => onOpen("inventory")}
        />
      </div>

      <section>
        <h2 className="text-base font-semibold">إجراءات سريعة</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <QuickAction icon={Plus} label="إضافة منتج" onClick={() => pushHash("products", "all/add")} />
          <QuickAction icon={FolderPlus} label="إضافة قسم" onClick={() => pushHash("departments", "add")} />
          <QuickAction icon={ShoppingCart} label="الطلبات الجديدة" count={newOrders} onClick={() => pushHash("orders", "new")} />
          <QuickAction icon={LayoutTemplate} label="إضافة قسم للصفحة الرئيسية" onClick={() => pushHash("content", "add")} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <SalesChart orders={orders} className="xl:col-span-2" />
        <Panel title="الشحن" lead="الطلبات حسب حالة الشحن">
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
          lead="أحدث 5 طلبات"
          actions={
            <Button onClick={() => onOpen("orders")} className="h-9 px-3">
              كل الطلبات
              <ArrowLeft className="size-4" />
            </Button>
          }
        >
          <OrdersTable orders={orders.slice(0, 5)} onView={setViewing} compact />
        </Panel>

        <Panel title="يحتاج انتباهك" lead={`${num.format(sectionsOn)} قسم ظاهر في الصفحة الرئيسية · ${num.format(featuredDepartments(content.categoryHidden).length)} قسم في الشبكة`}>
          {attention.length ? (
            <ul className="divide-y divide-(--a-line)">
              {attention.map((item) => (
                <AttentionRow key={item.key} icon={item.icon} label={item.label} value={item.value} tone={item.tone} onClick={item.open} />
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-3 px-5 py-6 text-sm font-medium text-(--a-ok)">
              <span className="grid size-9 place-items-center rounded-lg bg-(--a-ok-soft)">
                <CheckCircle2 className="size-4" />
              </span>
              كل شيء تمام ✓
            </p>
          )}
        </Panel>
      </div>

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
    return { key, label: day.toLocaleDateString(AR_DATE, { weekday: "short" }), date: day.toLocaleDateString(AR_DATE, { day: "numeric", month: "short" }), total };
  });
  const peak = Math.max(...days.map((day) => day.total), 1);
  const sum = days.reduce((total, day) => total + day.total, 0);

  return (
    <Panel className={className} title="المبيعات" lead={`آخر ${num.format(DAYS)} أيام`}>
      <div className="p-5">
        <p className="text-2xl font-bold tabular-nums">{sar.format(sum)}</p>
        <p className="text-xs text-(--a-muted)">إجمالي الفترة بدون الطلبات الملغية</p>
        <div className="mt-6 grid h-40 grid-cols-7 items-end gap-2 sm:gap-4" role="img" aria-label="مبيعات آخر سبعة أيام">
          {days.map((day) => (
            <div key={day.key} className="group flex h-full flex-col items-center justify-end gap-2">
              <span className="text-[11px] whitespace-nowrap text-(--a-muted) tabular-nums opacity-0 transition group-hover:opacity-100">{day.total ? sar.format(day.total) : "0"}</span>
              <div
                className={cn("w-full max-w-10 rounded-t-lg transition-colors", day.total ? "bg-(--a-blue)/75 group-hover:bg-(--a-blue)" : "bg-(--a-surface-2)")}
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

function AttentionRow({ icon: Icon, label, value, tone, onClick }: { icon: IconType; label: string; value: number; tone: "warn" | "danger"; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-5 py-3 text-start transition hover:bg-(--a-surface-2)/60">
        <span className={cn("grid size-9 place-items-center rounded-lg", tone === "danger" ? "bg-(--a-danger-soft) text-(--a-danger)" : "bg-(--a-warn-soft) text-(--a-warn)")}>
          {tone === "danger" ? <AlertTriangle className="size-4" /> : <Icon className="size-4" />}
        </span>
        <span className="flex-1 text-sm">{label}</span>
        <span className={cn("min-w-7 rounded-full px-2 py-0.5 text-center text-xs font-semibold tabular-nums", tone === "danger" ? "bg-(--a-danger-soft) text-(--a-danger)" : "bg-(--a-warn-soft) text-(--a-warn)")}>
          {num.format(value)}
        </span>
        <ArrowLeft className="size-4 text-(--a-muted)" />
      </button>
    </li>
  );
}

/** A shortcut that starts a task (opens a form or a filtered list), not just another way to a sidebar page. */
function QuickAction({ icon: Icon, label, count, onClick }: { icon: IconType; label: string; count?: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl border border-(--a-line) bg-(--a-surface) px-4 py-3 text-start text-sm font-medium shadow-(--a-shadow) transition hover:border-(--a-blue)/40"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-(--a-blue-soft) text-(--a-blue)">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">{label}</span>
      {count !== undefined ? (
        <span className={cn("min-w-7 rounded-full px-2 py-0.5 text-center text-xs font-semibold tabular-nums", count ? "bg-(--a-warn-soft) text-(--a-warn)" : "bg-(--a-surface-2) text-(--a-muted)")}>
          {num.format(count)}
        </span>
      ) : null}
    </button>
  );
}
