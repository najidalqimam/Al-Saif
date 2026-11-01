import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ShieldCheck, Tag, Truck, Wallet } from "lucide-react";
import { Link } from "wouter";
import { ServiceCard } from "@/components/site/showcase";
import { useLang, type Translations } from "@/lib/i18n";
import { publicUrl } from "@/lib/utils";
import { useSiteContent } from "@/lib/site-content";
import { useIsLight } from "@/lib/theme";

type Slide = Translations["hero"]["slides"][number];

const VISUALS = [
  // Console + controller combo: wide (~1.73:1) cutout, already angled, with ~19% transparent padding under the
  // products (baked shadow) and its own cyan glow, so no tilt / CSS rim and a low bottom offset.
  { href: "c/consoles", src: "/hero-visuals/console.png?v=4", tilt: 0, frame: "bottom-[4%] h-[78%] w-[82%]", cast: "w-[66%]", rim: false },
  // Headset and phone cutouts ship with ~8-12% transparent padding, a baked soft shadow and a cyan glow:
  // frames are taller than the product and sit lower (bottom offset) so the product itself lands on the podium.
  { href: "c/gaming-accessories", src: "/hero-visuals/headset.png?v=6", tilt: 0, frame: "bottom-[8%] h-[78%] w-[56%]", cast: "w-[42%]", rim: false },
  { href: "c/phones", src: "/hero-visuals/phone.png?v=4", tilt: 0, frame: "bottom-[7%] h-[82%] w-[34%]", cast: "w-[26%]", rim: false },
];

/** Where each slide's button goes until a link is picked in the dashboard. */
export function heroDefaultLink(index: number) {
  return (VISUALS[index] ?? VISUALS[0]).href;
}

const PERK_ICONS = [Truck, ShieldCheck, Tag, Wallet];
const AUTOPLAY_MS = 3000;

const HERO_BACKGROUND_LIGHT =
  "radial-gradient(60% 80% at 28% 58%, rgba(255, 255, 255, 0.22), transparent 72%), radial-gradient(70% 45% at 50% 118%, rgb(var(--accent-glow-rgb) / 0.07), transparent 70%), linear-gradient(180deg, var(--chrome) 0%, var(--chrome) 100%)";

const HERO_BACKGROUND =
  "radial-gradient(60% 75% at 50% 52%, rgba(37, 217, 230, 0.12), transparent 70%), radial-gradient(42% 60% at 6% 0%, rgba(100, 124, 255, 0.16), transparent 70%), radial-gradient(70% 45% at 50% 118%, rgba(37, 217, 230, 0.1), transparent 70%), linear-gradient(180deg, #111d32 0%, #1a2c47 58%, #15253d 100%)";

