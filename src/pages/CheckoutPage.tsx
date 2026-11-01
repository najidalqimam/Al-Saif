import { useEffect, useMemo, useState } from "react";
import { Banknote, Check, CreditCard, Landmark, LoaderCircle, ShieldCheck, Truck, UserRound } from "lucide-react";
import { Link, useLocation } from "wouter";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { api } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { CHECKOUT_COPY } from "@/lib/checkout-copy";
import { errorCode, useCustomer } from "@/lib/customer";
import { useLang } from "@/lib/i18n";
import { productPhoto } from "@/lib/products";
import { useSiteContent } from "@/lib/site-content";
import type { SavedAddress } from "@/pages/AccountPage";

type Form = { name: string; phone: string; email: string; zone: string; city: string; street: string; notes: string };
type Field = keyof Form | "shipping" | "payment";

/** Checkout settings from the store's database (GET /api/checkout/options). */
type ShippingOption = { code: string; nameAr: string; nameEn: string; fee: number; freeOver: number | null; minOrder: number | null; etaMin: number; etaMax: number; zones: string[] };
type Options = {
  zones: Array<{ code: string; nameAr: string; nameEn: string; cities: string }>;
  shipping: ShippingOption[];
  payments: Array<{ id: "cod" | "bank"; code: "COD" | "BANK_TRANSFER"; fee: number; note: string; bank?: { bankName: string; holder: string } }>;
};

/** What the confirmation page shows; kept for this browser tab only. */
export const LAST_ORDER_KEY = "alsaif-last-order";

const EMPTY: Form = { name: "", phone: "", email: "", zone: "", city: "", street: "", notes: "" };

/** Shipping fee for a cart total, honouring the method's free-shipping threshold. The server repeats this. */
function shippingFee(method: ShippingOption, subtotal: number) {
  return method.freeOver !== null && subtotal >= method.freeOver ? 0 : method.fee;
}

