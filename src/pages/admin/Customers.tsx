import { useEffect, useState } from "react";
import { Eye, Mail, MapPin, Package, RefreshCw, UserCheck, Users, UserX } from "lucide-react";
import { api, apiMessage } from "@/lib/api";
import { Avatar } from "@/lib/avatars";
import { pushHash } from "./nav";
import { AR_DATE, Badge, Button, Drawer, Empty, IconButton, PageHead, Panel, SearchBox, StatCard, num, sar } from "./ui";

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

const ORDER_STATUS: Record<string, string> = { NEW: "جديد", PROCESSING: "قيد التجهيز", SHIPPED: "تم الشحن", DELIVERED: "تم التسليم", CANCELLED: "ملغي" };
const PAYMENT_STATUS: Record<string, string> = { PENDING: "بانتظار الدفع", PAID: "مدفوع", FAILED: "فشل الدفع", REFUNDED: "مسترجع" };
const PAYMENT_METHOD: Record<string, string> = { COD: "عند الاستلام", BANK_TRANSFER: "تحويل بنكي", ONLINE: "إلكتروني" };

const date = (value: string | null) => (value ? new Date(value).toLocaleDateString(AR_DATE, { day: "numeric", month: "short", year: "numeric" }) : "—");

function WelcomeBadge({ email }: { email: WelcomeEmail }) {
  if (!email) return <Badge>—</Badge>;
  if (email.status === "SENT") return <Badge tone="ok">إيميل الترحيب وصل</Badge>;
  if (email.status === "FAILED") return <Badge tone="danger">فشل إرسال الإيميل</Badge>;
  return <Badge tone="warn">الإيميل بالانتظار</Badge>;
}