export function Hero() {
  const { t, dir, lang } = useLang();
  const { content } = useSiteContent();
  const light = useIsLight();
  const allSlides = t.hero.slides.map((slide, index) => {
    const saved = content.hero[lang][index] ?? {};
    return {
      ...slide,
      ...saved,
      // A cleared button text falls back to the built-in one, so the button is never empty.
      primary: saved.primary?.trim() || slide.primary,
      // Lines are edited one per line in the dashboard; blank lines are dropped.
      points: (saved.points ?? slide.points ?? []).filter((point) => point.trim()),
      visual: VISUALS[index] ?? VISUALS[0],
    };
  });
  const shown = allSlides.filter((_, index) => !content.heroHidden.includes(index) && !content.heroArchived.includes(index));
  // The banner never goes empty: if every slide is switched off, all of them show.
  const slides = shown.length ? shown : allSlides;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // The hero fills the first screen below the header, whatever the screen height.
  const sectionRef = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);

  useLayoutEffect(() => {
    const measure = () => setOffset(sectionRef.current?.offsetTop ?? 0);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const [reducedMotion, setReducedMotion] = useState(false);
  const total = slides.length;

  useEffect(() => {
    if (index >= total) setIndex(0);
  }, [index, total]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || total < 2) return;
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % total);
    }, AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [paused, reducedMotion, total, index]);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className={`${light ? "hero-light text-navy" : "surface-dark text-white"} relative isolate flex flex-col overflow-hidden`}
      style={{ background: light ? HERO_BACKGROUND_LIGHT : HERO_BACKGROUND, minHeight: `calc(100svh - ${offset}px)` }}
    >
      {/* Filters applied to existing PNGs: no asset is replaced.
          hero-soft-glow: scales the alpha of the baked edge glow (~45% weaker); fully opaque product pixels are untouched.
          hero-soft-led: dims the podium's cyan LED ~18% and softens its under-glow. */}
      <svg aria-hidden="true" focusable="false" width="0" height="0" className="absolute">
        <defs>
          <filter id="hero-soft-glow" colorInterpolationFilters="sRGB">
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0.055 0.11 0.165 0.22 0.275 0.33 0.385 0.44 0.62 1" />
            </feComponentTransfer>
          </filter>
          <filter id="hero-soft-led" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0.82 0 0 0 0  0 0.82 0 0 0  0 0 0.82 0 0  0 0 0 1 0" />
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0.04 0.09 0.14 0.19 0.25 0.31 0.38 0.46 0.62 1" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
      <div
        className="flex flex-1 flex-col justify-center overflow-hidden pt-4 sm:pt-5"
        role="region"
        aria-roledescription="carousel"
        aria-label={t.hero.position.replace("{current}", String(index + 1)).replace("{total}", String(total))}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div className="grid w-full min-w-0">
          {slides.map((item, itemIndex) => (
            <SlidePanel
              key={item.title}
              slide={item}
              dir={dir}
              href={`/${lang}/${item.link || item.visual.href}`}
              image={item.visual.src}
              tilt={item.visual.tilt}
              frame={item.visual.frame}
              cast={item.visual.cast}
              rim={item.visual.rim}
              imageAlt={t.hero.imageAlt}
              active={itemIndex === index}
            />
          ))}
        </div>

        <div className="pb-2">
          <p className="sr-only" aria-live="polite">
            {t.hero.position.replace("{current}", String(index + 1)).replace("{total}", String(total))}
          </p>
        </div>
      </div>

      {light ? null : <div className="led-strip mt-3" aria-hidden />}
      <div className={`relative ${light ? "mt-3 bg-[var(--chrome)]" : "bg-[var(--chrome)]"}`}>
        <div
          className={`page-shell grid grid-cols-2 gap-x-2 gap-y-0 pt-2 pb-6 sm:pb-10 lg:grid-cols-4 lg:divide-x ${
            light ? "lg:divide-navy/10" : "lg:divide-white/10"
          }`}
        >
          {t.catalog.perks.map((perk, perkIndex) => {
            const Icon = PERK_ICONS[perkIndex] ?? Truck;
            return <ServiceCard key={perk.title} icon={Icon} title={perk.title} text={perk.text} tone={light ? "barLight" : "bar"} />;
          })}
        </div>
      </div>
      {light ? <div className="led-strip" aria-hidden /> : null}
    </section>
  );
}

