import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ArrowLeft, Eye, Heart, ShoppingCart, Star, type LucideIcon } from "lucide-react";
import { Link } from "wouter";
import { useCart } from "@/lib/cart";
import { publicUrl } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { productPhoto, type OfferProduct } from "@/lib/products";

type StageSize = "sm" | "md" | "lg" | "icon";

export function ShowcaseStage({
  children,
  overlay,
  size = "md",
  tone = "green",
  platform = true,
  className = "",
}: {
  children: ReactNode;
  overlay?: ReactNode;
  size?: StageSize;
  tone?: "green" | "light";
  platform?: boolean;
  className?: string;
}) {
  return (
    <div className={`showcase-stage is-${size} ${tone === "light" ? "showcase-stage--light" : ""} ${platform ? "" : "showcase-stage--plain"} ${className}`}>
      <div className="showcase-stage__glow" aria-hidden />
      {platform ? (
        <div className="showcase-stage__platform" aria-hidden>
          <span className="showcase-stage__shadow" />
          <span className="showcase-stage__base" />
          <span className="showcase-stage__disc" />
        </div>
      ) : null}
      <div className="showcase-stage__subject">{children}</div>
      {overlay}
    </div>
  );
}

function money(value: number) {
  return value.toLocaleString("en-US");
}

