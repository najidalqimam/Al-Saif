import { useEffect, useState } from "react";
import { ArchiveRestore, Mail, Package, RefreshCw, Store, Trash2, UserCheck, Users, UserX } from "lucide-react";
import { ProductArt } from "@/components/site/card-art";
import { PREVIEW, api, apiMessage } from "@/lib/api";
import { Avatar } from "@/lib/avatars";
import { useSiteContent } from "@/lib/site-content";
import { onHashMove, pushHash, readHash } from "./nav";
import { useOps } from "./ops";
import { AR_DATE, Badge, Button, Confirm, Empty, IconButton, num, PageHead, Pager, Panel, rowOpen, sar, Select, SearchBox, StatCard, usePager } from "./ui";

// Registered store accounts (customers who signed up on the storefront). Read-only: staff can look up a
// customer's details, saved addresses and orders, and send the welcome email again.

type WelcomeEmail = { status: "PENDING" | "SENDING" | "SENT" | "FAILED"; sentAt: string | null; attempts: number; lastError: string | null } | null;
type CustomerRow = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  avatar: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  orders: number;
  addresses: number;
  spent: string;
  lastOrderAt: string | null;
  welcomeEmail: WelcomeEmail;
};
type Detail = {
  customer: CustomerRow;
  addresses: Array<{ id: string; label: string; zoneName: string | null; city: string; line1: string; notes: string; isDefault: boolean }>;
  orders: Array<{ number: number; status: string; paymentStatus: string; paymentMethod: string; total: string; placedAt: string; lines: number }>;
};

const ORDER_STATUS_LABEL: Record<string, string> = { new: "جديد", processing: "قيد التجهيز", shipped: "تم الشحن", delivered: "تم التسليم", cancelled: "ملغي" };