export function CheckoutPage() {
  const { lang, t } = useLang();
  const copy = CHECKOUT_COPY[lang];
  const { lines, clear } = useCart();
  const { productById, copyOf } = useSiteContent();
  const { customer } = useCustomer();
  const [, navigate] = useLocation();
  const [options, setOptions] = useState<Options | null>(null);
  const [optionsError, setOptionsError] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [shippingId, setShippingId] = useState("");
  const [paymentId, setPaymentId] = useState<"cod" | "bank" | "">("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addressId, setAddressId] = useState<string>("new");
  const [saveAddress, setSaveAddress] = useState(true);

  // Shipping and payment options come from the store's database, the same settings the server prices with.
  useEffect(() => {
    const controller = new AbortController();
    api<Options>("/checkout/options", { signal: controller.signal })
      .then(setOptions)
      .catch(() => {
        if (!controller.signal.aborted) setOptionsError(true);
      });
    return () => controller.abort();
  }, []);

  // A signed-in customer starts with their details and main address filled in.
  useEffect(() => {
    if (!customer) return;
    setForm((current) => ({
      ...current,
      name: current.name || `${customer.firstName} ${customer.lastName}`,
      phone: current.phone || customer.phone,
      email: current.email || customer.email,
    }));
    api<{ addresses: SavedAddress[] }>("/account/addresses")
      .then((result) => {
        setAddresses(result.addresses);
        const main = result.addresses.find((item) => item.isDefault) ?? result.addresses[0];
        if (main) pickAddress(main);
      })
      .catch(() => setAddresses([]));
  }, [customer]);

  function pickAddress(address: SavedAddress | null) {
    setAddressId(address?.id ?? "new");
    setShippingId("");
    setForm((current) =>
      address
        ? { ...current, zone: address.zoneCode ?? "", city: address.city, street: address.line1, notes: address.notes }
        : { ...current, zone: "", city: "", street: "", notes: "" },
    );
  }

  const money = (value: number) => `${value.toLocaleString("en-US")} ${t.deals.currency}`;
  const set = (patch: Partial<Form>) => setForm((current) => ({ ...current, ...patch }));

  const rows = lines.flatMap((line) => {
    const product = productById(line.id);
    if (!product) return [];
    return [{ line, product, name: copyOf(lang, line.id)?.name ?? line.id }];
  });
  const subtotal = rows.reduce((sum, row) => sum + row.product.price * row.line.qty, 0);

  const zones = options?.zones ?? [];
  const methods = (options?.shipping ?? []).filter(
    (method) => (!form.zone || method.zones.includes(form.zone)) && (method.minOrder === null || subtotal >= method.minOrder),
  );
  const shipping = methods.find((method) => method.code === shippingId) ?? null;
  const payments = options?.payments ?? [];
  const payment = payments.find((item) => item.id === paymentId) ?? null;
  const shipCost = shipping ? shippingFee(shipping, subtotal) : 0;
  const payCost = payment?.fee ?? 0;
  const total = subtotal + shipCost + payCost;

  const errors = useMemo(() => {
    const found: Partial<Record<Field, string>> = {};
    if (form.name.trim().length < 2) found.name = copy.required;
    const phone = form.phone.replace(/\s|-/g, "");
    if (!phone) found.phone = copy.required;
    else if (!/^05\d{8}$/.test(phone)) found.phone = copy.badPhone;
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) found.email = copy.badEmail;
    if (!form.zone) found.zone = copy.required;
    if (form.city.trim().length < 2) found.city = copy.required;
    if (form.street.trim().length < 3) found.street = copy.required;
    if (!shipping) found.shipping = copy.pickShipping;
    if (!payment) found.payment = copy.pickPayment;
    return found;
  }, [form, shipping, payment, copy]);
  const show = (field: Field) => (tried ? errors[field] : undefined);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setTried(true);
    setSubmitError("");
    if (Object.keys(errors).length || !shipping || !payment || !rows.length) {
      document.querySelector("[data-error]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setBusy(true);
    try {
      // The server recomputes prices, fees and stock; only what to buy and where to deliver is sent.
      const result = await api<{ order: Record<string, unknown> }>("/orders", {
        body: {
          customer: { fullName: form.name.trim(), phone: form.phone.replace(/\s|-/g, ""), ...(form.email.trim() ? { email: form.email.trim() } : {}) },
          address: { zoneCode: form.zone, city: form.city.trim(), line1: form.street.trim(), ...(form.notes.trim() ? { notes: form.notes.trim() } : {}) },
          shippingMethodCode: shipping.code,
          paymentMethod: payment.code,
          items: rows.map((row) => ({ productId: row.product.id, quantity: row.line.qty })),
          locale: lang,
          ...(customer && addressId === "new" && saveAddress ? { saveAddress: {} } : {}),
        },
      });
      try {
        sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ ...result.order, bank: payment.bank ?? null, note: payment.note }));
      } catch {
        // Storage can be blocked; the confirmation page then shows a short thank-you only.
      }
      clear();
      navigate(`/${lang}/order/confirmed`);
    } catch (failure) {
      setSubmitError(copy.orderErrors[errorCode(failure)] ?? copy.orderErrors.generic);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-svh bg-[var(--tone-b)] text-navy">
      <SiteHeader />
      <main id="main" tabIndex={-1} className="tone-scope page-shell min-h-[60svh] py-10 outline-none">
        <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">{copy.checkout}</h1>
        <p className="mt-2 max-w-xl text-sm leading-7 text-navy/60">{rows.length ? copy.checkoutLead : copy.emptyCart}</p>

        {!rows.length ? (
          <Link href={`/${lang}`} className="mt-6 inline-flex h-11 items-center rounded-full bg-[#20C5D4] px-6 text-sm font-semibold text-navy transition-colors hover:bg-brand-hover">
            {copy.backToStore}
          </Link>
        ) : optionsError ? (
          <div className="mt-8 rounded-[1.25rem] border border-navy/10 bg-white p-6 text-sm leading-7 text-navy/70">
            <p>{copy.optionsError}</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-4 inline-flex h-11 cursor-pointer items-center rounded-full bg-brand px-6 text-sm font-semibold text-navy hover:bg-brand-hover">
              {copy.retry}
            </button>
          </div>
        ) : !options ? (
          <div className="mt-12 grid place-items-center text-navy/40">
            <LoaderCircle className="size-6 animate-spin" />
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="space-y-6">
              {!customer ? (
                <p className="flex flex-wrap items-center gap-2 rounded-2xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy/70">
                  <UserRound className="size-4 text-brand-ink" />
                  {copy.haveAccount}
                  <Link href={`/${lang}/login?next=${encodeURIComponent(`/${lang}/checkout`)}`} className="font-semibold text-brand-ink hover:underline">
                    {copy.signInToFill}
                  </Link>
                </p>
              ) : null}
              <Card title={copy.customer} step={1}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label={copy.name} value={form.name} onChange={(name) => set({ name })} error={show("name")} autoComplete="name" />
                  <Input label={copy.phone} value={form.phone} onChange={(phone) => set({ phone })} error={show("phone")} placeholder={copy.phoneHint} type="tel" dir="ltr" autoComplete="tel" />
                  <div className="sm:col-span-2">
                    <Input label={`${copy.email} (${copy.optional})`} value={form.email} onChange={(email) => set({ email })} error={show("email")} type="email" dir="ltr" autoComplete="email" />
                  </div>
                </div>
              </Card>

              <Card title={copy.address} step={2}>
                {addresses.length ? (
                  <div className="mb-5 grid gap-2 sm:grid-cols-2">
                    {addresses.map((item) => (
                      <Choice key={item.id} name="saved-address" checked={addressId === item.id} onChange={() => pickAddress(item)} icon={Truck}>
                        <span className="block font-semibold">{item.label || item.city}</span>
                        <span className="mt-0.5 block text-xs text-navy/60">
                          {item.city}، {item.line1}
                        </span>
                      </Choice>
                    ))}
                    <Choice name="saved-address" checked={addressId === "new"} onChange={() => pickAddress(null)} icon={Truck}>
                      <span className="block font-semibold">{copy.newAddress}</span>
                    </Choice>
                  </div>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium">{copy.zone}</span>
                    <select
                      value={form.zone}
                      onChange={(event) => {
                        set({ zone: event.target.value });
                        setShippingId("");
                      }}
                      className={inputClass(show("zone"))}
                    >
                      <option value="">{copy.chooseZone}</option>
                      {zones.map((zone) => (
                        <option key={zone.code} value={zone.code}>
                          {lang === "en" && zone.nameEn ? zone.nameEn : zone.nameAr} {zone.cities ? `(${zone.cities})` : ""}
                        </option>
                      ))}
                    </select>
                    <ErrorText text={show("zone")} />
                  </label>
                  <Input label={copy.city} value={form.city} onChange={(city) => set({ city })} error={show("city")} autoComplete="address-level2" />
                  <div className="sm:col-span-2">
                    <Input label={copy.street} value={form.street} onChange={(street) => set({ street })} error={show("street")} placeholder={copy.streetHint} autoComplete="street-address" />
                  </div>
                  <div className="sm:col-span-2">
                    <Input label={`${copy.notes} (${copy.optional})`} value={form.notes} onChange={(notes) => set({ notes })} multiline />
                  </div>
                  {customer && addressId === "new" ? (
                    <label className="flex cursor-pointer items-center gap-2 text-sm sm:col-span-2">
                      <input type="checkbox" checked={saveAddress} onChange={(event) => setSaveAddress(event.target.checked)} className="size-4 accent-[var(--brand)]" />
                      {copy.saveAddress}
                    </label>
                  ) : null}
                </div>
              </Card>

              <Card title={copy.shipping} step={3}>
                {methods.length ? (
                  <div className="grid gap-3">
                    {methods.map((method) => {
                      const fee = shippingFee(method, subtotal);
                      return (
                        <Choice key={method.code} name="shipping" checked={shippingId === method.code} onChange={() => setShippingId(method.code)} icon={Truck}>
                          <span className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold">{lang === "ar" ? method.nameAr : method.nameEn}</span>
                            <span className="font-bold text-brand-ink">{fee ? money(fee) : copy.free}</span>
                          </span>
                          <span className="mt-1 block text-xs text-navy/60">
                            {method.etaMax === 0 ? copy.sameDay : copy.days(method.etaMin, method.etaMax)}
                            {method.freeOver !== null && fee > 0 ? ` · ${copy.freeOver(money(method.freeOver))}` : ""}
                          </span>
                        </Choice>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-navy/60">{copy.noShipping}</p>
                )}
                <ErrorText text={show("shipping")} />
              </Card>

              <Card title={copy.payment} step={4}>
                <div className="grid gap-3">
                  {payments.map((item) => (
                    <Choice key={item.id} name="payment" checked={paymentId === item.id} onChange={() => setPaymentId(item.id)} icon={item.id === "cod" ? Banknote : Landmark}>
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold">{item.id === "cod" ? copy.cod : copy.bank}</span>
                        {item.fee ? <span className="text-xs text-navy/60">{copy.extraFee(money(item.fee))}</span> : null}
                      </span>
                      <span className="mt-1 block text-xs text-navy/60">{item.id === "cod" ? copy.codLead : copy.bankLead}</span>
                    </Choice>
                  ))}
                  <div className="flex items-center gap-3 rounded-2xl border border-dashed border-navy/15 p-4 text-navy/45">
                    <CreditCard className="size-5 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{copy.online}</span>
                      <span className="block text-xs">{copy.onlineLead}</span>
                    </span>
                    <span className="rounded-full bg-navy/5 px-2.5 py-1 text-xs">{copy.unavailable}</span>
                  </div>
                  {!payments.length ? <p className="text-sm text-navy/60">{copy.noPayment}</p> : null}
                </div>
                <ErrorText text={show("payment")} />
              </Card>
            </div>

            <aside className="rounded-[1.25rem] border border-navy/10 bg-white p-5 lg:sticky lg:top-40">
              <h2 className="text-lg font-bold">{copy.summary}</h2>
              <ul className="mt-4 space-y-3">
                {rows.map(({ line, product, name }) => (
                  <li key={line.id} className="flex items-center gap-3">
                    <span className="relative shrink-0">
                      <img src={productPhoto(product)} alt="" className="size-14 rounded-xl border border-navy/10 object-contain p-1" />
                      <span className="absolute -end-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-navy text-[11px] font-bold text-white">{line.qty}</span>
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
                    <span className="text-sm font-semibold">{money(product.price * line.qty)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-5 space-y-2 border-t border-navy/10 pt-4 text-sm">
                <Row label={copy.subtotal} value={money(subtotal)} />
                <Row label={copy.shippingFee} value={shipping ? (shipCost ? money(shipCost) : copy.free) : "—"} />
                {payCost ? <Row label={copy.paymentFee} value={money(payCost)} /> : null}
                <div className="flex items-center justify-between border-t border-navy/10 pt-3 text-base font-bold">
                  <dt>{copy.total}</dt>
                  <dd className="text-xl text-brand-ink">{money(total)}</dd>
                </div>
              </dl>
              {submitError ? (
                <p role="alert" className="mt-4 rounded-xl bg-burgundy/10 px-3 py-2.5 text-sm text-burgundy">
                  {submitError}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={busy}
                className="mt-5 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#20C5D4] text-sm font-bold text-navy transition-colors hover:bg-brand-hover disabled:cursor-default disabled:opacity-70"
              >
                {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
                {copy.placeOrder}
              </button>
              <p className="mt-3 text-xs leading-6 text-navy/55">{copy.placeNote}</p>
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-[#eef4fc] p-3 text-xs leading-6 text-navy/70">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-ink" />
                {copy.localNote}
              </p>
            </aside>
          </form>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Card({ title, step, children }: { title: string; step: number; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.25rem] border border-navy/10 bg-white p-5 sm:p-6">
      <h2 className="flex items-center gap-3 text-lg font-bold">
        <span className="grid size-8 place-items-center rounded-full bg-[#20C5D4]/20 text-sm text-brand-ink">{step}</span>
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function inputClass(error?: string) {
  return `h-11 w-full rounded-xl border bg-white px-3 text-sm text-navy outline-none transition focus:border-brand ${error ? "border-burgundy" : "border-navy/15"}`;
}

function ErrorText({ text }: { text?: string }) {
  return text ? (
    <p data-error className="mt-1.5 text-xs font-medium text-burgundy">
      {text}
    </p>
  ) : null;
}

function Input({
  label,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
  dir,
  multiline,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
  dir?: "ltr" | "rtl";
  multiline?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={2} className={`${inputClass(error)} h-auto py-2.5`} />
      ) : (
        <input
          type={type}
          dir={dir}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass(error)} ${dir === "ltr" ? "text-start" : ""}`}
        />
      )}
      <ErrorText text={error} />
    </label>
  );
}

function Choice({
  name,
  checked,
  onChange,
  icon: Icon,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${checked ? "border-brand bg-[#20C5D4]/10" : "border-navy/10 hover:border-navy/25"}`}>
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 ${checked ? "border-brand-ink" : "border-navy/25"}`}>
        {checked ? <span className="size-2.5 rounded-full bg-brand-ink" /> : null}
      </span>
      <Icon className="mt-0.5 size-5 shrink-0 text-brand-ink" />
      <span className="min-w-0 flex-1 text-sm">{children}</span>
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-navy/60">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