export function ProductCard({
  product,
  name,
  category,
  liked,
  badge,
  onOpen,
  onToggleSave,
  duplicate = false,
}: {
  product: OfferProduct;
  name: string;
  category: string;
  liked: boolean;
  badge?: string;
  onOpen: () => void;
  onToggleSave: () => void;
  /** A visual copy (e.g. for a looping rail): hidden from assistive tech and skipped by Tab. */
  duplicate?: boolean;
}) {
  const { t, lang } = useLang();
  const { add } = useCart();
  const percent = Math.round((1 - product.price / product.compareAt) * 100);

  const photo = productPhoto(product);

  return (
    <article aria-hidden={duplicate || undefined} className="showcase-card offer-card product-card flex h-full flex-col rounded-[1.25rem] bg-white p-3 text-start text-navy">
      <div className="relative">
        {percent > 0 ? (
          <span className="absolute start-2.5 top-2.5 z-10 rounded-lg bg-burgundy px-2 py-1 text-[11px] font-bold leading-none text-white">
            {t.deals.discount.replace("{percent}", String(percent))}
          </span>
        ) : null}
        <div className="absolute end-2.5 top-2.5 z-20 flex flex-col gap-2">
          <button
            type="button"
            tabIndex={duplicate ? -1 : undefined}
            aria-pressed={liked}
            aria-label={t.wishlist}
            onClick={(event) => {
              event.stopPropagation();
              onToggleSave();
            }}
            className={`grid size-10 cursor-pointer place-items-center rounded-full border bg-white/95 shadow-sm transition-colors hover:border-cyan hover:text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan ${
              liked ? "border-brand-ink text-brand-ink" : "border-navy/10 text-navy"
            }`}
          >
            <Heart className={`size-[18px] ${liked ? "fill-brand-ink" : ""}`} aria-hidden />
          </button>
          <button
            type="button"
            tabIndex={duplicate ? -1 : undefined}
            aria-label={t.deals.quickView}
            onClick={(event) => {
              event.stopPropagation();
              onOpen();
            }}
            className="grid size-10 cursor-pointer place-items-center rounded-full border border-navy/10 bg-white/95 text-navy shadow-sm transition-colors hover:border-cyan hover:text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
          >
            <Eye className="size-[18px]" aria-hidden />
          </button>
        </div>
        <div className="card-photo product-photo">
          <img src={photo} alt="" loading="lazy" decoding="async" className="card-photo__img" />
        </div>
        {badge ? (
          <span className="absolute bottom-2.5 start-2.5 z-10 max-w-[80%] truncate rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-ink-soft shadow-sm">
            {badge}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-1 flex-col px-1">
        <p className="line-clamp-1 text-xs font-medium text-ink-mute">{category}</p>
        <h3 className="mt-1 line-clamp-2 min-h-12 text-[0.9375rem] font-bold leading-6 text-navy">
          {/* The whole card opens the product page; the eye button keeps the quick view. */}
          <Link
            href={`/${lang}/p/${encodeURIComponent(product.id)}`}
            tabIndex={duplicate ? -1 : undefined}
            className="card-open cursor-pointer text-start after:absolute after:inset-0 after:content-['']"
          >
            {name}
          </Link>
        </h3>

        {product.rating > 0 ? (
          <p className="mt-1.5 flex items-center gap-1 text-xs">
            <Star className="size-3.5 fill-gold text-gold" aria-hidden />
            <span className="font-semibold text-navy">{product.rating.toFixed(1)}</span>
            {product.reviews > 0 ? (
              <span className="text-ink-mute">({t.deals.reviews.replace("{count}", String(product.reviews))})</span>
            ) : null}
          </p>
        ) : null}

        <div className="mt-auto pt-3">
          <div className="flex min-h-7 flex-wrap items-baseline gap-x-2">
            <p className="price-now text-xl font-bold leading-7 text-brand-ink">
              {money(product.price)} {t.deals.currency}
            </p>
            {product.compareAt > product.price ? (
              <p className="price-now text-xs text-ink-mute line-through">
                {money(product.compareAt)} {t.deals.currency}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            tabIndex={duplicate ? -1 : undefined}
            aria-label={`${t.deals.addToCart}: ${name}`}
            onClick={(event) => {
              event.stopPropagation();
              add(product.id);
              toast.success(t.cartAdded.replace("{name}", name));
            }}
            className="cart-btn relative z-20 mt-3 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-cyan/45 bg-cyan/15 text-sm font-bold text-brand-ink transition-colors hover:bg-brand hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
          >
            <ShoppingCart className="size-[18px]" aria-hidden />
            {t.deals.addToCart}
          </button>
        </div>
      </div>
    </article>
  );
}

function CardStand({ children }: { children: ReactNode }) {
  return <div className="card-photo">{children}</div>;
}

function CategoryVisual({ name, image, icon: Icon }: { name: string; image?: string; icon?: LucideIcon }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(image) && !failed;

  return (
    <CardStand>
      {showImage ? (
        <img
          src={publicUrl(image)}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="card-photo__img"
        />
      ) : Icon ? (
        <Icon className="card-photo__mark" strokeWidth={1.6} aria-hidden />
      ) : (
        <span className="card-photo__mark text-2xl font-semibold">{name.slice(0, 1)}</span>
      )}
    </CardStand>
  );
}

export function CategoryCard({
  name,
  caption,
  image,
  icon: Icon,
  pressed = false,
  href,
  onClick,
}: {
  id: string;
  name: string;
  caption: string;
  image?: string;
  icon?: LucideIcon;
  pressed?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const { dir } = useLang();
  const className = `showcase-card catalog-card led-edge flex h-full w-full cursor-pointer flex-col rounded-[1.4rem] bg-white p-3 text-start text-navy ${
    pressed ? "is-selected" : ""
  }`;
  const body = (
    <>
      <CategoryVisual name={name} image={image} icon={Icon} />
      <div className="mt-3 flex items-center gap-2 px-1">
        {Icon ? <Icon className="size-4 shrink-0 text-brand-ink" aria-hidden /> : null}
        <span className="line-clamp-2 text-sm font-bold leading-6">{name}</span>
      </div>
      <span className="mt-1 line-clamp-2 min-h-10 px-1 text-xs leading-5 text-ink-soft">{caption}</span>
      <span className="mt-auto flex justify-end px-1 pt-3">
        <span className="card-arrow grid size-9 place-items-center rounded-full bg-brand text-navy">
          <ArrowLeft className={`size-4 ${dir === "ltr" ? "rotate-180" : ""}`} aria-hidden />
        </span>
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-pressed={pressed} className={className}>
      {body}
    </button>
  );
}

export function ServiceCard({
  icon: Icon,
  title,
  text,
  tone = "light",
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  tone?: "light" | "dark" | "bar" | "barLight";
}) {
  const dark = tone !== "light" && tone !== "barLight";
  return (
    <article
      className={`flex flex-col items-start gap-3 rounded-2xl border p-4 text-start sm:flex-row ${
        dark ? "border-white/15 bg-white/[0.06] text-white" : "border-navy/10 bg-white text-navy shadow-sm"
      } ${tone === "bar" ? "border-0! bg-transparent! p-2!" : ""} ${tone === "barLight" ? "border-0! bg-transparent! p-2! shadow-none!" : ""}`}
    >
      <span className={`icon-tile ${dark ? "icon-tile--dark" : ""}`} aria-hidden>
        <Icon />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold leading-6">{title}</p>
        <p className={`mt-0.5 text-[0.8125rem] leading-5 ${dark ? "text-white/80" : "text-ink-soft"}`}>{text}</p>
      </div>
    </article>
  );
}

export function IconTile({ icon: Icon, tone = "light" }: { icon: LucideIcon; tone?: "light" | "dark" }) {
  return (
    <span className={`icon-tile ${tone === "dark" ? "icon-tile--dark" : ""}`} aria-hidden>
      <Icon />
    </span>
  );
}
