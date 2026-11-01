import { useState } from "react";
import { Eye, EyeOff, LoaderCircle, LogIn, UserPlus } from "lucide-react";
import { Link, Redirect, useLocation, useSearch } from "wouter";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ACCOUNT_COPY } from "@/lib/account-copy";
import { errorCode, useCustomer } from "@/lib/customer";
import { useLang } from "@/lib/i18n";

type Mode = "signin" | "register";
type Form = { firstName: string; lastName: string; phone: string; email: string; password: string };
const EMPTY: Form = { firstName: "", lastName: "", phone: "", email: "", password: "" };

/** Only same-site paths are followed after signing in (no open redirects). */
function safeNext(value: string | null, lang: string) {
  return value && /^\/(ar|en)\/[a-z0-9/_-]*$/i.test(value) ? value : `/${lang}/account`;
}

export function AuthPage() {
  const { lang } = useLang();
  const copy = ACCOUNT_COPY[lang];
  const { customer, ready, login, register } = useCustomer();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(useSearch());
  const next = safeNext(params.get("next"), lang);
  const [mode, setMode] = useState<Mode>(params.get("tab") === "register" ? "register" : "signin");
  const [form, setForm] = useState<Form>(EMPTY);
  const [show, setShow] = useState(false);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (ready && customer) return <Redirect to={next} replace />;

  const set = (patch: Partial<Form>) => setForm((current) => ({ ...current, ...patch }));
  const phone = form.phone.replace(/[\s-]/g, "");
  // Signing in accepts the mobile number or the email; registering needs the mobile number in this field.
  const isEmailLogin = mode === "signin" && form.phone.includes("@");
  const fieldErrors: Partial<Record<keyof Form, string>> = {};
  if (!phone) fieldErrors.phone = copy.errors.required;
  else if (isEmailLogin ? !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.phone.trim()) : !/^05\d{8}$/.test(phone)) {
    fieldErrors.phone = mode === "signin" ? copy.errors.badLogin : copy.errors.badPhone;
  }
  if (!form.password) fieldErrors.password = copy.errors.required;
  if (mode === "register") {
    for (const key of ["firstName", "lastName"] as const) {
      if (!form[key].trim()) fieldErrors[key] = copy.errors.required;
      else if (!/^[\p{L}\p{M}' .-]+$/u.test(form[key].trim())) fieldErrors[key] = copy.errors.badName;
    }
    if (!form.email.trim()) fieldErrors.email = copy.errors.required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) fieldErrors.email = copy.errors.badEmail;
    if (form.password && form.password.length < 8) fieldErrors.password = copy.errors.shortPassword;
  }
  const fieldError = (key: keyof Form) => (tried ? fieldErrors[key] : undefined);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setTried(true);
    setError("");
    if (Object.keys(fieldErrors).length) return;
    setBusy(true);
    try {
      if (mode === "signin") await login(form.phone, form.password);
      else await register({ ...form, phone, locale: lang });
      navigate(next, { replace: true });
    } catch (failure) {
      const code = errorCode(failure);
      setError(copy.errors[code] ?? copy.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  function switchMode(target: Mode) {
    setMode(target);
    setTried(false);
    setError("");
  }

  return (
    <div className="min-h-svh bg-[var(--tone-b)] text-navy">
      <SiteHeader />
      <main id="main" tabIndex={-1} className="tone-scope page-shell grid min-h-[60svh] place-items-center py-10 outline-none">
        <div className="w-full max-w-md rounded-3xl border border-navy/10 bg-white p-6 shadow-[0_10px_28px_rgba(11,18,32,0.06)] sm:p-8">
          <div role="tablist" className="grid grid-cols-2 gap-1 rounded-full bg-[var(--tone-b)] p-1">
            {(["signin", "register"] as const).map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={mode === item}
                onClick={() => switchMode(item)}
                className={`h-10 cursor-pointer rounded-full text-sm font-semibold transition-colors ${mode === item ? "bg-white text-brand-ink shadow-sm" : "text-navy/60 hover:text-navy"}`}
              >
                {item === "signin" ? copy.signIn : copy.register}
              </button>
            ))}
          </div>

          <h1 className="mt-6 text-2xl font-bold">{mode === "signin" ? copy.signInTitle : copy.registerTitle}</h1>
          <p className="mt-1 text-sm leading-7 text-navy/60">{mode === "signin" ? copy.signInLead : copy.registerLead}</p>

          <form onSubmit={submit} noValidate className="mt-6 space-y-4">
            {mode === "register" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={copy.firstName} value={form.firstName} onChange={(firstName) => set({ firstName })} error={fieldError("firstName")} autoComplete="given-name" />
                <Field label={copy.lastName} value={form.lastName} onChange={(lastName) => set({ lastName })} error={fieldError("lastName")} autoComplete="family-name" />
              </div>
            ) : null}
            {mode === "signin" ? (
              <Field
                label={copy.loginId}
                value={form.phone}
                onChange={(value) => set({ phone: value })}
                error={fieldError("phone")}
                placeholder={copy.loginIdHint}
                type="text"
                dir="ltr"
                autoComplete="username"
              />
            ) : (
              <Field label={copy.phone} value={form.phone} onChange={(value) => set({ phone: value })} error={fieldError("phone")} placeholder={copy.phoneHint} type="tel" dir="ltr" autoComplete="tel" />
            )}
            {mode === "register" ? (
              <Field label={copy.email} value={form.email} onChange={(email) => set({ email })} error={fieldError("email")} type="email" dir="ltr" autoComplete="email" />
            ) : null}
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">{copy.password}</span>
              <span className="relative block">
                <input
                  type={show ? "text" : "password"}
                  dir="ltr"
                  value={form.password}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  onChange={(event) => set({ password: event.target.value })}
                  className={`${inputClass(fieldError("password"))} pl-11 text-left`}
                />
                <button
                  type="button"
                  onClick={() => setShow((value) => !value)}
                  aria-label={show ? copy.hidePassword : copy.showPassword}
                  aria-pressed={show}
                  // The password is typed left to right, so the eye sits on the left in both languages.
                  className="absolute inset-y-0 left-1 grid w-10 cursor-pointer place-items-center text-navy/50 hover:text-navy"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </span>
              {mode === "register" && !fieldError("password") ? <span className="mt-1.5 block text-xs text-navy/50">{copy.passwordHint}</span> : null}
              <ErrorText text={fieldError("password")} />
            </label>

            {error ? (
              <p role="alert" className="rounded-xl bg-burgundy/10 px-3 py-2.5 text-sm text-burgundy">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand text-sm font-bold text-navy transition-colors hover:bg-brand-hover disabled:cursor-default disabled:opacity-70"
            >
              {busy ? <LoaderCircle className="size-4 animate-spin" /> : mode === "signin" ? <LogIn className="size-4" /> : <UserPlus className="size-4" />}
              {busy ? copy.working : mode === "signin" ? copy.signInAction : copy.registerAction}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-navy/60">
            {mode === "signin" ? copy.noAccount : copy.haveAccount}{" "}
            <button type="button" onClick={() => switchMode(mode === "signin" ? "register" : "signin")} className="cursor-pointer font-semibold text-brand-ink hover:underline">
              {mode === "signin" ? copy.register : copy.signIn}
            </button>
          </p>
          <p className="mt-3 text-center text-xs leading-6 text-navy/45">
            <Link href={`/${lang}/checkout`} className="hover:text-navy">
              {copy.guestNote}
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function inputClass(error?: string) {
  return `h-11 w-full rounded-xl border bg-white px-3 text-sm text-navy outline-none transition focus:border-brand ${error ? "border-burgundy" : "border-navy/15"}`;
}

export function ErrorText({ text }: { text?: string }) {
  return text ? <span className="mt-1.5 block text-xs font-medium text-burgundy">{text}</span> : null;
}

export function Field({
  label,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
  dir,
  autoComplete,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
  dir?: "ltr" | "rtl";
  autoComplete?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        type={type}
        dir={dir}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass(error)} ${dir === "ltr" ? "text-start" : ""} disabled:bg-[var(--tone-b)] disabled:text-navy/50`}
      />
      <ErrorText text={error} />
    </label>
  );
}
