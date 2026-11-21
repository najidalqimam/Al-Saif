import { useEffect, useRef, useState } from "react";
import { TrashIcon } from "@/components/TrashIcon";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, Check, CheckCircle2, Clock, LoaderCircle, LogOut, MapPin, Package, PackageCheck, Pencil, Plus, Star, Truck } from "lucide-react";
import { Link, Redirect, useLocation, useSearch } from "wouter";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ACCOUNT_COPY } from "@/lib/account-copy";
import { AVATAR_PRESETS, Avatar } from "@/lib/avatars";
import { api } from "@/lib/api";
import { errorCode, useCustomer, type Customer } from "@/lib/customer";
import { useLang } from "@/lib/i18n";
import { announceChange } from "@/lib/live-sync";
import { publicUrl } from "@/lib/utils";
import { ErrorText, Field, inputClass } from "@/pages/AuthPage";

type Tab = "orders" | "profile" | "password";
// Addresses are managed inside the profile tab; the separate tab was removed.
const TABS: Tab[] = ["orders", "profile", "password"];

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
  const asked = new URLSearchParams(useSearch()).get("tab");
  // Old links to the addresses tab open the profile tab, where the addresses now are.
  const requested = (asked === "addresses" ? "profile" : asked) as Tab | null;
  const tab: Tab = requested && TABS.includes(requested) ? requested : "orders";
  // Set by the profile form while it has edits that are not saved yet.
  const unsaved = useRef(false);
  const saveRef = useRef<() => Promise<boolean>>(async () => true);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [leaveBusy, setLeaveBusy] = useState(false);

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
            onClick={(event) => {
              // Switching tabs would drop the unsaved edits of the profile form: ask first.
              if (item !== tab && unsaved.current) {
                event.preventDefault();
                setLeaving(`/${lang}/account${item === "orders" ? "" : `?tab=${item}`}`);
              }
            }}
            className={`h-10 shrink-0 rounded-full px-4 text-sm font-semibold leading-10 transition-colors ${tab === item ? "bg-brand text-navy" : "text-navy/60 hover:text-navy"}`}
          >
            {copy.tabs[item]}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "orders" ? <Orders /> : null}
        {tab === "profile" ? <Profile customer={customer} unsaved={unsaved} saveRef={saveRef} /> : null}
        {tab === "password" ? <Password /> : null}
      </div>
      <Dialog.Root open={leaving !== null} onOpenChange={(next) => (next || leaveBusy ? null : setLeaving(null))}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content dir={lang === "en" ? "ltr" : "rtl"} className="fixed inset-x-4 top-1/2 z-50 mx-auto w-auto max-w-md -translate-y-1/2 rounded-3xl bg-white p-6 text-navy shadow-2xl">
            <span className="grid size-11 place-items-center rounded-xl bg-burgundy/10 text-burgundy">
              <AlertTriangle className="size-5" />
            </span>
            <Dialog.Title className="mt-4 text-lg font-bold">{copy.leaveTitle}</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-7 text-navy/60">{copy.leaveLead}</Dialog.Description>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={leaveBusy}
                onClick={async () => {
                  setLeaveBusy(true);
                  // Leaves only when the save worked; a failed save stays on the page with its message.
                  const saved = await saveRef.current();
                  setLeaveBusy(false);
                  if (saved && leaving) {
                    unsaved.current = false;
                    navigate(leaving);
                  }
                  setLeaving(null);
                }}
                className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-brand px-5 text-sm font-bold text-navy hover:bg-brand-hover disabled:opacity-70"
              >
                {leaveBusy ? <LoaderCircle className="size-4 animate-spin" /> : null}
                {copy.leaveSave}
              </button>
              <button
                type="button"
                disabled={leaveBusy}
                onClick={() => {
                  unsaved.current = false;
                  if (leaving) navigate(leaving);
                  setLeaving(null);
                }}
                className="inline-flex h-11 cursor-pointer items-center rounded-full bg-burgundy px-5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-70"
              >
                {copy.leaveDiscard}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="inner-page-white min-h-svh bg-[var(--page-bg)] text-navy">
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
  const date = (value: string) =>
    new Date(value).toLocaleDateString(
      lang === "en" ? "en-GB" : lang === "ur" ? "ur-PK" : "ar-SA-u-nu-latn-ca-gregory",
      { day: "numeric", month: "long", year: "numeric" },
    );

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
        // A finished order (delivered or cancelled) collapses to one line: the product, the date and the final status.
        if (order.status === "DELIVERED" || order.status === "CANCELLED") {
          const first = order.items[0]?.name ?? "";
          const more = order.items.length - 1;
          return (
            <Panel key={order.id}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <p className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {first}
                  {more > 0 ? <span className="ms-2 text-xs font-medium text-navy/50">+{more}</span> : null}
                </p>
                <p className="text-sm text-navy/60">{date(order.placedAt)}</p>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${order.status === "CANCELLED" ? "bg-burgundy/10 text-burgundy" : "bg-brand/10 text-brand-ink"}`}>
                  {copy.orderStatus[order.status]}
                </span>
              </div>
            </Panel>
          );
        }
        return (
          <Panel key={order.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-navy/50">{copy.placedOn}</p>
                <p className="font-semibold">{date(order.placedAt)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand-ink">{copy.orderStatus[order.status]}</span>
                <span className="rounded-full bg-[var(--tone-b)] px-3 py-1 text-xs font-medium text-navy/70">
                  {copy.paymentMethod[order.paymentMethod]} · {copy.paymentStatus[order.paymentStatus]}
                </span>
              </div>
            </div>

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

function SmallButton({ icon: Icon, onClick, danger, children }: { icon: React.ComponentType<{ className?: string }>; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
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

// ---------------------------------------------------------------------------
// Profile and password
// ---------------------------------------------------------------------------

type AddressDraft = { key: string; id?: string; label: string; zoneCode: string; city: string; line1: string; notes: string; isDefault: boolean; wasDefault: boolean; dirty: boolean; editing: boolean };
const draftOf = (item: SavedAddress): AddressDraft => ({ key: item.id, id: item.id, label: item.label, zoneCode: item.zoneCode ?? "", city: item.city, line1: item.line1, notes: item.notes, isDefault: item.isDefault, wasDefault: item.isDefault, dirty: false, editing: false });
const newDraft = (): AddressDraft => ({ key: `new-${Math.random().toString(36).slice(2)}`, label: "", zoneCode: "", city: "", line1: "", notes: "", isDefault: false, wasDefault: false, dirty: true, editing: true });
function draftErrors(draft: AddressDraft) {
  const errors: Partial<Record<"zoneCode" | "city" | "line1", true>> = {};
  if (!draft.zoneCode) errors.zoneCode = true;
  if (draft.city.trim().length < 2) errors.city = true;
  if (draft.line1.trim().length < 3) errors.line1 = true;
  return errors;
}

/** One address inside the account form. Nothing is sent from here; the form's Save button sends everything. */
function AddressCard({ draft, zones, tried, onChange, onEdit, onConfirm, onDefault, onRemove }: { draft: AddressDraft; zones: Zone[]; tried: boolean; onChange: (patch: Partial<AddressDraft>) => void; onEdit: () => void; onConfirm: () => void; onDefault: () => void; onRemove: () => void }) {
  const { lang } = useLang();
  const copy = ACCOUNT_COPY[lang];
  const [confirmTried, setConfirmTried] = useState(false);
  const errors = tried || confirmTried ? draftErrors(draft) : {};
  if (!draft.editing) {
    const zone = zones.find((item) => item.code === draft.zoneCode);
    const zoneName = zone ? (lang === "en" && zone.nameEn ? zone.nameEn : zone.nameAr) : "";
    const title = draft.label || draft.city;
    return (
      <div className="flex items-start justify-between gap-3 text-sm leading-7">
        <p className="min-w-0 text-navy/60">
          <span className="font-semibold text-navy">
            {title}
            {draft.isDefault ? ` (${copy.mainShort})` : ""}
          </span>
          {" · "}
          {[zoneName, draft.city, draft.line1].filter(Boolean).join(" · ")}
        </p>
        <span className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={onEdit} aria-label={copy.edit} title={copy.edit} className="grid size-8 cursor-pointer place-items-center rounded-full text-navy/50 hover:bg-navy/5 hover:text-navy">
            <Pencil className="size-4" />
          </button>
          {!draft.isDefault ? (
            <button type="button" onClick={onDefault} aria-label={copy.setDefault} title={copy.setDefault} className="grid size-8 cursor-pointer place-items-center rounded-full text-navy/50 hover:bg-navy/5 hover:text-navy">
              <Star className="size-4" />
            </button>
          ) : null}
          <button type="button" onClick={onRemove} aria-label={copy.remove} title={copy.remove} className="grid size-8 cursor-pointer place-items-center rounded-full text-navy/50 hover:bg-navy/5 hover:text-burgundy">
            <TrashIcon className="size-4" />
          </button>
        </span>
      </div>
    );
  }
  const required = (key: "zoneCode" | "city" | "line1") => (errors[key] ? copy.errors.required : undefined);
  return (
    <div className={`space-y-4 rounded-2xl border p-4 ${draft.isDefault ? "border-brand/50" : "border-navy/10"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <MapPin className="size-4 text-brand-ink" />
          {draft.label || draft.city || copy.addAddress}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {draft.isDefault ? (
            <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand-ink">{copy.isDefault}</span>
          ) : (
            <SmallButton icon={Star} onClick={onDefault}>
              {copy.setDefault}
            </SmallButton>
          )}
          <SmallButton icon={TrashIcon} onClick={onRemove}>
            {copy.remove}
          </SmallButton>
        </div>
      </div>
      <div className="grid items-start gap-4 sm:grid-cols-2">
        <div>
          <Field label={`${copy.label} (${copy.optional})`} value={draft.label} onChange={(label) => onChange({ label })} placeholder={copy.labelHint} />
          <div className="mt-2 flex flex-wrap gap-2">
            {copy.labelPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onChange({ label: preset })}
                aria-pressed={draft.label === preset}
                className={`h-8 cursor-pointer rounded-full border px-3 text-xs font-semibold transition-colors ${draft.label === preset ? "border-brand-ink bg-brand/10 text-brand-ink" : "border-navy/15 text-navy/60 hover:text-navy"}`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">{copy.zone}</span>
          <select value={draft.zoneCode} onChange={(event) => onChange({ zoneCode: event.target.value })} className={inputClass(required("zoneCode"))}>
            <option value="">{copy.chooseZone}</option>
            {zones.map((zone) => (
              <option key={zone.code} value={zone.code}>
                {lang === "en" && zone.nameEn ? zone.nameEn : zone.nameAr}
                {zone.cities ? ` (${zone.cities})` : ""}
              </option>
            ))}
          </select>
          <ErrorText text={required("zoneCode")} />
        </label>
        <Field label={copy.city} value={draft.city} onChange={(city) => onChange({ city })} error={required("city")} autoComplete="address-level2" />
        <Field label={copy.street} value={draft.line1} onChange={(line1) => onChange({ line1 })} error={required("line1")} placeholder={copy.streetHint} autoComplete="street-address" />
        <div className="sm:col-span-2">
          <Field label={`${copy.notes} (${copy.optional})`} value={draft.notes} onChange={(notes) => onChange({ notes })} />
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          setConfirmTried(true);
          if (!Object.keys(draftErrors(draft)).length) onConfirm();
        }}
        className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-navy hover:bg-brand-hover"
      >
        <Check className="size-4" />
        {copy.confirmAddress}
      </button>
    </div>
  );
}

