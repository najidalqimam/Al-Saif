import { useEffect, useRef, useState } from "react";
import { ArchiveRestore, Check, ChevronDown, Inbox, Save, Trash2, X } from "lucide-react";
import { ProductArt } from "@/components/site/card-art";
import { useSiteContent } from "@/lib/site-content";
import { cn } from "@/lib/utils";
import { PAYMENT_LABELS, PAYMENT_STATUS, SHIP_STAGE, shipStage, useOps, type ShipStage } from "./ops";
import { onHashMove, pushHash, readHash, registerLeaveGuard } from "./nav";
import { ORDER_STATUS, type Order, type OrderStatus, type PaymentStatus } from "./orders";
import { AR_DATE, Badge, Button, Confirm, Drawer, Empty, IconButton, PageHead, Panel, SearchBox, Select, Pager, Tabs, num, rowOpen, sar, usePager } from "./ui";

export const shortDate = (date: string) => new Date(date).toLocaleDateString(AR_DATE, { day: "numeric", month: "short" });

const STATUS_TONE = {
  accent: "bg-(--a-blue-soft) text-(--a-blue)",
  blue: "bg-(--a-blue-soft) text-(--a-blue)",
  ok: "bg-(--a-ok-soft) text-(--a-ok)",
  warn: "bg-(--a-warn-soft) text-(--a-warn)",
  danger: "bg-(--a-danger-soft) text-(--a-danger)",
};

