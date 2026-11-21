import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { ACCOUNT_COPY } from "@/lib/account-copy";
import { useLang } from "@/lib/i18n";
import { useZones } from "@/pages/AccountPage";
import { AuthFace, useAuthForm, type AuthMode } from "@/pages/AuthPage";

// Keep in step with the transition times of .auth-card in index.css.
const EXIT_MS = 380;
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** The sign-in / register card that opens over the current page. Mounts while open and while it animates out. */
export function AuthModal({ open, onClose, next }: { open: boolean; onClose: () => void; next?: string }) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setShown(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }
    setShown(false);
    const timer = window.setTimeout(() => setMounted(false), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!mounted) return null;
  return createPortal(<AuthDialog shown={shown} closing={!open} onClose={onClose} next={next} />, document.body);
}

function AuthDialog({ shown, closing, onClose, next }: { shown: boolean; closing: boolean; onClose: () => void; next?: string }) {
  const { lang, dir, t } = useLang();
  const copy = ACCOUNT_COPY[lang];
  const zones = useZones();
  const auth = useAuthForm(next ?? `/${lang}/account`);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [heights, setHeights] = useState({ signin: 0, register: 0 });
  const [animateHeight, setAnimateHeight] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const signinRef = useRef<HTMLDivElement>(null);
  const registerRef = useRef<HTMLDivElement>(null);
  const [opener] = useState(() => (document.activeElement instanceof HTMLElement ? document.activeElement : null));
  const firstMode = useRef(true);

  // Lock the page behind the card without shifting its layout.
  useEffect(() => {
    const { overflow, paddingRight } = document.body.style;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, []);

  // Focus moves into the card on open and goes back to the opening button when it closes. It lands on the card itself,
  // not on a field, so the browser's saved-password list stays closed until the person clicks a field.
  useEffect(() => {
    dialogRef.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (closing) opener?.focus({ preventScroll: true });
  }, [closing, opener]);

  // After a flip the link that was pressed is hidden, so focus goes back to the card (not to a field, for the same reason).
  useEffect(() => {
    if (firstMode.current) {
      firstMode.current = false;
      return;
    }
    const id = requestAnimationFrame(() => {
      dialogRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [mode]);

  // The card is as tall as the form on show, so neither form is clipped or leaves a gap.
  useLayoutEffect(() => {
    const measure = () =>
      setHeights({
        signin: (signinRef.current?.offsetHeight ?? 0) + 2,
        register: (registerRef.current?.offsetHeight ?? 0) + 2,
      });
    measure();
    const observer = new ResizeObserver(measure);
    if (signinRef.current) observer.observe(signinRef.current);
    if (registerRef.current) observer.observe(registerRef.current);
    const timer = window.setTimeout(() => setAnimateHeight(true), 60);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  // Escape closes; Tab stays inside the card and skips the face that is turned away.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (closing) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => !el.closest("[inert]"));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!dialogRef.current.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closing, onClose]);

  function switchMode(target: AuthMode) {
    auth.reset();
    setMode(target);
  }

  const height = heights[mode];
  const faces = [
    { id: "signin" as const, ref: signinRef },
    { id: "register" as const, ref: registerRef },
  ];

  return (
    <div
      dir={dir}
      data-shown={shown}
      className="auth-backdrop tone-scope fixed inset-0 z-[300] grid place-items-center overflow-hidden p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !closing) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-label={mode === "signin" ? copy.signInTitle : copy.registerTitle}
        data-shown={shown}
        className="auth-card relative w-full max-w-md text-navy outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t.deals.close}
          className="auth-close absolute right-3 top-3 z-20 grid size-9 cursor-pointer place-items-center rounded-lg bg-navy/[0.07] text-navy outline-none transition duration-200 hover:bg-burgundy hover:text-white focus-visible:bg-burgundy focus-visible:text-white focus-visible:ring-2 focus-visible:ring-brand active:scale-90"
        >
          <X className="size-4" strokeWidth={3} aria-hidden />
        </button>

        <div className="auth-scene">
          <div
            className="auth-flipper"
            data-flipped={mode === "register"}
            data-animate={animateHeight}
            style={height ? { height: `min(${height}px, calc(100svh - 2rem))` } : undefined}
          >
            {faces.map(({ id, ref }) => (
              <div
                key={id}
                data-face={id}
                data-active={mode === id}
                aria-hidden={mode !== id}
                inert={mode !== id}
                className={`auth-face ${id === "register" ? "auth-face--back" : ""} rounded-3xl border border-navy/10 bg-white shadow-[0_18px_48px_rgba(11,18,32,0.22)]`}
              >
                <div ref={ref} className="px-6 pb-6 pt-14 sm:px-8 sm:pb-8">
                  <AuthFace auth={auth} mode={id} zones={zones} onSwitch={switchMode} heading="h2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