function Profile({ customer, unsaved, saveRef }: { customer: Customer; unsaved: { current: boolean }; saveRef: { current: () => Promise<boolean> } }) {
  const { lang } = useLang();
  const copy = ACCOUNT_COPY[lang];
  const { setCustomer } = useCustomer();
  const [form, setForm] = useState({ firstName: customer.firstName, lastName: customer.lastName, email: customer.email });
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);
  const zones = useZones();
  const [drafts, setDrafts] = useState<AddressDraft[] | null>(null);
  const [removed, setRemoved] = useState<string[]>([]);
  const set = (patch: Partial<typeof form>) => setForm((current) => ({ ...current, ...patch }));
  const dirty =
    form.firstName !== customer.firstName ||
    form.lastName !== customer.lastName ||
    form.email !== customer.email ||
    removed.length > 0 ||
    (drafts ?? []).some((draft) => draft.dirty || !draft.id);
  unsaved.current = dirty;
  saveRef.current = () => save();
  useEffect(() => () => void (unsaved.current = false), [unsaved]);
  // Closing or reloading the page with unsaved edits asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    api<{ addresses: SavedAddress[] }>("/account/addresses")
      .then((result) => setDrafts(result.addresses.map(draftOf)))
      .catch(() => setDrafts([]));
  }, []);

  const fail = (text: string) => {
    setNotice({ tone: "error", text });
    return false;
  };

  async function save(event?: React.FormEvent): Promise<boolean> {
    event?.preventDefault();
    setNotice(null);
    setTried(true);
    if (!form.firstName.trim() || !form.lastName.trim()) return fail(copy.errors.required);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) return fail(copy.errors.badEmail);
    if ((drafts ?? []).some((draft) => Object.keys(draftErrors(draft)).length)) return fail(copy.errors.required);
    setBusy(true);
    try {
      const result = await api<{ customer: Customer }>("/account/me", { method: "PATCH", body: { firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim() } });
      setCustomer(result.customer);
      if (drafts) {
        // Deletes first, then the other changes, and the address that becomes the main one last.
        let latest: SavedAddress[] | null = null;
        for (const id of removed) latest = (await api<{ addresses: SavedAddress[] }>(`/account/addresses/${id}`, { method: "DELETE" })).addresses;
        const gone = new Set(removed);
        const work = drafts
          .filter((draft) => !draft.id || (!gone.has(draft.id) && draft.dirty))
          .sort((a, b) => Number(a.isDefault) - Number(b.isDefault));
        for (const draft of work) {
          const body = { label: draft.label.trim(), zoneCode: draft.zoneCode, city: draft.city.trim(), line1: draft.line1.trim(), notes: draft.notes.trim() };
          const wantsDefault = draft.isDefault && !draft.wasDefault;
          latest = draft.id
            ? (await api<{ addresses: SavedAddress[] }>(`/account/addresses/${draft.id}`, { method: "PATCH", body: { ...body, isDefault: wantsDefault || undefined } })).addresses
            : (await api<{ addresses: SavedAddress[] }>("/account/addresses", { body: { ...body, isDefault: draft.isDefault || undefined } })).addresses;
        }
        if (latest) setDrafts(latest.map(draftOf));
        setRemoved([]);
      }
      announceChange("customers");
      setNotice({ tone: "ok", text: copy.saved });
      return true;
    } catch (failure) {
      setNotice({ tone: "error", text: copy.errors[errorCode(failure)] ?? copy.errors.generic });
      return false;
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
      announceChange("customers");
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
        <div className="space-y-4 border-t border-navy/10 pt-5 sm:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h3 id="profile-addresses" className="text-base font-bold">
              {copy.addresses}
            </h3>
            {drafts && !drafts.some((row) => row.editing) ? (
              <button
                type="button"
                onClick={() => setDrafts((list) => [...(list ?? []), { ...newDraft(), isDefault: (list ?? []).length === 0 }])}
                aria-label={copy.addAddress}
                title={copy.addAddress}
                className="grid size-9 cursor-pointer place-items-center rounded-full border border-brand-ink text-brand-ink hover:bg-brand/10"
              >
                <Plus className="size-4" />
              </button>
            ) : null}
          </div>
          {drafts === null ? <LoaderCircle className="mx-auto size-5 animate-spin text-navy/40" /> : null}
          {drafts && drafts.length === 0 ? <p className="rounded-2xl border border-navy/10 p-4 text-center text-sm text-navy/60">{copy.noAddresses}</p> : null}
          {(drafts ?? []).map((draft) => (
            <AddressCard
              key={draft.key}
              draft={draft}
              zones={zones}
              tried={tried}
              onChange={(patch) => setDrafts((list) => list && list.map((row) => (row.key === draft.key ? { ...row, ...patch, dirty: true } : row)))}
              onEdit={() => setDrafts((list) => list && list.map((row) => (row.key === draft.key ? { ...row, editing: true } : row)))}
              onConfirm={() => setDrafts((list) => list && list.map((row) => (row.key === draft.key ? { ...row, editing: false } : row)))}
              onDefault={() => setDrafts((list) => list && list.map((row) => ({ ...row, isDefault: row.key === draft.key, dirty: row.dirty || (row.key === draft.key && !row.isDefault) })))}
              onRemove={() => {
                if (draft.id) setRemoved((list) => [...list, draft.id!]);
                setDrafts((list) => {
                  const rest = (list ?? []).filter((row) => row.key !== draft.key);
                  // The main address moves to the first one left, so there is always one.
                  return draft.isDefault && rest.length ? rest.map((row, index) => (index === 0 ? { ...row, isDefault: true, dirty: true } : row)) : rest;
                });
              }}
            />
          ))}
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
          <button type="submit" disabled={busy || !dirty} className={`inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-bold transition-colors ${dirty ? "cursor-pointer bg-brand text-navy hover:bg-brand-hover disabled:opacity-70" : "cursor-default bg-brand/35 text-navy/50"}`}>
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
