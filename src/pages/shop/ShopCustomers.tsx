import { useEffect, useMemo, useState } from "react";
import { UserCheck, Users, Wallet } from "lucide-react";
import { ProductArt } from "@/components/site/card-art";
import { useSiteContent } from "@/lib/site-content";
import { onHashMove, pushHash, readHash } from "../admin/nav";
import { useOps } from "../admin/ops";
import type { Order } from "../admin/orders";
import { AR_DATE, Badge, Empty, num, PageHead, Pager, Panel, rowOpen, SearchBox, sar, StatCard, usePager } from "../admin/ui";

type Customer = { key: string; name: string; phone: string; email: string; city: string; account: boolean; orders: Order[]; spent: number; last: string };

const date = (value: string | null | undefined) => (value ? new Date(`${value}T00:00:00`).toLocaleDateString(AR_DATE, { day: "numeric", month: "short", year: "numeric" }) : "—");
const STATUS_LABEL: Record<string, string> = { new: "جديد", processing: "قيد التجهيز", shipped: "تم الشحن", delivered: "تم التسليم", cancelled: "ملغي" };

/** Opens a customer on its own page (#customers/customer-<key>), like the admin dashboard. */
const openCustomer = (key: string) => pushHash("customers", `customer-${key}`);

/** The people who ordered this shop's products, built from the shop's own orders (the pages see only those orders). */
function useCustomers() {
  const { orders } = useOps();
  return useMemo(() => {
    const map = new Map<string, Customer>();
    for (const order of orders) {
      // The phone identifies a customer across orders; orders without one fall back to the name.
      const key = (order.phone ?? "").trim() || order.customer.trim();
      const row = map.get(key) ?? { key, name: order.customer, phone: order.phone ?? "", email: order.email ?? "", city: order.city, account: Boolean(order.account), orders: [], spent: 0, last: "" };
      row.orders.push(order);
      if (order.status !== "cancelled") row.spent += order.total;
      if (order.date > row.last) row.last = order.date;
      map.set(key, row);
    }
    return [...map.values()].sort((a, b) => b.last.localeCompare(a.last));
  }, [orders]);
}

export function ShopCustomers() {
  const [sub, setSub] = useState(() => readHash().sub);
  useEffect(() => onHashMove(() => setSub(readHash().sub)), []);
  return sub?.startsWith("customer-") ? <CustomerPage customerKey={sub.slice(9)} /> : <CustomersList />;
}

