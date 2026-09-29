import { useState, type CSSProperties, type ReactNode } from "react";
import { toast } from "sonner";
import { ArrowLeft, Eye, Heart, ShoppingCart, Star, type LucideIcon } from "lucide-react";
import { Link } from "wouter";
import { useCart } from "@/lib/cart";
import { cardEdge } from "@/lib/card-edge";
import { useLang } from "@/lib/i18n";
import type { OfferProduct } from "@/lib/products";

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
}: {
  product: OfferProduct;
  name: string;
  category: string;
  liked: boolean;
  badge?: string;
  onOpen: () => void;
  onToggleSave: () => void;
}) {
  const { t } = useLang();
  const { add } = useCart();
  const percent = Math.round((1 - product.price / product.compareAt) * 100);

  const photo = product.id === "case" ? `/card-photos/product-${product.id}.png` : `/showcase/${product.id}.png`;

  return (
    <article
      onClick={onOpen}
      style={{ "--card-edge": cardEdge(product.id) } as CSSProperties}
      className="showcase-card offer-card flex h-full cursor-pointer flex-col rounded-[1.4rem] border-transparent bg-white p-4 text-start text-navy shadow-[0_10px_28px_rgba(6,46,38,0.06)]"
    >
      <div className="relative">
        <span className="absolute start-0 top-0 z-10 rounded-full bg-burgundy px-2.5 py-1 text-[11px] font-semibold text-white">
          {t.deals.discount.replace("{percent}", String(percent))}
        </span>
        <CardStand>
          <img src={photo} alt="" className="card-photo__img" />
        </CardStand>
      </div>

      <div className="mt-1 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-emerald">{category}</p>
          <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-6 text-navy">{name}</h3>
        </div>
        <button
          type="button"
          aria-pressed={liked}
          aria-label={t.wishlist}
          onClick={(event) => {
            event.stopPropagation();
            onToggleSave();
          }}
          className={`grid size-8 shrink-0 place-items-center rounded-full border bg-white ${
            liked ? "border-emerald text-emerald" : "border-navy/10 text-navy/45"
          }`}
        >
          <Heart className={`size-3.5 ${liked ? "fill-emerald" : ""}`} />
        </button>
        <button
          type="button"
          aria-label={t.deals.quickView}
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
          className="grid size-8 shrink-0 place-items-center rounded-full border border-navy/10 bg-white text-navy/45"
        >
          <Eye className="size-3.5" />
        </button>
      </div>

      {badge ? <p className="mt-1 text-[11px] font-semibold text-navy/45">{badge}</p> : null}

      <p className="mt-2 flex items-center gap-1 text-xs">
        <Star className="size-3.5 fill-gold text-gold" />
        <span className="font-semibold text-emerald">{product.rating.toFixed(1)}</span>
        <span className="text-navy/40">({t.deals.reviews.replace("{count}", String(product.reviews))})</span>
      </p>

      <div className="mt-auto flex items-end justify-between gap-2 pt-3">
        <div>
          <p className="text-[11px] text-navy/35 line-through">
            {money(product.compareAt)} {t.deals.currency}
          </p>
          <p className="text-lg font-bold text-emerald">
            {money(product.price)} {t.deals.currency}
          </p>
        </div>
        <button
          type="button"
          aria-label={t.deals.addToCart}
          onClick={(event) => {
            event.stopPropagation();
            add(product.id);
            toast.success(t.cartAdded.replace("{name}", name));
          }}
          className="cart-btn grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-emerald text-white"
        >
          <ShoppingCart className="size-4" />
        </button>
      </div>
    </article>
  );
}

function CardStand({ children }: { children: ReactNode }) {
  return <div className="card-photo relative flex h-40 items-end justify-center">{children}</div>;
}

function CategoryVisual({ name, image, icon: Icon }: { name: string; image?: string; icon?: LucideIcon }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(image) && !failed;

  return (
    <CardStand>
      {showImage ? (
        <img src={image} alt="" onError={() => setFailed(true)} className="card-photo__img" />
      ) : Icon ? (
        <Icon className="card-photo__mark" strokeWidth={1.6} />
      ) : (
        <span className="card-photo__mark text-2xl font-semibold">{name.slice(0, 1)}</span>
      )}
    </CardStand>
  );
}

export function CategoryCard({
  id,
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
  const className = `showcase-card catalog-card flex h-full w-full flex-col rounded-[1.4rem] border-transparent bg-white p-4 text-start text-navy shadow-[0_10px_28px_rgba(6,46,38,0.06)] ${
    pressed ? "is-selected" : ""
  }`;
  const style = { "--card-edge": cardEdge(id) } as CSSProperties;
  const body = (
    <>
      <CategoryVisual name={name} image={image} icon={Icon} />
      <div className="mt-3 flex items-center gap-2">
        {Icon ? <Icon className="size-4 shrink-0 text-emerald" /> : null}
        <span className="line-clamp-2 text-sm font-bold leading-6">{name}</span>
      </div>
      <span className="mt-1.5 line-clamp-2 text-xs leading-5 text-navy/50">
        {caption}
      </span>
      <span className="mt-auto flex justify-end pt-4">
        <span className="card-arrow grid size-9 place-items-center rounded-full bg-emerald text-white">
          <ArrowLeft className={`size-4 ${dir === "ltr" ? "rotate-180" : ""}`} />
        </span>
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} style={style} className={className}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-pressed={pressed} style={style} className={className}>
      {body}
    </button>
  );
}

export function ServiceCard({
  icon: Icon,
  title,
  text,
  tone = "light",
  platform = true,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  tone?: "light" | "dark";
  platform?: boolean;
}) {
  const dark = tone === "dark";
  return (
    <article
      style={{ "--card-edge": cardEdge(title) } as CSSProperties}
      className={`showcase-card flex items-center gap-3 rounded-2xl border p-3 text-start ${
        dark ? "border-white/15 bg-white/5 text-white" : "border-navy/10 bg-white text-navy shadow-sm"
      }`}
    >
      <ShowcaseStage size="icon" platform={platform}>
        <Icon />
      </ShowcaseStage>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className={`mt-1 text-xs leading-5 ${dark ? "text-white/65" : "text-navy/55"}`}>{text}</p>
      </div>
    </article>
  );
}
