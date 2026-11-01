import { useState } from "react";
import { Banknote, CheckCircle2, Landmark, MapPin, Truck } from "lucide-react";
import { Link, Redirect } from "wouter";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { CHECKOUT_COPY } from "@/lib/checkout-copy";
import { useCustomer } from "@/lib/customer";
import { useLang } from "@/lib/i18n";
import { LAST_ORDER_KEY } from "@/pages/CheckoutPage";

// Order confirmation right after checkout. The order number is for the store's staff (dashboard only), so
// this page shows what was ordered, where it goes and what happens next. Customers with an account follow
// their orders from the account page; the old "track by number" page sends them there.

type PlacedOrder = {
  paymentMethod: "COD" | "BANK_TRANSFER";
  subtotal: string;
  shippingFee: string;
  paymentFee: string;
  total: string;
  customerName: string;
  customerPhone: string;
  city: string;
  addressLine: string;
  zoneName: string;
  shippingMethodName: string;
  linkedToAccount: boolean;
  items: Array<{ id: string; productName: string; quantity: number; lineTotal: string }>;
  bank: { bankName: string; holder: string } | null;
  note: string;
};

function readLastOrder(): PlacedOrder | null {
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_KEY);
    return raw ? (JSON.parse(raw) as PlacedOrder) : null;
  } catch {
    return null;
  }
}

export function OrderPage({ id }: { id: string }) {
  const { lang, t } = useLang();
  const copy = CHECKOUT_COPY[lang];
  const { customer } = useCustomer();
  const [order] = useState(readLastOrder);

  // Links to old browser-only orders (test data) lead to the account or the store.
  if (id !== "confirmed") return <Redirect to={customer ? `/${lang}/account` : `/${lang}`} replace />;

  const money = (value: string) => `${Number(value).toLocaleString("en-US")} ${t.deals.currency}`;

  return (
    <div className="min-h-svh bg-[var(--tone-b)] text-navy">
      <SiteHeader />
      <main id="main" tabIndex={-1} className="tone-scope page-shell min-h-[60svh] py-10 outline-none">
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-col items-center text-center">
            <span className="grid size-16 place-items-center rounded-full bg-[#12875a]/10 text-[#12875a]">
              <CheckCircle2 className="size-8" />
            </span>
            <h1 className="mt-4 text-2xl font-bold sm:text-3xl">{copy.thanks}</h1>
            <p className="mt-2 max-w-md text-sm leading-7 text-navy/60">{copy.thanksLead}</p>
          </div>

          {order ? (
            <section className="mt-8 rounded-[1.25rem] border border-navy/10 bg-white p-5 sm:p-6">
              <h2 className="text-lg font-bold">{copy.items}</h2>
              <ul className="mt-3 divide-y divide-navy/10">
                {order.items.map((item, index) => (
                  <li key={`${item.id}-${index}`} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <Link href={`/${lang}/p/${encodeURIComponent(item.id)}`} className="min-w-0 flex-1 truncate hover:text-brand-ink">
                      {item.productName}
                    </Link>
                    <span className="text-navy/50">× {item.quantity}</span>
                    <span className="font-semibold">{money(item.lineTotal)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-3 space-y-1.5 border-t border-navy/10 pt-3 text-sm">
                <Row label={copy.subtotal} value={money(order.subtotal)} />
                <Row label={copy.shippingFee} value={Number(order.shippingFee) ? money(order.shippingFee) : copy.free} />
                {Number(order.paymentFee) ? <Row label={copy.paymentFee} value={money(order.paymentFee)} /> : null}
                <div className="flex items-center justify-between border-t border-navy/10 pt-2.5 text-base font-bold">
                  <dt>{copy.total}</dt>
                  <dd className="text-xl text-brand-ink">{money(order.total)}</dd>
                </div>
              </dl>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Info icon={MapPin} title={copy.deliverTo}>
                  {order.customerName} · <span dir="ltr">{order.customerPhone}</span>
                  <br />
                  {order.zoneName} · {order.city}، {order.addressLine}
                </Info>
                <Info icon={Truck} title={copy.shippedWith}>
                  {order.shippingMethodName}
                </Info>
                <Info icon={order.paymentMethod === "COD" ? Banknote : Landmark} title={copy.paidWith}>
                  {order.paymentMethod === "COD" ? copy.cod : copy.bank}
                  <br />
                  <span className="text-navy/60">{order.paymentMethod === "COD" ? copy.codNext : copy.bankNext}</span>
                </Info>
                {order.paymentMethod === "BANK_TRANSFER" && order.bank && (order.bank.bankName || order.bank.holder) ? (
                  <Info icon={Landmark} title={copy.bankDetails}>
                    {order.bank.bankName ? (
                      <>
                        {copy.bankName}: {order.bank.bankName}
                        <br />
                      </>
                    ) : null}
                    {order.bank.holder ? (
                      <>
                        {copy.bankHolder}: {order.bank.holder}
                      </>
                    ) : null}
                  </Info>
                ) : null}
              </div>
            </section>
          ) : null}

          <div className="mt-6 rounded-[1.25rem] border border-navy/10 bg-white p-5 text-center text-sm leading-7 text-navy/70">
            <p>{order?.linkedToAccount || customer ? copy.accountTrack : copy.guestTrack}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {customer ? (
                <Link href={`/${lang}/account`} className="btn-brand">
                  {copy.viewOrders}
                </Link>
              ) : (
                <Link href={`/${lang}/login?tab=register`} className="btn-brand">
                  {copy.createAccount}
                </Link>
              )}
              <Link href={`/${lang}`} className="inline-flex h-12 items-center rounded-full border border-navy/15 px-6 text-sm font-semibold text-navy hover:bg-navy/5">
                {copy.keepShopping}
              </Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

/** The old "track by order number" page: orders are now followed from the account. */
export function TrackPage() {
  const { lang } = useLang();
  const { customer, ready } = useCustomer();
  if (!ready) return null;
  return <Redirect to={customer ? `/${lang}/account` : `/${lang}/login?next=${encodeURIComponent(`/${lang}/account`)}`} replace />;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-navy/60">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function Info({ icon: Icon, title, children }: { icon: typeof MapPin; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-[var(--tone-b)] p-4 text-sm leading-6">
      <p className="mb-1 flex items-center gap-2 font-semibold">
        <Icon className="size-4 text-brand-ink" />
        {title}
      </p>
      <div className="text-navy/80">{children}</div>
    </div>
  );
}