function CustomersList() {
  const customers = useCustomers();
  const [query, setQuery] = useState("");

  const needle = query.trim().toLowerCase();
  const rows = customers.filter((row) => !needle || [row.name, row.phone, row.email].some((text) => text.toLowerCase().includes(needle)));
  const pager = usePager(rows, query);
  const repeat = customers.filter((row) => row.orders.length > 1).length;
  const spent = customers.reduce((sum, row) => sum + row.spent, 0);

  return (
    <div className="space-y-6">
      <PageHead title="العملاء" lead="العملاء اللي طلبوا من منتجات محلك." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="عملاء محلك" value={num.format(customers.length)} note="طلبوا منتجات من محلك" icon={Users} tone="blue" />
        <StatCard label="عملاء كرروا الطلب" value={num.format(repeat)} note="أكثر من طلب" icon={UserCheck} tone="ok" />
        <StatCard label="مشترياتهم" value={sar.format(spent)} note="بدون الطلبات الملغية" icon={Wallet} tone="blue" />
      </div>
      <Panel>
        <div className="border-b border-(--a-line) p-4">
          <SearchBox value={query} onChange={setQuery} placeholder="ابحث بالاسم أو الجوال أو الإيميل" />
        </div>
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-xs text-(--a-muted)">
                <tr>
                  <th className="px-5 py-3 text-start font-medium">العميل</th>
                  <th className="px-3 py-3 text-start font-medium">التواصل</th>
                  <th className="px-3 py-3 text-start font-medium">الطلبات</th>
                  <th className="px-3 py-3 text-start font-medium">المشتريات</th>
                  <th className="px-3 py-3 text-start font-medium">آخر طلب</th>
                </tr>
              </thead>
              <tbody>
                {pager.rows.map((row) => (
                  <tr key={row.key} {...rowOpen(() => openCustomer(row.key))} className="cursor-pointer border-t border-(--a-line) transition-colors hover:bg-(--a-surface-2)/40">
                    <td className="px-5 py-3">
                      <span className="block font-medium">{row.name}</span>
                      <span className="block text-xs text-(--a-muted)">{row.city}</span>
                    </td>
                    <td className="px-3 py-3" dir="ltr">
                      <span className="block text-end">{row.phone || "—"}</span>
                      <span className="block text-end text-xs text-(--a-muted)">{row.email}</span>
                    </td>
                    <td className="px-3 py-3 tabular-nums">{num.format(row.orders.length)}</td>
                    <td className="px-3 py-3 tabular-nums">{sar.format(row.spent)}</td>
                    <td className="px-3 py-3 text-(--a-muted)">{date(row.last)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty icon={Users} title={query ? "ما فيه نتائج" : "ما فيه عملاء بعد"} lead={query ? "جرّب كلمة بحث ثانية." : "يظهر هنا كل عميل يطلب منتجات من محلك."} />
        )}
        <Pager pager={pager} />
      </Panel>
    </div>
  );
}

function CustomerPage({ customerKey }: { customerKey: string }) {
  const customers = useCustomers();
  const { content } = useSiteContent();
  const customer = customers.find((row) => row.key === customerKey);

  if (!customer) {
    return (
      <div className="space-y-6">
        <PageHead title="العميل" />
        <Panel>
          <Empty icon={Users} title="ما لقينا هذا العميل" lead="ما عنده طلبات من منتجات محلك، أو الرابط غلط." />
        </Panel>
      </div>
    );
  }

  const addresses = [...new Set(customer.orders.map((order) => [order.city, order.address].filter(Boolean).join("، ")).filter(Boolean))];
  const first = customer.orders.reduce((min, order) => (!min || order.date < min ? order.date : min), "");
  const nameOf = (productId: string) => content.products.find((item) => item.id === productId)?.nameAr ?? productId;
  // Only the lines that belong to this shop: the pages see only this shop's products.
  const mine = new Set(content.products.map((item) => item.id));

  return (
    <div className="space-y-6">
      <PageHead title={customer.name} lead={`عميل من ${date(first)}`} />
      <Panel className="p-5">
        <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
          <span className="grid size-14 place-items-center rounded-full bg-(--a-surface-2) text-lg text-(--a-muted)">{customer.name.slice(0, 1)}</span>
          <dl className="flex min-w-0 flex-1 flex-wrap gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-(--a-muted)">الجوال</dt>
              <dd dir="ltr" className="mt-0.5 text-end font-medium">
                {customer.phone || "—"}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-(--a-muted)">الإيميل</dt>
              <dd dir="ltr" className="mt-0.5 truncate text-end font-medium">
                {customer.email || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-(--a-muted)">نوع الحساب</dt>
              <dd className="mt-0.5 font-medium">{customer.account ? "عميل مسجّل" : "طلب بدون حساب"}</dd>
            </div>
            <div className="min-w-0 basis-full">
              <dt className="text-xs text-(--a-muted)">العناوين ({num.format(addresses.length)})</dt>
              <dd className="mt-0.5 font-medium">
                {addresses.length ? addresses.map((line) => <span key={line} className="mt-1 block">{line}</span>) : <span className="font-normal text-(--a-muted)">ما فيه عناوين مسجّلة</span>}
              </dd>
            </div>
          </dl>
          <div className="flex gap-3 text-center">
            <div className="min-w-28 rounded-xl bg-(--a-surface-2) px-4 py-2.5">
              <p className="text-xs text-(--a-muted)">عدد الطلبات</p>
              <p className="mt-0.5 text-lg font-bold tabular-nums">{num.format(customer.orders.length)}</p>
            </div>
            <div className="min-w-28 rounded-xl bg-(--a-surface-2) px-4 py-2.5">
              <p className="text-xs text-(--a-muted)">إجمالي المشتريات</p>
              <p className="mt-0.5 text-lg font-bold tabular-nums">{sar.format(customer.spent)}</p>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title={`الطلبات (${num.format(customer.orders.length)})`} lead="طلبات العميل اللي فيها منتجات من محلك">
        <ul className="divide-y divide-(--a-line)">
          {customer.orders.map((order) => {
            const all = order.lines?.length ? order.lines : [{ id: order.productId, name: nameOf(order.productId), qty: order.items, price: order.items ? order.total / order.items : order.total }];
            const lines = all.filter((line) => mine.has(line.id));
            return (
              <li key={order.id} className="grid items-center gap-x-6 gap-y-3 px-5 py-4 md:grid-cols-[9rem_minmax(0,1fr)_7rem_7rem]">
                <button type="button" onClick={() => pushHash("orders", `order-${order.id}`)} className="text-start font-semibold hover:underline">
                  <span dir="ltr">#{order.id}</span>
                  <span className="block text-xs font-normal text-(--a-muted)">{date(order.date)}</span>
                </button>
                <ul className="space-y-2">
                  {lines.map((line) => (
                    <li key={line.id} className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-(--a-surface-2)">
                        <ProductArt id={line.id} className="size-8" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 font-medium">{line.name}</span>
                        <span className="text-xs text-(--a-muted)">
                          {num.format(line.qty)} × {sar.format(line.price)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
                <span>
                  <Badge tone={order.status === "cancelled" ? "danger" : order.status === "delivered" ? "ok" : "blue"}>{STATUS_LABEL[order.status]}</Badge>
                </span>
                <span className="font-semibold tabular-nums md:text-end">{sar.format(order.total)}</span>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}
