import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "@/lib/i18n";

/** Scroll position helpers that behave the same in LTR and RTL (scrollLeft is negative in RTL). */
function edges(el: HTMLElement) {
  const offset = Math.abs(el.scrollLeft);
  return {
    atStart: offset <= 2,
    atEnd: offset + el.clientWidth >= el.scrollWidth - 2,
  };
}

export function useRail() {
  const { dir } = useLang();
  const trackRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ atStart: true, atEnd: false });

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const next = edges(el);
    setState((current) => (current.atStart === next.atStart && current.atEnd === next.atEnd ? current : next));
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [measure]);

  const scrollBy = useCallback(
    (direction: 1 | -1) => {
      const el = trackRef.current;
      if (!el) return;
      const sign = dir === "rtl" ? -1 : 1;
      el.scrollBy({ left: sign * direction * el.clientWidth * 0.85 });
    },
    [dir],
  );

  return { trackRef, ...state, scrollBy };
}

/**
 * Glides the rail slowly and continuously. The track holds its cards twice (the second set marked `data-rail-copy`),
 * so when the first set has fully passed it wraps back by one set length with no visible jump.
 * Pauses while the pointer or keyboard focus is inside it and while the tab is hidden; off under reduced motion.
 */
export function useRailAutoplay(trackRef: RefObject<HTMLDivElement | null>, speed = 28) {
  const { dir } = useLang();

  useEffect(() => {
    const el = trackRef.current;
    if (!el || !speed || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const sign = dir === "rtl" ? -1 : 1;
    // Snap and smooth scrolling would fight the per-frame updates.
    el.style.scrollSnapType = "none";
    el.style.scrollBehavior = "auto";

    let paused = false;
    let position = Math.abs(el.scrollLeft);
    let last = performance.now();
    let frame = 0;

    const loopLength = () => {
      const first = el.firstElementChild as HTMLElement | null;
      const copy = el.querySelector<HTMLElement>("[data-rail-copy]");
      return first && copy ? Math.abs(copy.offsetLeft - first.offsetLeft) : 0;
    };

    const tick = (now: number) => {
      const elapsed = Math.min(now - last, 64);
      last = now;
      if (!paused && !document.hidden) {
        const length = loopLength();
        position += (speed * elapsed) / 1000;
        if (length > 0 && position >= length) position -= length;
        el.scrollLeft = sign * position;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const pause = () => (paused = true);
    const resume = () => {
      // Continue from wherever the visitor left it (they may have swiped or scrolled).
      position = Math.abs(el.scrollLeft);
      paused = false;
    };
    const onFocusOut = (event: FocusEvent) => {
      if (!el.contains(event.relatedTarget as Node | null)) resume();
    };
    el.addEventListener("pointerenter", pause);
    el.addEventListener("pointerleave", resume);
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("touchend", resume);
    el.addEventListener("focusin", pause);
    el.addEventListener("focusout", onFocusOut);

    return () => {
      cancelAnimationFrame(frame);
      el.style.scrollSnapType = "";
      el.style.scrollBehavior = "";
      el.removeEventListener("pointerenter", pause);
      el.removeEventListener("pointerleave", resume);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend", resume);
      el.removeEventListener("focusin", pause);
      el.removeEventListener("focusout", onFocusOut);
    };
  }, [trackRef, dir, speed]);
}

export function RailControls({
  atStart,
  atEnd,
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
}: {
  atStart: boolean;
  atEnd: boolean;
  onPrev: () => void;
  onNext: () => void;
  prevLabel: string;
  nextLabel: string;
}) {
  const { dir } = useLang();
  const flip = dir === "rtl" ? "rotate-180" : "";
  return (
    <div className="rail__controls">
      <button type="button" className="rail__btn" aria-label={prevLabel} disabled={atStart} onClick={onPrev}>
        <ChevronLeft className={`size-5 ${flip}`} aria-hidden />
      </button>
      <button type="button" className="rail__btn" aria-label={nextLabel} disabled={atEnd} onClick={onNext}>
        <ChevronRight className={`size-5 ${flip}`} aria-hidden />
      </button>
    </div>
  );
}

/** Horizontal, snap-scrolling track. It scrolls inside its own box and never widens the page. */
export function RailTrack({
  trackRef,
  label,
  children,
}: {
  trackRef: RefObject<HTMLDivElement | null>;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rail">
      <div ref={trackRef} className="rail__track" role="region" aria-label={label} tabIndex={0}>
        {children}
      </div>
    </div>
  );
}