export function Customers() {
  const [rows, setRows] = useState<CustomerRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [guestOrders, setGuestOrders] = useState(0);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

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

  const withOrders = rows?.filter((row) => row.orders > 0).length ?? 0;
  const pendingEmails = rows?.filter((row) => row.welcomeEmail && row.welcomeEmail.status !== "SENT").length ?? 0;

  return (
    <div className="space-y-6">
      <PageHead title="العملاء" lead="الحسابات المسجّلة في المتجر، وطلباتهم وعناوينهم." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="العملاء المسجّلين" value={num.format(total)} note="كل الحسابات" icon={Users} tone="blue" />
        <StatCard label="عملاء طلبوا" value={num.format(withOrders)} note="من القائمة الحالية" icon={UserCheck} tone="ok" />
        <StatCard label="طلبات بدون حساب" value={num.format(guestOrders)} note="طلبات الضيوف" icon={UserX} tone="accent" onClick={() => pushHash("orders")} />
        <StatCard label="إيميلات الترحيب المعلّقة" value={num.format(pendingEmails)} note="ما وصلت لسه" icon={Mail} tone={pendingEmails ? "warn" : "ok"} />
      </div>

      <Panel>
        <div className="border-b border-(--a-line) p-4">
          <SearchBox value={query} onChange={setQuery} placeholder="ابحث بالاسم أو الجوال أو الإيميل" />
        </div>
        {error ? (
          <p className="p-5 text-sm text-(--a-danger)">{error}</p>
        ) : rows === null ? (
          <p className="p-5 text-sm text-(--a-muted)">جاري التحميل…</p>
        ) : rows.length === 0 ? (
          <Empty icon={Users} title={query ? "ما فيه نتائج" : "ما فيه عملاء مسجّلين لسه"} lead={query ? "جرّب كلمة بحث ثانية." : "يظهر هنا كل عميل يسجّل حساب من المتجر."} />
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
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-(--a-line) transition-colors hover:bg-(--a-surface-2)/40">
                    <td className="px-5 py-3">
                      <button type="button" onClick={() => setOpenId(row.id)} className="flex cursor-pointer items-center gap-3 text-start">
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
                      <IconButton icon={Eye} label={`عرض ${row.firstName} ${row.lastName}`} onClick={() => setOpenId(row.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <CustomerDrawer id={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

function CustomerDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [resend, setResend] = useState<"idle" | "busy" | "done" | "error">("idle");

  useEffect(() => {
    setDetail(null);
    setError("");
    setResend("idle");
    if (!id) return;
    const controller = new AbortController();
    api<Detail>(`/admin/customers/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then(setDetail)
      .catch((failure) => {
        if (!controller.signal.aborted) setError(apiMessage(failure));
      });
    return () => controller.abort();
  }, [id]);

  async function sendWelcome() {
    if (!id) return;
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
  return (
    <Drawer open={id !== null} onClose={onClose} title={customer ? `${customer.firstName} ${customer.lastName}` : "العميل"} lead={customer ? `عميل من ${date(customer.createdAt)}` : undefined}>
      {error ? <p className="text-sm text-(--a-danger)">{error}</p> : null}
      {!detail && !error ? <p className="text-sm text-(--a-muted)">جاري التحميل…</p> : null}
      {detail && customer ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4 rounded-2xl bg-(--a-surface-2) p-4">
            <Avatar avatar={customer.avatar} firstName={customer.firstName} lastName={customer.lastName} className="size-14 bg-(--a-surface) text-lg text-(--a-muted)" />
            <dl className="grid flex-1 gap-1 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-(--a-muted)">الجوال</dt>
                <dd dir="ltr">{customer.phone}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-(--a-muted)">الإيميل</dt>
                <dd dir="ltr" className="truncate">
                  {customer.email}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-(--a-muted)">آخر دخول</dt>
                <dd>{date(customer.lastLoginAt)}</dd>
              </div>
            </dl>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl border border-(--a-line) p-3">
              <p className="text-xs text-(--a-muted)">عدد الطلبات</p>
              <p className="mt-1 text-lg font-bold tabular-nums">{num.format(customer.orders)}</p>
            </div>
            <div className="rounded-xl border border-(--a-line) p-3">
              <p className="text-xs text-(--a-muted)">إجمالي المشتريات</p>
              <p className="mt-1 text-lg font-bold tabular-nums">{sar.format(Number(customer.spent))}</p>
            </div>
          </div>

          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Mail className="size-4 text-(--a-muted)" />
              إيميل الترحيب
            </h3>
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-(--a-line) p-3 text-sm">
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

          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <MapPin className="size-4 text-(--a-muted)" />
              العناوين ({num.format(detail.addresses.length)})
            </h3>
            {detail.addresses.length ? (
              <ul className="space-y-2">
                {detail.addresses.map((address) => (
                  <li key={address.id} className="rounded-xl border border-(--a-line) p-3 text-sm leading-6">
                    <p className="flex items-center gap-2 font-medium">
                      {address.label || address.city}
                      {address.isDefault ? <Badge tone="accent">الأساسي</Badge> : null}
                    </p>
                    <p className="text-(--a-muted)">
                      {address.zoneName ? `${address.zoneName} · ` : ""}
                      {address.city}، {address.line1}
                      {address.notes ? ` · ${address.notes}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-(--a-muted)">ما حفظ عناوين.</p>
            )}
          </section>

          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Package className="size-4 text-(--a-muted)" />
              الطلبات ({num.format(detail.orders.length)})
            </h3>
            {detail.orders.length ? (
              <ul className="divide-y divide-(--a-line) rounded-xl border border-(--a-line)">
                {detail.orders.map((order) => (
                  <li key={order.number} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                    <span>
                      <span className="font-semibold">#{order.number}</span>
                      <span className="ms-2 text-xs text-(--a-muted)">{date(order.placedAt)}</span>
                    </span>
                    <span className="flex flex-wrap items-center gap-2">
                      <Badge tone={order.status === "CANCELLED" ? "danger" : order.status === "DELIVERED" ? "ok" : "blue"}>{ORDER_STATUS[order.status] ?? order.status}</Badge>
                      <Badge>
                        {PAYMENT_METHOD[order.paymentMethod] ?? order.paymentMethod} · {PAYMENT_STATUS[order.paymentStatus] ?? order.paymentStatus}
                      </Badge>
                      <span className="font-semibold tabular-nums">{sar.format(Number(order.total))}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-(--a-muted)">ما طلب لسه.</p>
            )}
          </section>
        </div>
      ) : null}
    </Drawer>
  );
}
