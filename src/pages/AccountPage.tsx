import { useEffect, useState } from "react";
import { Check, CheckCircle2, Clock, LoaderCircle, LogOut, MapPin, Package, PackageCheck, Pencil, Plus, Star, Trash2, Truck, XCircle } from "lucide-react";
import { Link, Redirect, useLocation, useSearch } from "wouter";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ACCOUNT_COPY } from "@/lib/account-copy";
import { AVATAR_PRESETS, Avatar } from "@/lib/avatars";
import { api } from "@/lib/api";
import { errorCode, useCustomer, type Customer } from "@/lib/customer";
import { useLang } from "@/lib/i18n";
import { publicUrl } from "@/lib/utils";
import { ErrorText, Field, inputClass } from "@/pages/AuthPage";

type Tab = "orders" | "addresses" | "profile" | "password";
const TABS: Tab[] = ["orders", "addresses", "profile", "password"];

type OrderStatus = "NEW" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
type AccountOrder = {
  id: string;
  placedAt: string;
  status: OrderStatus;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentMethod: "COD" | "BANK_TRANSFER" | "ONLINE";
  total: string;
  shippingMethodName: string;
  zoneName: string;
  city: string;
  addressLine: string;
  items: Array<{ id: string; name: string; imageUrl: string | null; quantity: number; lineTotal: string }>;
};
export type SavedAddress = { id: string; label: string; zoneCode: string | null; zoneName: string | null; city: string; line1: string; notes: string; isDefault: boolean };
export type Zone = { code: string; nameAr: string; nameEn: string; cities: string };

const STEPS: Array<{ id: Exclude<OrderStatus, "CANCELLED">; icon: typeof Clock }> = [
  { id: "NEW", icon: CheckCircle2 },
  { id: "PROCESSING", icon: Clock },
  { id: "SHIPPED", icon: Truck },
  { id: "DELIVERED", icon: PackageCheck },
];

export function AccountPage() {
  const { lang } = useLang();
  const copy = ACCOUNT_COPY[lang];
  const { customer, ready, logout } = useCustomer();
  const [, navigate] = useLocation();
  const requested = new URLSearchParams(useSearch()).get("tab") as Tab | null;
  const tab: Tab = requested && TABS.includes(requested) ? requested : "orders";

  if (!ready) {
    return (
      <Shell>
        <div className="grid min-h-[40svh] place-items-center text-navy/50">
          <LoaderCircle className="size-6 animate-spin" />
        </div>
      </Shell>
    );
  }
  if (!customer) return <Redirect to={`/${lang}/login?next=${encodeURIComponent(`/${lang}/account`)}`} replace />;

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/${lang}/account?tab=profile`} aria-label={copy.changeAvatar} className="rounded-full ring-4 ring-white transition hover:ring-brand/30">
            <Avatar avatar={customer.avatar} firstName={customer.firstName} lastName={customer.lastName} className="size-16 bg-white text-xl text-navy/50" />
          </Link>
          <div>
            <p className="text-sm font-semibold text-brand-ink">{copy.myAccount}</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{copy.hello(customer.firstName)}</h1>
            <p className="mt-1 text-sm text-navy/55" dir="ltr">
              {customer.phone} · {customer.email}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={async () => {
            await logout();
            navigate(`/${lang}`);
          }}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-navy/15 bg-white px-4 text-sm font-medium text-navy/70 hover:border-burgundy hover:text-burgundy"
        >
          <LogOut className="size-4" />
          {copy.signOut}
        </button>
      </div>

      <nav className="mt-6 flex gap-1 overflow-x-auto rounded-full border border-navy/10 bg-white p-1" aria-label={copy.myAccount}>
        {TABS.map((item) => (
          <Link
            key={item}
            href={`/${lang}/account${item === "orders" ? "" : `?tab=${item}`}`}
            aria-current={tab === item ? "page" : undefined}
            className={`h-10 shrink-0 rounded-full px-4 text-sm font-semibold leading-10 transition-colors ${tab === item ? "bg-brand text-navy" : "text-navy/60 hover:text-navy"}`}
          >
            {copy.tabs[item]}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "orders" ? <Orders /> : null}
        {tab === "addresses" ? <Addresses /> : null}
        {tab === "profile" ? <Profile customer={customer} /> : null}
        {tab === "password" ? <Password /> : null}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-[var(--tone-b)] text-navy">
      <SiteHeader />
      <main id="main" tabIndex={-1} className="tone-scope page-shell min-h-[60svh] py-10 outline-none">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-navy/10 bg-white p-5 sm:p-6 ${className}`}>{children}</section>;
}