function SlidePanel({
  slide,
  dir,
  href,
  image,
  imageAlt,
  active,
  tilt,
  frame,
  cast,
  rim,
}: {
  slide: Slide;
  dir: "rtl" | "ltr";
  href: string;
  image: string;
  imageAlt: string;
  active: boolean;
  tilt: number;
  frame: string;
  cast: string;
  rim: boolean;
}) {
  const light = useIsLight();
  return (
    <article
      aria-hidden={active ? undefined : true}
      inert={active ? undefined : true}
      className={`hero-panel ${active ? "is-active" : ""}`}
    >
      <div className="page-shell grid items-center gap-4 lg:grid-cols-2 lg:gap-10">
      <div className="flex flex-col items-start">
        <div className="hero-copy">
          <p
            className={`flex items-center gap-3 text-sm font-semibold ltr:text-xs ltr:uppercase ltr:tracking-[0.16em] ${
              light ? "text-brand-ink" : "text-mint"
            }`}
          >
            {slide.eyebrow}
            <span className={`h-px w-14 ${light ? "bg-brand-ink/50" : "bg-mint/60"}`} />
          </p>
          <h1 className="mt-3 text-balance text-[1.875rem] font-bold leading-[1.22] tracking-tight sm:text-4xl lg:text-[2.6rem] lg:leading-[1.18]">
            {slide.title}
            <span className={`relative mt-2 block ${light ? "text-[#0a8a9b]" : "text-mint"}`}>
              {slide.titleRest}
              <span className="absolute -bottom-2 start-0 h-[3px] w-20 rounded-full bg-cyan shadow-[0_0_12px_rgb(var(--accent-rgb)/0.7)]" />
            </span>
          </h1>
          <p className={`mt-4 max-w-md text-base leading-8 ${light ? "text-navy/70" : "text-white/80"}`}>{slide.lead}</p>

        </div>
        <div className="hero-cta mt-5 flex flex-wrap items-center gap-3">
          <Link href={href} className="btn-brand">
            {slide.primary}
            <ArrowLeft className={`size-4 ${dir === "ltr" ? "rotate-180" : ""}`} aria-hidden />
          </Link>
        </div>
        {slide.offer || slide.points?.length ? (
          <div className="hero-cta mt-4">
            <div className="hero-badge">
              <div>
                {slide.offer ? <p className="hero-badge__title">{slide.offer}</p> : null}
                {slide.points?.length ? (
                  <ul className="hero-badge__list">
                    {slide.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <HeroStage src={image} alt={active ? imageAlt : ""} tilt={tilt} frame={frame} cast={cast} rim={rim} />
      </div>
    </article>
  );
}

function HeroStage({
  src,
  alt,
  tilt,
  frame,
  cast,
  rim,
}: {
  src: string;
  alt: string;
  tilt: number;
  frame: string;
  cast: string;
  rim: boolean;
}) {
  return (
    <div className="relative mx-auto h-[190px] w-full max-w-lg sm:h-[250px] lg:h-[270px]">
      <div aria-hidden className="hero-ambient" />
      <div className={`hero-product absolute left-1/2 z-10 ${frame}`}>
        <div className="hero-float h-full w-full">
          <img
            src={publicUrl(src)}
            alt={alt}
            className="h-full w-full object-contain object-bottom"
            style={{
              transform: `rotate(${tilt}deg)`,
              transformOrigin: "center bottom",
              // Cyan LED rim only; grounding shadows live on the platform so they can follow the float.
              filter: rim
                ? "drop-shadow(0 0 1px rgb(var(--accent-soft-rgb) / 0.55)) drop-shadow(0 0 14px rgb(var(--accent-rgb) / 0.2))"
                : "url(#hero-soft-glow)",
            }}
          />
        </div>
      </div>
      {/* Podium artwork: its top face is centred on the products' contact line (bottom-[18%]); the lower tiers hang below the stage. */}
      <div aria-hidden className="hero-podium pointer-events-none absolute bottom-[18%] left-1/2 z-[4] w-[76%] -translate-x-1/2 sm:w-[90%] translate-y-[74%]">
        <img src={publicUrl("/hero-visuals/podium.png?v=2")} alt="" width={1922} height={444} draggable={false} className="block h-auto w-full" style={{ filter: "url(#hero-soft-led)" }} />
      </div>
      <div aria-hidden className="hero-plinth absolute bottom-[4%] left-1/2 z-[5] w-[78%] -translate-x-1/2 sm:w-[92%]">
        <span className={`hero-plinth__cast ${cast}`} />
        <span className={`hero-plinth__contact ${cast}`} />
      </div>
    </div>
  );
}