// Archived customers are hidden from the list on this browser only and can be restored. The accounts themselves are not
// touched: the server has no archive yet, so the archive button is available only in the local preview.
const ARCHIVED_KEY = "alsaif-admin-archived-customers";
function readArchived(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(ARCHIVED_KEY) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

const date = (value: string | null) => (value ? new Date(value).toLocaleDateString(AR_DATE, { day: "numeric", month: "short", year: "numeric" }) : "—");

function WelcomeBadge({ email }: { email: WelcomeEmail }) {
  if (!email) return <Badge>—</Badge>;
  if (email.status === "SENT") return <Badge tone="ok">إيميل الترحيب وصل</Badge>;
  if (email.status === "FAILED") return <Badge tone="danger">فشل إرسال الإيميل</Badge>;
  return <Badge tone="warn">الإيميل بالانتظار</Badge>;
}

/** Opens a customer on its own page (#customers/customer-<id>). */
const openCustomer = (id: string) => pushHash("customers", `customer-${id}`);

export function Customers() {
  const [sub, setSub] = useState(() => readHash().sub);
  useEffect(() => onHashMove(() => setSub(readHash().sub)), []);
  return sub?.startsWith("customer-") ? <CustomerPage id={sub.slice(9)} /> : <CustomersList />;
}

function CustomersList() {
  const [rows, setRows] = useState<CustomerRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [guestOrders, setGuestOrders] = useState(0);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [archived, setArchived] = useState<string[]>(readArchived);
  const [tab, setTab] = useState<"all" | "archived">("all");
  const [archiving, setArchiving] = useState<CustomerRow | null>(null);
  const canArchive = PREVIEW;
  const setArchivedIds = (next: string[]) => {
    try {
      localStorage.setItem(ARCHIVED_KEY, JSON.stringify(next));
    } catch {
      return;
    }
    setArchived(next);
  };

  // Searching is done by the server so it covers every account, not only the first page.
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      api<{ customers: CustomerRow[]; total: number; guestOrders: number }>(`/admin/customers?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal })
        .then((result) => {
          setRows(result.customers);
          setTotal(result.total);
          setGuestOrders(result.guestOrders);
          setError("");
        })
        .catch((failure) => {
          if (!controller.signal.aborted) setError(apiMessage(failure));
        });
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const inArchive = canArchive && tab === "archived";
  const archivedRows = rows?.filter((row) => archived.includes(row.id)) ?? [];
  const activeRows = rows === null ? null : canArchive ? rows.filter((row) => !archived.includes(row.id)) : rows;
  const shown = inArchive ? archivedRows : activeRows;
  const pager = usePager(shown ?? [], `${tab}|${query}`);
  const withOrders = activeRows?.filter((row) => row.orders > 0).length ?? 0;
  const pendingEmails = activeRows?.filter((row) => row.welcomeEmail && row.welcomeEmail.status !== "SENT").length ?? 0;

  return (
    <div className="space-y-6">
      <PageHead title="العملاء" lead="الحسابات المسجّلة في المتجر، وطلباتهم وعناوينهم." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="العملاء المسجّلين" value={num.format(canArchive ? total - archivedRows.length : total)} note="كل الحسابات" icon={Users} tone="blue" />
        <StatCard label="عملاء طلبوا" value={num.format(withOrders)} note="من القائمة الحالية" icon={UserCheck} tone="ok" />
        <StatCard label="طلبات بدون حساب" value={num.format(guestOrders)} note="طلبات الضيوف" icon={UserX} tone="accent" onClick={() => pushHash("orders")} />
        <StatCard label="إيميلات الترحيب المعلّقة" value={num.format(pendingEmails)} note="ما وصلت لسه" icon={Mail} tone={pendingEmails ? "warn" : "ok"} />
      </div>

      <Panel>
        <div className="flex flex-wrap items-center gap-3 border-b border-(--a-line) p-4">
          <div className="min-w-56 flex-1">
            <SearchBox value={query} onChange={setQuery} placeholder="ابحث بالاسم أو الجوال أو الإيميل" />
          </div>
          {canArchive ? (
            <div className="w-44">
              <Select<"all" | "archived">
                label="عرض"
                hideLabel
                value={tab}
                onChange={setTab}
                options={[
                  ["all", `الكل (${num.format(activeRows?.length ?? 0)})`],
                  ["archived", `الأرشيف (${num.format(archivedRows.length)})`],
                ]}
              />
            </div>
          ) : null}
        </div>
        {error ? (
          <p className="p-5 text-sm text-(--a-danger)">{error}</p>
        ) : rows === null ? (
          <p className="p-5 text-sm text-(--a-muted)">جاري التحميل…</p>
        ) : shown === null || shown.length === 0 ? (
          <Empty
            icon={Users}
            title={inArchive ? "الأرشيف فاضي" : query ? "ما فيه نتائج" : "ما فيه عملاء مسجّلين لسه"}
            lead={inArchive ? "العملاء اللي تحذفهم من القائمة ينتقلون هنا وتقدر تسترجعهم." : query ? "جرّب كلمة بحث ثانية." : "يظهر هنا كل عميل يسجّل حساب من المتجر."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="text-xs text-(--a-muted)">
                <tr className="text-start">
                  <th className="px-5 py-3 text-start font-medium">العميل</th>
                  <th className="px-3 py-3 text-start font-medium">التواصل</th>
                  <th className="px-3 py-3 text-start font-medium">الطلبات</th>
                  <th className="px-3 py-3 text-start font-medium">المشتريات</th>
                  <th className="px-3 py-3 text-start font-medium">التسجيل</th>
                  <th className="px-3 py-3 text-start font-medium">إيميل الترحيب</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {pager.rows.map((row) => (
                  <tr key={row.id} {...rowOpen(() => openCustomer(row.id))} className="cursor-pointer border-t border-(--a-line) transition-colors hover:bg-(--a-surface-2)/40">
                    <td className="px-5 py-3">
                      <button type="button" onClick={() => openCustomer(row.id)} className="flex cursor-pointer items-center gap-3 text-start">
                        <Avatar avatar={row.avatar} firstName={row.firstName} lastName={row.lastName} className="size-9 bg-(--a-surface-2) text-xs text-(--a-muted)" />
                        <span>
                          <span className="block font-medium">
                            {row.firstName} {row.lastName}
                          </span>
                          <span className="block text-xs text-(--a-muted)">آخر دخول {date(row.lastLoginAt)}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-3" dir="ltr">
                      <span className="block text-end">{row.phone}</span>
                      <span className="block text-end text-xs text-(--a-muted)">{row.email}</span>
                    </td>
                    <td className="px-3 py-3 tabular-nums">{num.format(row.orders)}</td>
                    <td className="px-3 py-3 tabular-nums">{sar.format(Number(row.spent))}</td>
                    <td className="px-3 py-3 text-(--a-muted)">{date(row.createdAt)}</td>
                    <td className="px-3 py-3">
                      <WelcomeBadge email={row.welcomeEmail} />
                    </td>
                    <td className="px-5 py-3 text-end">
                      {inArchive ? (
                        <IconButton icon={ArchiveRestore} label={`استرجاع ${row.firstName} ${row.lastName}`} onClick={() => setArchivedIds(archived.filter((id) => id !== row.id))} />
                      ) : (
                        <IconButton
                          icon={Trash2}
                          tone="danger"
                          label={canArchive ? `حذف ${row.firstName} ${row.lastName}` : "حذف العملاء غير متاح أثناء الاتصال بقاعدة البيانات"}
                          disabled={!canArchive}
                          onClick={() => setArchiving(row)}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager pager={pager} />
      </Panel>

      <Confirm
        open={archiving !== null}
        onClose={() => setArchiving(null)}
        onConfirm={() => archiving && setArchivedIds([...archived, archiving.id])}
        title={`حذف ${archiving ? `${archiving.firstName} ${archiving.lastName}` : ""}؟`}
        lead="العميل يختفي من قائمة العملاء وينتقل لتبويب الأرشيف. حسابه وطلباته وعناوينه ما تتأثر، وتقدر تسترجعه في أي وقت. الأرشفة على هذا المتصفح فقط."
        action="نقل للأرشيف"
      />
    </div>
  );
}

function CustomerPage({ id }: { id: string }) {
  const { content, shops } = useSiteContent();
  const { orders: allOrders } = useOps();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [resend, setResend] = useState<"idle" | "busy" | "done" | "error">("idle");

  useEffect(() => {
    setDetail(null);
    setError("");
    setResend("idle");
    const controller = new AbortController();
    api<Detail>(`/admin/customers/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then(setDetail)
      .catch((failure) => {
        if (!controller.signal.aborted) setError(apiMessage(failure));
      });
    return () => controller.abort();
  }, [id]);

  async function sendWelcome() {
    setResend("busy");
    try {
      await api(`/admin/customers/${encodeURIComponent(id)}/welcome-email`, { body: {} });
      setDetail(await api<Detail>(`/admin/customers/${encodeURIComponent(id)}`));
      setResend("done");
    } catch {
      setResend("error");
    }
  }

  const customer = detail?.customer;
  // The customer's orders with their products: matched by the order numbers the server lists, or by the same phone or email.
  const numbers = new Set((detail?.orders ?? []).map((order) => String(order.number)));
  const mine = customer
    ? allOrders.filter((order) => numbers.has(order.id) || (!!order.phone && order.phone === customer.phone) || (!!order.email && order.email.toLowerCase() === customer.email.toLowerCase()))
    : [];
  const shopOf = (productId: string) => {
    const product = content.products.find((item) => item.id === productId);
    return (product?.shopId && shops.find((shop) => shop.id === product.shopId)?.name) || product?.shop?.name || null;
  };
  const nameOf = (productId: string) => content.products.find((item) => item.id === productId)?.nameAr ?? productId;

  return (
    <div className="space-y-6">
      <PageHead title={customer ? `${customer.firstName} ${customer.lastName}` : "العميل"} lead={customer ? `عميل من ${date(customer.createdAt)}` : undefined} />
      {error ? <p className="text-sm text-(--a-danger)">{error}</p> : null}
      {!detail && !error ? <p className="text-sm text-(--a-muted)">جاري التحميل…</p> : null}
      {detail && customer ? (
        <div className="space-y-6">
          <Panel className="p-5">
            <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
              <Avatar avatar={customer.avatar} firstName={customer.firstName} lastName={customer.lastName} className="size-14 bg-(--a-surface-2) text-lg text-(--a-muted)" />
              <dl className="flex min-w-0 flex-1 flex-wrap gap-x-8 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs text-(--a-muted)">الجوال</dt>
                  <dd dir="ltr" className="mt-0.5 text-end font-medium">
                    {customer.phone}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs text-(--a-muted)">الإيميل</dt>
                  <dd dir="ltr" className="mt-0.5 truncate text-end font-medium">
                    {customer.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-(--a-muted)">آخر دخول</dt>
                  <dd className="mt-0.5 font-medium">{date(customer.lastLoginAt)}</dd>
                </div>
                <div className="min-w-0 basis-full">
                  <dt className="text-xs text-(--a-muted)">العناوين ({num.format(detail.addresses.length)})</dt>
                  <dd className="mt-0.5 font-medium">
                    {detail.addresses.length ? (
                      detail.addresses.map((address) => (
                        <span key={address.id} className="mt-1 block">
                          {address.label || address.city}
                          {address.isDefault ? " (الأساسي)" : ""}
                          <span className="font-normal text-(--a-muted)">
                            {" · "}
                            {address.zoneName ? `${address.zoneName} · ` : ""}
                            {address.city}، {address.line1}
                          </span>
                        </span>
                      ))
                    ) : (
                      <span className="font-normal text-(--a-muted)">ما حفظ عناوين</span>
                    )}
                  </dd>
                </div>
              </dl>
              <div className="flex gap-3 text-center">
                <div className="min-w-28 rounded-xl bg-(--a-surface-2) px-4 py-2.5">
                  <p className="text-xs text-(--a-muted)">عدد الطلبات</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums">{num.format(customer.orders)}</p>
                </div>
                <div className="min-w-28 rounded-xl bg-(--a-surface-2) px-4 py-2.5">
                  <p className="text-xs text-(--a-muted)">إجمالي المشتريات</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums">{sar.format(Number(customer.spent))}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-(--a-line) pt-5">
              <section>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Mail className="size-4 text-(--a-muted)" />
                  إيميل الترحيب
                </h3>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <WelcomeBadge email={customer.welcomeEmail} />
                {customer.welcomeEmail?.status === "SENT" ? <span className="text-xs text-(--a-muted)">{date(customer.welcomeEmail.sentAt)}</span> : null}
                {customer.welcomeEmail && customer.welcomeEmail.status !== "SENT" ? (
                  <>
                    {customer.welcomeEmail.lastError ? <span className="w-full text-xs leading-5 text-(--a-muted)">{/not configured/i.test(customer.welcomeEmail.lastError) ? "خدمة الإيميل غير مربوطة بالخادم بعد." : customer.welcomeEmail.lastError}</span> : null}
                    <Button icon={RefreshCw} onClick={sendWelcome} disabled={resend === "busy"}>
                      إرسال مرة ثانية
                    </Button>
                    {resend === "error" ? <span className="text-xs text-(--a-danger)">ما قدرنا نرسله الحين.</span> : null}
                  </>
                ) : null}
              </div>
              </section>
            </div>
          </Panel>

          <Panel title={`الطلبات (${num.format(Math.max(mine.length, detail.orders.length))})`} lead="كل طلب بمنتجاته والمحل اللي جاء منه">
            {mine.length ? (
              <ul className="divide-y divide-(--a-line)">
                {mine.map((order) => {
                  const lines = order.lines?.length ? order.lines.map((line) => ({ id: line.id, name: line.name, qty: line.qty, price: line.price })) : [{ id: order.productId, name: nameOf(order.productId), qty: order.items, price: order.items ? order.total / order.items : order.total }];
                  const status = ORDER_STATUS_LABEL[order.status];
                  return (
                    <li key={order.id} className="grid items-center gap-x-6 gap-y-3 px-5 py-4 md:grid-cols-[9rem_minmax(0,1fr)_7rem_7rem]">
                      <button type="button" onClick={() => pushHash("orders", `order-${order.id}`)} className="text-start font-semibold hover:underline">
                        <span dir="ltr">#{order.id}</span>
                        <span className="block text-xs font-normal text-(--a-muted)">{date(order.date)}</span>
                      </button>
                      <ul className="space-y-2">
                        {lines.map((line) => {
                          const shop = shopOf(line.id);
                          return (
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
                              {shop ? (
                                <Badge tone="accent">
                                  <Store className="size-3" />
                                  {shop}
                                </Badge>
                              ) : (
                                <Badge>بدون محل</Badge>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                      <span>
                        <Badge tone={order.status === "cancelled" ? "danger" : order.status === "delivered" ? "ok" : "blue"}>{status}</Badge>
                      </span>
                      <span className="font-semibold tabular-nums md:text-end">{sar.format(order.total)}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Empty icon={Package} title="ما فيه طلبات" lead="طلبات هذا العميل تظهر هنا بمنتجاتها والمحل اللي جاءت منه." />
            )}
          </Panel>
        </div>
      ) : null}
    </div>
  );
}
