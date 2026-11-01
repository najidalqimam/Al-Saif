import type { ComponentType, ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { AlertTriangle, ChevronDown, Info, Search, X } from "lucide-react";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type IconType = ComponentType<{ className?: string }>;

// Western digits everywhere in the dashboard, matching the storefront ("1,649 ر.س").
const western = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
export const sar = { format: (value: number) => `${western.format(value)} ر.س` };
export const num = new Intl.NumberFormat("en-US");
/** Gregorian dates in Arabic with Western digits, e.g. "28 أكتوبر". */
export const AR_DATE = "ar-SA-u-nu-latn-ca-gregory";

export function PageHead({ title, lead, actions }: { title: string; lead?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {lead ? <p className="mt-1 max-w-3xl text-sm text-(--a-muted)">{lead}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  lead,
  actions,
  className,
  children,
}: {
  title?: string;
  lead?: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border border-(--a-line) bg-(--a-surface) shadow-(--a-shadow)", className)}>
      {title ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--a-line) px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-semibold">{title}</h2>
            {lead ? <p className="mt-0.5 text-xs text-(--a-muted)">{lead}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  note,
  icon: Icon,
  tone = "blue",
  onClick,
}: {
  label: string;
  value: string;
  note: string;
  icon: IconType;
  /** ok = good, warn = needs attention, danger = problem, blue/accent = plain information. */
  tone?: "accent" | "blue" | "ok" | "warn" | "danger";
  /** Accepted for older call sites; the dashboard shows one demo notice at the top instead. */
  demo?: boolean;
  onClick?: () => void;
}) {
  const tones = {
    accent: "bg-(--a-blue-soft) text-(--a-blue)",
    blue: "bg-(--a-blue-soft) text-(--a-blue)",
    ok: "bg-(--a-ok-soft) text-(--a-ok)",
    warn: "bg-(--a-warn-soft) text-(--a-warn)",
    danger: "bg-(--a-danger-soft) text-(--a-danger)",
  };
  const body = (
    <div className="flex items-start gap-3.5">
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", tones[tone])}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-(--a-muted)">{label}</p>
        <p className="mt-0.5 text-2xl leading-8 font-bold tracking-tight tabular-nums">{value}</p>
        <p className="mt-0.5 text-xs leading-5 text-(--a-muted)">{note}</p>
      </div>
    </div>
  );
  const shell = "block w-full rounded-2xl border border-(--a-line) bg-(--a-surface) p-4 text-start shadow-(--a-shadow) transition duration-200";
  return onClick ? (
    <button type="button" onClick={onClick} className={cn(shell, "hover:border-(--a-blue)/40")}>
      {body}
    </button>
  ) : (
    <article className={shell}>{body}</article>
  );
}

/** Banner that says a page runs on sample or local data and what it is not connected to. */
export function DemoNote({ title = "بيانات تجريبية", children }: { title?: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-(--a-blue)/25 bg-(--a-blue-soft) px-4 py-3.5 text-sm leading-7">
      <Info className="mt-1.5 size-4 shrink-0 text-(--a-blue)" />
      <p>
        <span className="font-semibold">{title}: </span>
        {children}
      </p>
    </div>
  );
}

export function Select<T extends string>({
  label,
  value,
  onChange,
  options,
  disabled,
  hideLabel,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<[T, string]>;
  disabled?: boolean;
  hideLabel?: boolean;
}) {
  return (
    <label className="block">
      <span className={cn("mb-1.5 block text-xs font-medium text-(--a-muted)", hideLabel && "sr-only")}>{label}</span>
      <span className="relative block">
        <select
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value as T)}
          className={cn(control, "h-10 appearance-none bg-(--a-surface) pe-9")}
        >
          {options.map(([id, text]) => (
            <option key={id} value={id}>
              {text}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute inset-y-0 end-3 my-auto size-4 text-(--a-muted)" />
      </span>
    </label>
  );
}

/** Whole-number input; an empty box reports null so a value can be cleared. */
export function NumberField({
  label,
  value,
  onChange,
  suffix,
  disabled,
  placeholder,
  hideLabel,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  suffix?: string;
  disabled?: boolean;
  placeholder?: string;
  hideLabel?: boolean;
}) {
  return (
    <label className="block">
      <span className={cn("mb-1.5 block text-xs font-medium text-(--a-muted)", hideLabel && "sr-only")}>{label}</span>
      <span className="relative block">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          dir="ltr"
          value={value ?? ""}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
          className={cn(control, "h-10 text-left tabular-nums", suffix && "pr-12")}
        />
        {suffix ? <span className="pointer-events-none absolute inset-y-0 right-3 my-auto h-fit text-xs text-(--a-muted)">{suffix}</span> : null}
      </span>
    </label>
  );
}

export function Badge({ tone = "muted", children }: { tone?: "muted" | "accent" | "blue" | "ok" | "warn" | "danger"; children: ReactNode }) {
  const tones = {
    muted: "bg-(--a-surface-2) text-(--a-muted)",
    accent: "bg-(--a-blue-soft) text-(--a-blue)",
    blue: "bg-(--a-blue-soft) text-(--a-blue)",
    ok: "bg-(--a-ok-soft) text-(--a-ok)",
    warn: "bg-(--a-warn-soft) text-(--a-warn)",
    danger: "bg-(--a-danger-soft) text-(--a-danger)",
  };
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>;
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
  size = "md",
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
  /** sm for rows in tables and lists, so the switches stay quieter than the names and prices. */
  size?: "sm" | "md";
}) {
  const small = size === "sm";
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      aria-label={label}
      title={label}
      dir="ltr"
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-full bg-(--a-surface-2) ring-1 ring-(--a-line) transition-colors data-[state=checked]:bg-(--a-blue) data-[state=checked]:ring-transparent disabled:cursor-not-allowed disabled:opacity-40",
        small ? "h-5 w-9" : "h-6 w-11",
      )}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "block translate-x-0.5 rounded-full bg-white shadow transition-transform",
          small ? "size-4 data-[state=checked]:translate-x-[18px]" : "size-5 data-[state=checked]:translate-x-[22px]",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export function Button({
  children,
  onClick,
  variant = "ghost",
  icon: Icon,
  disabled,
  type = "button",
  className,
}: {
  children?: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  icon?: IconType;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  const variants = {
    primary: "bg-(--a-accent) text-[#0b1220] hover:brightness-110",
    ghost: "border border-(--a-line) bg-(--a-surface) text-(--a-text) hover:bg-(--a-surface-2)",
    danger: "bg-(--a-danger) text-white hover:brightness-110",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
    >
      {Icon ? <Icon className="size-4" /> : null}
      {children}
    </button>
  );
}

export function IconButton({ icon: Icon, label, onClick, tone = "muted" }: { icon: IconType; label: string; onClick: () => void; tone?: "muted" | "danger" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-9 place-items-center rounded-lg transition",
        tone === "danger" ? "text-(--a-muted) hover:bg-(--a-danger-soft) hover:text-(--a-danger)" : "text-(--a-muted) hover:bg-(--a-surface-2) hover:text-(--a-text)",
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="relative block min-w-52 flex-1">
      <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-(--a-muted)" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full rounded-xl border border-(--a-line) bg-(--a-surface) ps-9 pe-3 text-sm outline-none placeholder:text-(--a-muted) focus:border-(--a-accent)"
      />
    </label>
  );
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (value: T) => void; items: Array<[T, string, number?]> }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-(--a-line) bg-(--a-surface) p-1">
      {items.map(([id, label, count]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm transition",
            value === id ? "bg-(--a-surface-2) font-medium text-(--a-text)" : "text-(--a-muted) hover:text-(--a-text)",
          )}
        >
          {label}
          {count !== undefined ? <span className="text-xs tabular-nums text-(--a-muted)">{num.format(count)}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Empty({ icon: Icon, title, lead }: { icon: IconType; title: string; lead: string }) {
  return (
    <div className="grid place-items-center gap-2 px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-(--a-surface-2) text-(--a-muted)">
        <Icon className="size-5" />
      </span>
      <p className="font-medium">{title}</p>
      <p className="max-w-sm text-sm text-(--a-muted)">{lead}</p>
    </div>
  );
}

/** Side sheet used for every add and edit form. */
export function Drawer({
  open,
  onClose,
  title,
  lead,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  lead?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" style={{ background: "rgb(0 0 0 / 0.5)" }} />
        <Dialog.Content
          dir="rtl"
          className="admin fixed inset-y-0 end-0 z-50 flex w-full max-w-xl flex-col border-s border-(--a-line) shadow-2xl data-[state=open]:animate-in data-[state=open]:slide-in-from-left"
        >
          <div className="flex items-start justify-between gap-3 border-b border-(--a-line) px-6 py-5">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-bold">{title}</Dialog.Title>
              {lead ? <Dialog.Description className="mt-1 text-sm text-(--a-muted)">{lead}</Dialog.Description> : <Dialog.Description className="sr-only">{title}</Dialog.Description>}
            </div>
            <Dialog.Close asChild>
              <button type="button" aria-label="إغلاق" className="grid size-9 place-items-center rounded-lg text-(--a-muted) hover:bg-(--a-surface-2)">
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer ? <div className="flex flex-wrap items-center justify-end gap-2 border-t border-(--a-line) px-6 py-4">{footer}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function Confirm({
  open,
  onClose,
  onConfirm,
  title,
  lead,
  action,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  lead: string;
  action: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50" style={{ background: "rgb(0 0 0 / 0.5)" }} />
        <Dialog.Content
          dir="rtl"
          className="admin fixed inset-x-4 top-1/2 z-50 mx-auto w-auto max-w-md -translate-y-1/2 rounded-2xl border border-(--a-line) p-6 shadow-2xl"
        >
          <span className="grid size-11 place-items-center rounded-xl bg-(--a-danger-soft) text-(--a-danger)">
            <AlertTriangle className="size-5" />
          </span>
          <Dialog.Title className="mt-4 text-lg font-bold">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-7 text-(--a-muted)">{lead}</Dialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <Button onClick={onClose}>إلغاء</Button>
            <Button
              variant="danger"
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {action}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export const control =
  "w-full rounded-xl border border-(--a-line) bg-(--a-bg) px-3 text-sm outline-none placeholder:text-(--a-muted) focus:border-(--a-accent) disabled:opacity-60";

export function Field({
  label,
  value,
  onChange,
  type = "text",
  multiline = false,
  dir,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  multiline?: boolean;
  dir?: "rtl" | "ltr";
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-(--a-muted)">{label}</span>
      {multiline ? (
        <textarea dir={dir} value={value} rows={3} disabled={disabled} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={cn(control, "py-2")} />
      ) : (
        <input dir={dir} type={type} value={value} disabled={disabled} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={cn(control, "h-10")} />
      )}
    </label>
  );
}

export function BilingualField({
  label,
  ar,
  en,
  onAr,
  onEn,
  multiline = false,
  disabled,
}: {
  label: string;
  ar: string;
  en: string;
  onAr: (value: string) => void;
  onEn: (value: string) => void;
  multiline?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <LangField lang="ar" label={label} value={ar} onChange={onAr} multiline={multiline} disabled={disabled} />
      <LangField lang="en" label={label} value={en} onChange={onEn} multiline={multiline} disabled={disabled} />
    </div>
  );
}

function LangField({
  lang,
  label,
  value,
  onChange,
  multiline,
  disabled,
}: {
  lang: Lang;
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline: boolean;
  disabled?: boolean;
}) {
  const english = lang === "en";
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-xs font-medium text-(--a-muted)">
        <span className={cn("rounded px-1.5 py-px text-[10px] font-semibold", english ? "bg-(--a-blue-soft) text-(--a-blue)" : "bg-(--a-accent-soft) text-(--a-accent-ink)")}>
          {english ? "EN" : "AR"}
        </span>
        {label}
      </span>
      {multiline ? (
        <textarea dir={english ? "ltr" : "rtl"} value={value} rows={3} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={cn(control, "py-2")} />
      ) : (
        <input dir={english ? "ltr" : "rtl"} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={cn(control, "h-10")} />
      )}
    </label>
  );
}

/** Shown on add forms whose saving needs the database and image storage from the next stage. */
export function PendingNote() {
  return (
    <div className="mb-5 flex gap-3 rounded-xl border border-(--a-line) bg-(--a-blue-soft) p-4 text-sm leading-7">
      <AlertTriangle className="mt-1 size-4 shrink-0 text-(--a-blue)" />
      <p>
        إضافة عنصر جديد تحتاج رفع صورة وحفظه في قاعدة البيانات، وهذا يتفعّل في المرحلة الثالثة مع ربط Supabase. النموذج جاهز، وزر الحفظ يشتغل بعد الربط.
      </p>
    </div>
  );
}