function Notice({ tone, text }: { tone: "ok" | "error"; text: string }) {
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-xl px-3 py-2.5 text-sm ${tone === "ok" ? "bg-[#12875a]/10 text-[#12875a]" : "bg-burgundy/10 text-burgundy"}`}>
      {text}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

function Orders() {
  const { lang, t } = useLang();
  const copy = ACCOUNT_COPY[lang];
  const [orders, setOrders] = useState<AccountOrder[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const load = () =>
      api<{ orders: AccountOrder[] }>("/account/orders", { signal: controller.signal })
        .then((result) => setOrders(result.orders))
        .catch((failure) => {
          if (!controller.signal.aborted) setError(copy.errors[errorCode(failure)] ?? copy.errors.generic);
        });
    void load();
    // Status changes made in the dashboard show up here without a reload.
    const timer = window.setInterval(load, 30_000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [copy]);

  const money = (value: string) => `${Number(value).toLocaleString("en-US")} ${t.deals.currency}`;
  const date = (value: string) => new Date(value).toLocaleDateString(lang === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

  if (error) return <Notice tone="error" text={error} />;
  if (!orders) return <LoaderCircle className="mx-auto size-6 animate-spin text-navy/40" />;
  if (!orders.length) {
    return (
      <Panel className="flex flex-col items-center py-12 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-brand/10 text-brand-ink">
          <Package className="size-6" />
        </span>
        <p className="mt-4 text-sm text-navy/60">{copy.noOrders}</p>
        <Link href={`/${lang}/offers`} className="btn-brand mt-5">
          {copy.browse}
        </Link>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const reached = STEPS.findIndex((step) => step.id === order.status);
        return (
          <Panel key={order.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-navy/50">{copy.placedOn}</p>
                <p className="font-semibold">{date(order.placedAt)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${order.status === "CANCELLED" ? "bg-burgundy/10 text-burgundy" : "bg-brand/10 text-brand-ink"}`}>
                  {copy.orderStatus[order.status]}
                </span>
                <span className="rounded-full bg-[var(--tone-b)] px-3 py-1 text-xs font-medium text-navy/70">
                  {copy.paymentMethod[order.paymentMethod]} · {copy.paymentStatus[order.paymentStatus]}
                </span>
              </div>
            </div>

            {order.status === "CANCELLED" ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-burgundy">
                <XCircle className="size-4" />
                {copy.orderStatus.CANCELLED}
              </p>
            ) : (
              <ol className="mt-5 grid grid-cols-4 gap-2">
                {STEPS.map((step, index) => {
                  const done = index <= reached;
                  const Icon = step.icon;
                  return (
                    <li key={step.id} className="flex flex-col items-center gap-1.5 text-center">
                      <span className={`grid size-9 place-items-center rounded-full ${done ? "bg-brand text-navy" : "bg-[var(--tone-b)] text-navy/30"}`}>
                        <Icon className="size-4" />
                      </span>
                      <span className={`text-[11px] font-medium leading-4 ${done ? "text-navy" : "text-navy/40"}`}>{copy.orderStatus[step.id]}</span>
                    </li>
                  );
                })}
              </ol>
            )}

            <ul className="mt-5 divide-y divide-navy/10 border-t border-navy/10">
              {order.items.map((item, index) => (
                <li key={`${item.id}-${index}`} className="flex items-center gap-3 py-3">
                  <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-navy/10 bg-white">
                    {item.imageUrl ? <img src={item.imageUrl.startsWith("data:") ? item.imageUrl : publicUrl(item.imageUrl)} alt="" className="size-full object-contain p-1" /> : <Package className="size-5 text-navy/30" />}
                  </span>
                  <Link href={`/${lang}/p/${encodeURIComponent(item.id)}`} className="min-w-0 flex-1 truncate text-sm font-medium hover:text-brand-ink">
                    {item.name}
                  </Link>
                  <span className="text-xs text-navy/50">× {item.quantity}</span>
                  <span className="text-sm font-semibold">{money(item.lineTotal)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-2 flex flex-wrap items-end justify-between gap-3 border-t border-navy/10 pt-4 text-sm">
              <p className="flex items-start gap-2 text-navy/60">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span>
                  {copy.deliverTo}: {order.city}، {order.addressLine} · {order.shippingMethodName}
                </span>
              </p>
              <p className="font-bold">
                {copy.total}: <span className="text-brand-ink">{money(order.total)}</span>
              </p>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

type AddressForm = { label: string; zoneCode: string; city: string; line1: string; notes: string; isDefault: boolean };
const EMPTY_ADDRESS: AddressForm = { label: "", zoneCode: "", city: "", line1: "", notes: "", isDefault: false };

export function useZones() {
  const [zones, setZones] = useState<Zone[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    api<{ zones: Zone[] }>("/checkout/options", { signal: controller.signal })
      .then((result) => setZones(result.zones))
      .catch(() => setZones([]));
    return () => controller.abort();
  }, []);
  return zones;
}

function Addresses() {
  const { lang } = useLang();
  const copy = ACCOUNT_COPY[lang];
  const zones = useZones();
  const [addresses, setAddresses] = useState<SavedAddress[] | null>(null);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ addresses: SavedAddress[] }>("/account/addresses")
      .then((result) => setAddresses(result.addresses))
      .catch((failure) => setError(copy.errors[errorCode(failure)] ?? copy.errors.generic));
  }, [copy]);

  async function run(request: Promise<{ addresses: SavedAddress[] }>) {
    setError("");
    try {
      setAddresses((await request).addresses);
      setEditing(null);
      setRemoving(null);
      return true;
    } catch (failure) {
      setError(copy.errors[errorCode(failure)] ?? copy.errors.generic);
      return false;
    }
  }

  if (!addresses) return error ? <Notice tone="error" text={error} /> : <LoaderCircle className="mx-auto size-6 animate-spin text-navy/40" />;

  return (
    <div className="space-y-4">
      {error ? <Notice tone="error" text={error} /> : null}
      {addresses.length === 0 && editing !== "new" ? (
        <Panel className="text-center text-sm text-navy/60">{copy.noAddresses}</Panel>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {addresses.map((item) =>
          editing === item.id ? (
            <AddressEditor
              key={item.id}
              zones={zones}
              initial={{ label: item.label, zoneCode: item.zoneCode ?? "", city: item.city, line1: item.line1, notes: item.notes, isDefault: item.isDefault }}
              onCancel={() => setEditing(null)}
              onSave={(form) => run(api(`/account/addresses/${item.id}`, { method: "PATCH", body: { ...form, isDefault: form.isDefault || undefined } }))}
            />
          ) : (
            <Panel key={item.id} className={item.isDefault ? "border-brand/50" : ""}>
              <div className="flex items-start justify-between gap-3">
                <p className="flex items-center gap-2 font-semibold">
                  <MapPin className="size-4 text-brand-ink" />
                  {item.label || item.city}
                </p>
                {item.isDefault ? <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand-ink">{copy.isDefault}</span> : null}
              </div>
              <p className="mt-3 text-sm leading-7 text-navy/70">
                {item.zoneName ? `${item.zoneName} · ` : ""}
                {item.city}
                <br />
                {item.line1}
                {item.notes ? (
                  <>
                    <br />
                    <span className="text-navy/50">{item.notes}</span>
                  </>
                ) : null}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <SmallButton icon={Pencil} onClick={() => setEditing(item.id)}>
                  {copy.edit}
                </SmallButton>
                {!item.isDefault ? (
                  <SmallButton icon={Star} onClick={() => void run(api(`/account/addresses/${item.id}`, { method: "PATCH", body: { isDefault: true } }))}>
                    {copy.setDefault}
                  </SmallButton>
                ) : null}
                {removing === item.id ? (
                  <SmallButton icon={Trash2} danger onClick={() => void run(api(`/account/addresses/${item.id}`, { method: "DELETE" }))}>
                    {copy.removeConfirm}
                  </SmallButton>
                ) : (
                  <SmallButton icon={Trash2} onClick={() => setRemoving(item.id)}>
                    {copy.remove}
                  </SmallButton>
                )}
              </div>
            </Panel>
          ),
        )}
        {editing === "new" ? (
          <AddressEditor zones={zones} initial={{ ...EMPTY_ADDRESS, isDefault: addresses.length === 0 }} onCancel={() => setEditing(null)} onSave={(form) => run(api("/account/addresses", { body: form }))} />
        ) : null}
      </div>

      {editing === null ? (
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-brand-ink px-5 text-sm font-bold text-brand-ink hover:bg-brand/10"
        >
          <Plus className="size-4" />
          {copy.addAddress}
        </button>
      ) : null}
    </div>
  );
}

function SmallButton({ icon: Icon, onClick, danger, children }: { icon: typeof Plus; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors ${
        danger ? "border-burgundy bg-burgundy text-white" : "border-navy/15 text-navy/70 hover:border-brand hover:text-brand-ink"
      }`}
    >
      <Icon className="size-3.5" />
      {children}
    </button>
  );
}

function AddressEditor({ zones, initial, onSave, onCancel }: { zones: Zone[]; initial: AddressForm; onSave: (form: AddressForm) => Promise<boolean>; onCancel: () => void }) {
  const { lang } = useLang();
  const copy = ACCOUNT_COPY[lang];
  const [form, setForm] = useState(initial);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<AddressForm>) => setForm((current) => ({ ...current, ...patch }));
  const errors: Partial<Record<keyof AddressForm, string>> = {};
  if (!form.zoneCode) errors.zoneCode = copy.errors.required;
  if (form.city.trim().length < 2) errors.city = copy.errors.required;
  if (form.line1.trim().length < 3) errors.line1 = copy.errors.required;
  const show = (key: keyof AddressForm) => (tried ? errors[key] : undefined);

  return (
    <Panel className="md:col-span-2">
      <form
        noValidate
        onSubmit={async (event) => {
          event.preventDefault();
          setTried(true);
          if (Object.keys(errors).length) return;
          setBusy(true);
          await onSave({ ...form, label: form.label.trim(), city: form.city.trim(), line1: form.line1.trim(), notes: form.notes.trim() });
          setBusy(false);
        }}
        className="grid gap-4 sm:grid-cols-2"
      >
        <Field label={`${copy.label} (${copy.optional})`} value={form.label} onChange={(label) => set({ label })} placeholder={copy.labelHint} />
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">{copy.zone}</span>
          <select value={form.zoneCode} onChange={(event) => set({ zoneCode: event.target.value })} className={inputClass(show("zoneCode"))}>
            <option value="">{copy.chooseZone}</option>
            {zones.map((zone) => (
              <option key={zone.code} value={zone.code}>
                {lang === "en" && zone.nameEn ? zone.nameEn : zone.nameAr}
                {zone.cities ? ` (${zone.cities})` : ""}
              </option>
            ))}
          </select>
          <ErrorText text={show("zoneCode")} />
        </label>
        <Field label={copy.city} value={form.city} onChange={(city) => set({ city })} error={show("city")} autoComplete="address-level2" />
        <Field label={copy.street} value={form.line1} onChange={(line1) => set({ line1 })} error={show("line1")} placeholder={copy.streetHint} autoComplete="street-address" />
        <div className="sm:col-span-2">
          <Field label={`${copy.notes} (${copy.optional})`} value={form.notes} onChange={(notes) => set({ notes })} />
        </div>
        {!initial.isDefault ? (
          <label className="flex cursor-pointer items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={form.isDefault} onChange={(event) => set({ isDefault: event.target.checked })} className="size-4 accent-[var(--brand)]" />
            {copy.makeDefault}
          </label>
        ) : null}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button type="submit" disabled={busy} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-navy hover:bg-brand-hover disabled:opacity-70">
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
            {copy.save}
          </button>
          <button type="button" onClick={onCancel} className="inline-flex h-11 cursor-pointer items-center rounded-full border border-navy/15 px-5 text-sm font-medium text-navy/70 hover:text-navy">
            {copy.cancel}
          </button>
        </div>
      </form>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Profile and password
// ---------------------------------------------------------------------------

function Profile({ customer }: { customer: Customer }) {
  const { lang } = useLang();
  const copy = ACCOUNT_COPY[lang];
  const { setCustomer } = useCustomer();
  const [form, setForm] = useState({ firstName: customer.firstName, lastName: customer.lastName, email: customer.email });
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm((current) => ({ ...current, ...patch }));

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setNotice(null);
    if (!form.firstName.trim() || !form.lastName.trim()) return setNotice({ tone: "error", text: copy.errors.required });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) return setNotice({ tone: "error", text: copy.errors.badEmail });
    setBusy(true);
    try {
      const result = await api<{ customer: Customer }>("/account/me", { method: "PATCH", body: { firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim() } });
      setCustomer(result.customer);
      setNotice({ tone: "ok", text: copy.saved });
    } catch (failure) {
      setNotice({ tone: "error", text: copy.errors[errorCode(failure)] ?? copy.errors.generic });
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setNotice(null);
    try {
      const result = await api<{ customer: Customer }>("/account/welcome-email/resend", { body: {} });
      setCustomer(result.customer);
    } catch (failure) {
      setNotice({ tone: "error", text: copy.errors[errorCode(failure)] ?? copy.errors.generic });
    }
  }

  async function pickAvatar(avatar: string | null) {
    setNotice(null);
    const previous = customer;
    setCustomer({ ...customer, avatar });
    try {
      const result = await api<{ customer: Customer }>("/account/me", { method: "PATCH", body: { avatar } });
      setCustomer(result.customer);
    } catch (failure) {
      setCustomer(previous);
      setNotice({ tone: "error", text: copy.errors[errorCode(failure)] ?? copy.errors.generic });
    }
  }

  const welcome = customer.welcomeEmail;
  return (
    <Panel className="max-w-2xl">
      <h2 className="text-lg font-bold">{copy.avatar}</h2>
      <p className="mt-1 text-sm text-navy/60">{copy.avatarLead}</p>
      <div role="radiogroup" aria-label={copy.avatar} className="mt-4 flex flex-wrap gap-3">
        {[null, ...AVATAR_PRESETS.map((item) => item.id)].map((id) => {
          const selected = (customer.avatar ?? null) === id;
          return (
            <button
              key={id ?? "none"}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={id ?? copy.noAvatar}
              onClick={() => void pickAvatar(id)}
              className={`cursor-pointer rounded-full p-0.5 ring-2 transition ${selected ? "ring-brand-ink" : "ring-transparent hover:ring-navy/20"}`}
            >
              <Avatar avatar={id} firstName={customer.firstName} lastName={customer.lastName} className="size-12 border border-navy/10 bg-[var(--tone-b)] text-base text-navy/50" />
            </button>
          );
        })}
      </div>

      <h2 className="mt-8 border-t border-navy/10 pt-6 text-lg font-bold">{copy.profile}</h2>
      <form onSubmit={save} noValidate className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label={copy.firstName} value={form.firstName} onChange={(firstName) => set({ firstName })} autoComplete="given-name" />
        <Field label={copy.lastName} value={form.lastName} onChange={(lastName) => set({ lastName })} autoComplete="family-name" />
        <div className="sm:col-span-2">
          <Field label={copy.email} value={form.email} onChange={(email) => set({ email })} type="email" dir="ltr" autoComplete="email" />
        </div>
        <div className="sm:col-span-2">
          <Field label={copy.phone} value={customer.phone} onChange={() => undefined} dir="ltr" disabled />
          <p className="mt-1.5 text-xs text-navy/50">{copy.phoneLocked}</p>
        </div>
        {welcome ? (
          <p className="flex flex-wrap items-center gap-2 text-xs text-navy/60 sm:col-span-2">
            {welcome.status === "SENT" ? copy.welcomeSent : welcome.status === "FAILED" ? copy.welcomeFailed : copy.welcomePending}
            {welcome.status !== "SENT" ? (
              <button type="button" onClick={resend} className="cursor-pointer font-semibold text-brand-ink hover:underline">
                {copy.resend}
              </button>
            ) : null}
          </p>
        ) : null}
        {notice ? (
          <div className="sm:col-span-2">
            <Notice tone={notice.tone} text={notice.text} />
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <button type="submit" disabled={busy} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-navy hover:bg-brand-hover disabled:opacity-70">
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
            {copy.save}
          </button>
        </div>
      </form>
    </Panel>
  );
}

function Password() {
  const { lang } = useLang();
  const copy = ACCOUNT_COPY[lang];
  const [form, setForm] = useState({ current: "", next: "" });
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setNotice(null);
    if (!form.current) return setNotice({ tone: "error", text: copy.errors.required });
    if (form.next.length < 8) return setNotice({ tone: "error", text: copy.errors.shortPassword });
    setBusy(true);
    try {
      await api("/account/password", { body: form });
      setForm({ current: "", next: "" });
      setNotice({ tone: "ok", text: copy.passwordChanged });
    } catch (failure) {
      setNotice({ tone: "error", text: copy.errors[errorCode(failure)] ?? copy.errors.generic });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel className="max-w-md">
      <h2 className="text-lg font-bold">{copy.changePassword}</h2>
      <form onSubmit={save} noValidate className="mt-5 space-y-4">
        <Field label={copy.currentPassword} value={form.current} onChange={(current) => setForm((value) => ({ ...value, current }))} type="password" dir="ltr" autoComplete="current-password" />
        <Field label={copy.newPassword} value={form.next} onChange={(next) => setForm((value) => ({ ...value, next }))} type="password" dir="ltr" autoComplete="new-password" />
        <p className="text-xs text-navy/50">{copy.passwordHint}</p>
        {notice ? <Notice tone={notice.tone} text={notice.text} /> : null}
        <button type="submit" disabled={busy} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-navy hover:bg-brand-hover disabled:opacity-70">
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
          {copy.changePassword}
        </button>
      </form>
    </Panel>
  );
}