/** The order status as a coloured pill that is also a dropdown, so the status changes straight from the list. */
function StatusSelect({ order, onChange }: { order: Order; onChange: (status: OrderStatus) => void }) {
  const status = ORDER_STATUS[order.status];
  return (
    <span className={cn("relative inline-flex items-center rounded-full text-xs font-medium", STATUS_TONE[status.tone])}>
      <span className="pointer-events-none absolute start-2.5 size-1.5 rounded-full bg-current" />
      <select
        value={order.status}
        aria-label={`حالة الطلب ${order.id}`}
        onChange={(event) => onChange(event.target.value as OrderStatus)}
        className="h-7 cursor-pointer appearance-none rounded-full bg-transparent ps-6 pe-7 font-medium outline-none focus-visible:ring-2 focus-visible:ring-(--a-blue)/40"
      >
        {(Object.keys(ORDER_STATUS) as OrderStatus[]).map((id) => (
          <option key={id} value={id}>
            {ORDER_STATUS[id].label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute end-2 size-3.5" />
    </span>
  );
}

export function OrdersTable({ orders, onView, compact, archived }: { orders: Order[]; onView: (order: Order) => void; compact?: boolean; archived?: boolean }) {
  const { content } = useSiteContent();
  const { ops, archiveOrder, canArchiveOrders, updateOrder } = useOps();
  const [archiving, setArchiving] = useState<Order | null>(null);
  const pager = usePager(orders, `${orders.length}|${archived ? "a" : ""}`);
  const nameOf = (id: string) => content.products.find((item) => item.id === id)?.nameAr ?? id;
  const methodOf = (id: string) => ops.shipping.find((item) => item.id === id)?.nameAr ?? "—";
  const head = "px-4 py-2.5 text-start text-xs font-medium whitespace-nowrap text-(--a-muted) first:ps-5 last:pe-5";
  const cell = "px-4 py-2.5 first:ps-5 last:pe-5";

  return (
    <>
    <div className="relative overflow-x-auto">
      <table className={compact ? "w-full min-w-[680px] text-sm" : "w-full min-w-[920px] text-sm"}>
        <thead className="bg-(--a-surface-2)/50">
          <tr>
            <th className={head}>الطلب</th>
            <th className={head}>العميل</th>
            <th className={head}>المنتج</th>
            <th className={head}>المبلغ</th>
            {compact ? null : <th className={head}>الدفع</th>}
            {compact ? null : <th className={head}>الشحن</th>}
            <th className={head}>الحالة</th>
            <th className={head}>
              <span className="sr-only">إجراءات</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {pager.rows.map((order) => {
            const status = ORDER_STATUS[order.status];
            const payment = PAYMENT_STATUS[order.paymentStatus];
            const open = rowOpen(() => onView(order));
            return (
              <tr key={order.id} onClick={open.onClick} className={`${open.className} border-t border-(--a-line) transition-colors hover:bg-(--a-surface-2)/40`}>
                <td className={cell}>
                  <p className="font-semibold tabular-nums">
                    <bdi dir="ltr">#{order.id}</bdi>
                  </p>
                  <p className="text-xs text-(--a-muted)">{shortDate(order.date)}</p>
                  {order.source === "store" ? (
                    <span className="mt-1 flex flex-wrap gap-1">
                      <Badge tone="ok">من المتجر</Badge>
                    </span>
                  ) : null}
                </td>
                <td className={cell}>
                  <p className="font-medium whitespace-nowrap">{order.customer}</p>
                  <p className="text-xs text-(--a-muted)">{order.city}</p>
                </td>
                <td className={cell}>
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-(--a-surface-2)">
                      <ProductArt id={order.productId} className="size-7" />
                    </span>
                    <span className="line-clamp-1">
                      {nameOf(order.productId)}
                      {order.lines && order.lines.length > 1 ? (
                        <span className="text-(--a-muted)"> +{num.format(order.lines.length - 1)}</span>
                      ) : order.items > 1 ? (
                        <span className="text-(--a-muted)"> ×{num.format(order.items)}</span>
                      ) : null}
                    </span>
                  </div>
                </td>
                <td className={`${cell} font-medium whitespace-nowrap tabular-nums`}>{sar.format(order.total)}</td>
                {compact ? null : (
                  <td className={cell}>
                    <p className="text-xs whitespace-nowrap text-(--a-muted)">{PAYMENT_LABELS[order.paymentMethod].ar}</p>
                    <span className="mt-1 inline-block">
                      <Badge tone={payment.tone}>{payment.label}</Badge>
                    </span>
                  </td>
                )}
                {compact ? null : <td className={`${cell} whitespace-nowrap`}>{methodOf(order.shippingMethod)}</td>}
                <td className={cell} onClick={(event) => event.stopPropagation()}>
                  {archived ? (
                    <Badge tone={status.tone}>
                      <span className="size-1.5 rounded-full bg-current" />
                      {status.label}
                    </Badge>
                  ) : (
                    <StatusSelect order={order} onChange={(next) => updateOrder(order.id, { status: next })} />
                  )}
                </td>
                <td className={`${cell} text-end`}>
                  {archived ? (
                    <IconButton icon={ArchiveRestore} label={`استرجاع الطلب ${order.id}`} onClick={() => archiveOrder(order.id, false)} />
                  ) : (
                    <IconButton
                      icon={Trash2}
                      tone="danger"
                      label={canArchiveOrders ? `حذف الطلب ${order.id}` : "حذف الطلبات غير متاح أثناء الاتصال بقاعدة البيانات"}
                      disabled={!canArchiveOrders}
                      onClick={() => setArchiving(order)}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Confirm
        open={archiving !== null}
        onClose={() => setArchiving(null)}
        onConfirm={() => archiving && archiveOrder(archiving.id, true)}
        title={`حذف الطلب #${archiving?.id ?? ""}؟`}
        lead="الطلب يختفي من قوائم الطلبات والمدفوعات والشحن والنظرة العامة، وينتقل لتبويب الأرشيف في صفحة الطلبات. بياناته تبقى محفوظة وتقدر تسترجعه في أي وقت. الأرشفة على هذا المتصفح فقط."
        action="نقل للأرشيف"
      />
    </div>
    <Pager pager={pager} />
    </>
  );
}

/** Opens an order on its own page (#orders/order-<id>). */
export const openOrder = (order: Order) => pushHash("orders", `order-${order.id}`);

function orderLead(current: Order) {
  return current.source === "store"
    ? "طلب من المتجر. تغيير الحالة يتحفظ ويظهر للعميل في حسابه وصفحة التتبع."
    : "طلب تجريبي. التعديلات تتحفظ على هذا الجهاز فقط وما توصل للعميل.";
}

/** The order's lines, customer details and status editors; shared by the order page and the shop's drawer. */
type OrderFields = Pick<Order, "status" | "paymentStatus" | "shippingMethod">;

/** With `draft` + `onDraft` the editors only change the draft (the order page saves it); without them they save at once. */
function OrderDetail({ current, draft, onDraft }: { current: Order; draft?: OrderFields; onDraft?: (patch: Partial<OrderFields>) => void }) {
  const { content } = useSiteContent();
  const { ops, updateOrder } = useOps();
  const shown: OrderFields = draft ?? current;
  const change = (patch: Partial<OrderFields>) => (onDraft ? onDraft(patch) : updateOrder(current.id, patch));
  const product = content.products.find((item) => item.id === current.productId);
  const zone = ops.zones.find((item) => item.id === current.zone);
  return (
        <div className="space-y-5">
          {current.lines?.length ? (
            <div className="rounded-2xl border border-(--a-line)">
              <ul className="divide-y divide-(--a-line)">
                {current.lines.map((line) => (
                  <li key={line.id} className="flex items-center gap-3 p-3">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-(--a-surface-2)">
                      <ProductArt id={line.id} className="size-10" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold">{line.name}</p>
                      <p className="text-xs text-(--a-muted)">
                        {num.format(line.qty)} × {sar.format(line.price)}
                      </p>
                    </div>
                    <p className="font-semibold tabular-nums">{sar.format(line.qty * line.price)}</p>
                  </li>
                ))}
              </ul>
              <dl className="space-y-1.5 border-t border-(--a-line) p-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-(--a-muted)">المنتجات</dt>
                  <dd className="tabular-nums">{sar.format(current.subtotal ?? current.total)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-(--a-muted)">الشحن</dt>
                  <dd className="tabular-nums">{current.shippingFee ? sar.format(current.shippingFee) : "مجاني"}</dd>
                </div>
                {current.paymentFee ? (
                  <div className="flex justify-between">
                    <dt className="text-(--a-muted)">رسوم الدفع</dt>
                    <dd className="tabular-nums">{sar.format(current.paymentFee)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-(--a-line) pt-2 text-base font-bold">
                  <dt>الإجمالي</dt>
                  <dd className="tabular-nums">{sar.format(current.total)}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="flex items-center gap-4 rounded-2xl border border-(--a-line) p-4">
              <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-(--a-surface-2)">
                <ProductArt id={current.productId} className="size-12" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{product?.nameAr ?? current.productId}</p>
                <p className="text-sm text-(--a-muted)">الكمية {num.format(current.items)}</p>
              </div>
              <p className="text-lg font-bold tabular-nums">{sar.format(current.total)}</p>
            </div>
          )}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl bg-(--a-surface-2)/60 p-4 text-sm">
            <dt className="text-(--a-muted)">العميل</dt>
            <dd className="font-medium">
              {current.customer}
            </dd>
            <dt className="text-(--a-muted)">المدينة</dt>
            <dd>
              {current.city} · {zone?.nameAr ?? "—"}
            </dd>
            <dt className="text-(--a-muted)">التاريخ</dt>
            <dd>{shortDate(current.date)}</dd>
            <dt className="text-(--a-muted)">طريقة الدفع</dt>
            <dd>{PAYMENT_LABELS[current.paymentMethod].ar}</dd>
            {current.phone ? (
              <>
                <dt className="text-(--a-muted)">الجوال</dt>
                <dd dir="ltr" className="text-end tabular-nums">
                  {current.phone}
                </dd>
              </>
            ) : null}
            {current.email ? (
              <>
                <dt className="text-(--a-muted)">البريد</dt>
                <dd dir="ltr" className="truncate text-end">
                  {current.email}
                </dd>
              </>
            ) : null}
            {current.address ? (
              <>
                <dt className="text-(--a-muted)">العنوان</dt>
                <dd>{current.address}</dd>
              </>
            ) : null}
            {current.notes ? (
              <>
                <dt className="text-(--a-muted)">ملاحظات</dt>
                <dd>{current.notes}</dd>
              </>
            ) : null}
          </dl>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select<OrderStatus>
              label="حالة الطلب"
              value={shown.status}
              onChange={(status) => change({ status })}
              options={(Object.keys(ORDER_STATUS) as OrderStatus[]).map((id) => [id, ORDER_STATUS[id].label])}
            />
            <Select<PaymentStatus>
              label="حالة الدفع"
              value={shown.paymentStatus}
              onChange={(paymentStatus) => change({ paymentStatus })}
              options={(Object.keys(PAYMENT_STATUS) as PaymentStatus[]).map((id) => [id, PAYMENT_STATUS[id].label])}
            />
            <div className="sm:col-span-2">
              <Select
                label="طريقة الشحن"
                value={shown.shippingMethod}
                onChange={(shippingMethod) => change({ shippingMethod })}
                options={ops.shipping.map((item) => [item.id, item.enabled ? item.nameAr : `${item.nameAr} (موقوفة)`])}
              />
            </div>
          </div>
          <p className="text-xs leading-6 text-(--a-muted)">بوليصة الشحن ورقم التتبع يتفعّلون بعد ربط شركة شحن. حاليًا ما فيه ربط مع أي مزود.</p>
        </div>
  );
}

/** Order details in a drawer (used by the shop dashboard). */
export function OrderDrawer({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const { orders } = useOps();
  const current = order ? (orders.find((item) => item.id === order.id) ?? order) : null;
  return (
    <Drawer
      open={current !== null}
      onClose={onClose}
      title={current ? `الطلب #${current.id}` : ""}
      lead={current ? orderLead(current) : undefined}
      footer={
        <Button variant="primary" onClick={onClose}>
          تم
        </Button>
      }
    >
      {current ? <OrderDetail current={current} /> : null}
    </Drawer>
  );
}

/** One order on its own page, opened from any orders table. Edits stay as a draft until Save. */
function OrderPage({ id }: { id: string }) {
  const { orders, archivedOrders, updateOrder } = useOps();
  const current = [...orders, ...archivedOrders].find((item) => item.id === id) ?? null;
  const [draft, setDraft] = useState<OrderFields | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const base: OrderFields | null = current ? { status: current.status, paymentStatus: current.paymentStatus, shippingMethod: current.shippingMethod } : null;
  const values = draft ?? base;
  const dirty = !!(draft && base && (draft.status !== base.status || draft.paymentStatus !== base.paymentStatus || draft.shippingMethod !== base.shippingMethod));
  const unsaved = useRef(false);
  unsaved.current = dirty;
  const saveRef = useRef(() => {});
  useEffect(() => registerLeaveGuard(() => unsaved.current, { save: () => saveRef.current(), anySub: true }), []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function save() {
    if (!current || !draft || !dirty) return;
    const patch: Partial<OrderFields> = {};
    if (draft.status !== current.status) patch.status = draft.status;
    if (draft.paymentStatus !== current.paymentStatus) patch.paymentStatus = draft.paymentStatus;
    if (draft.shippingMethod !== current.shippingMethod) patch.shippingMethod = draft.shippingMethod;
    updateOrder(current.id, patch);
    setDraft(null);
    setJustSaved(true);
  }

  saveRef.current = save;

  return (
    <div className="space-y-6">
      <PageHead
        title={`الطلب #${id}`}
        lead={dirty ? "فيه تعديلات غير محفوظة. اضغط حفظ عشان تتسجل." : current ? orderLead(current) : undefined}
        actions={
          current ? (
            <Button variant="primary" icon={justSaved && !dirty ? Check : Save} onClick={save} disabled={!dirty}>
              {justSaved && !dirty ? "تم الحفظ" : "حفظ"}
            </Button>
          ) : null
        }
      />
      {current && values ? (
        <Panel className="max-w-3xl p-5">
          <OrderDetail
            current={current}
            draft={values}
            onDraft={(patch) => {
              setJustSaved(false);
              setDraft({ ...values, ...patch });
            }}
          />
        </Panel>
      ) : (
        <Panel>
          <Empty icon={Inbox} title="ما لقينا هذا الطلب" lead="يمكن انحذف أو الرقم غلط. ارجع لقائمة الطلبات." />
        </Panel>
      )}
    </div>
  );
}

type ShipFilter = "all" | ShipStage | "archived";

export function Orders({ initialShip = "all" }: { initialShip?: ShipFilter }) {
  const [sub, setSub] = useState(() => readHash().sub);
  useEffect(() => onHashMove(() => setSub(readHash().sub)), []);
  const orderId = sub?.startsWith("order-") ? sub.slice(6) : null;
  if (orderId) return <OrderPage id={orderId} />;
  return <OrdersList initialShip={initialShip} />;
}

function OrdersList({ initialShip }: { initialShip: ShipFilter }) {
  const { orders, archivedOrders, canArchiveOrders, ops } = useOps();
  const [ship, setShip] = useState<ShipFilter>(initialShip);
  const [payMethod, setPayMethod] = useState<"all" | Order["paymentMethod"]>("all");
  const [payStatus, setPayStatus] = useState<"all" | PaymentStatus>("all");
  const [method, setMethod] = useState("all");
  const [query, setQuery] = useState("");
  // "New orders" from the overview's quick actions arrives as #orders/new.
  const [onlyNew, setOnlyNew] = useState(() => readHash().view === "orders" && readHash().sub === "new");

  const count = (stage: ShipStage) => orders.filter((order) => shipStage(order.status) === stage).length;
  const needle = query.trim();
  const inArchive = ship === "archived";
  const rows = (inArchive ? archivedOrders : orders).filter((order) => {
    if (onlyNew && order.status !== "new") return false;
    if (!inArchive && ship !== "all" && shipStage(order.status) !== ship) return false;
    if (payMethod !== "all" && order.paymentMethod !== payMethod) return false;
    if (payStatus !== "all" && order.paymentStatus !== payStatus) return false;
    if (method !== "all" && order.shippingMethod !== method) return false;
    if (needle && ![order.id, order.customer, order.city].some((text) => text.includes(needle))) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHead title="الطلبات" lead="حالة كل طلب وطريقة دفعه وشحنه. «من المتجر» = طلب من صفحة إتمام الطلب." />
      {onlyNew ? (
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-(--a-muted)">عرض:</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-(--a-blue)/40 bg-(--a-blue-soft) py-1 ps-3 pe-1 font-medium text-(--a-blue)">
            الطلبات الجديدة فقط
            <button type="button" onClick={() => setOnlyNew(false)} aria-label="عرض كل الطلبات" className="grid size-6 place-items-center rounded-full hover:bg-(--a-blue-soft)">
              <X className="size-3.5" />
            </button>
          </span>
        </p>
      ) : null}

      <div className="space-y-3">
        <Tabs
          value={ship}
          onChange={setShip}
          items={[
            ["all", "الكل", orders.length],
            ["awaiting", SHIP_STAGE.awaiting.label, count("awaiting")],
            ["shipped", SHIP_STAGE.shipped.label, count("shipped")],
            ["delivered", SHIP_STAGE.delivered.label, count("delivered")],
            ["cancelled", SHIP_STAGE.cancelled.label, count("cancelled")],
            ...(canArchiveOrders ? ([["archived", "الأرشيف", archivedOrders.length]] as Array<[ShipFilter, string, number]>) : []),
          ]}
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          <SearchBox value={query} onChange={setQuery} placeholder="ابحث برقم الطلب أو اسم العميل" />
          <Select
            label="طريقة الدفع"
            hideLabel
            value={payMethod}
            onChange={setPayMethod}
            options={[
              ["all", "كل طرق الدفع"],
              ["cod", PAYMENT_LABELS.cod.ar],
              ["bank", PAYMENT_LABELS.bank.ar],
            ]}
          />
          <Select<"all" | PaymentStatus>
            label="حالة الدفع"
            hideLabel
            value={payStatus}
            onChange={setPayStatus}
            options={[["all", "كل حالات الدفع"], ...(Object.keys(PAYMENT_STATUS) as PaymentStatus[]).map((id): [PaymentStatus, string] => [id, PAYMENT_STATUS[id].label])]}
          />
          <Select label="طريقة الشحن" hideLabel value={method} onChange={setMethod} options={[["all", "كل طرق الشحن"], ...ops.shipping.map((item): [string, string] => [item.id, item.nameAr])]} />
        </div>
      </div>

      <Panel>
        {rows.length ? (
          <OrdersTable orders={rows} onView={openOrder} archived={inArchive} />
        ) : (
          <Empty icon={Inbox} title={inArchive ? "الأرشيف فاضي" : "ما فيه طلبات بهذي الفلاتر"} lead={inArchive ? "الطلبات اللي تحذفها من القائمة تنتقل هنا وتقدر تسترجعها." : "غيّر الفلتر أو امسح البحث لعرض كل الطلبات."} />
        )}
      </Panel>

    </div>
  );
}
