import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translations, type Lang } from "@/lib/i18n";
import { OFFER_PRODUCTS, type OfferProduct } from "@/lib/products";

const STORAGE_KEY = "alsaif-home-content";
const HOME_LIMIT = 10;

export type ProductRow = {
  id: OfferProduct["id"];
  mark: OfferProduct["mark"];
  price: number;
  compareAt: number;
  rating: number;
  reviews: number;
  hidden: boolean;
  onHome: boolean;
  nameAr: string;
  nameEn: string;
  categoryAr: string;
  categoryEn: string;
};

export type SlideCopy = { title: string; titleRest: string; lead: string };

export type SiteContent = {
  products: ProductRow[];
  hero: Record<Lang, SlideCopy[]>;
  catalog: Record<Lang, { title: string; subtitle: string }>;
  deals: Record<Lang, { eyebrow: string; title: string; highlight: string; lead: string }>;
  bestsellers: Record<Lang, { eyebrow: string; title: string; lead: string; bannerTitle: string; bannerLead: string }>;
  addons: Record<Lang, { eyebrow: string; title: string; lead: string; ready: string }>;
  setups: Record<Lang, { eyebrow: string; title: string; lead: string; action: string }>;
  footer: Record<Lang, { about: string; shipping: string; warranty: string }>;
  categoryHidden: string[];
};

type BlockKey = "catalog" | "deals" | "bestsellers" | "addons" | "setups" | "footer";

function textOf(lang: Lang, id: string) {
  return translations[lang].deals.products[id];
}

function defaults(): SiteContent {
  const products: ProductRow[] = OFFER_PRODUCTS.map((item, index) => ({
    id: item.id,
    mark: item.mark,
    price: item.price,
    compareAt: item.compareAt,
    rating: item.rating,
    reviews: item.reviews,
    hidden: false,
    onHome: index < HOME_LIMIT,
    nameAr: textOf("ar", item.id)?.name ?? item.id,
    nameEn: textOf("en", item.id)?.name ?? item.id,
    categoryAr: textOf("ar", item.id)?.category ?? "",
    categoryEn: textOf("en", item.id)?.category ?? "",
  }));

  const both = <T,>(pick: (lang: Lang) => T): Record<Lang, T> => ({
    ar: pick("ar"),
    en: pick("en"),
  });

  return {
    products,
    hero: both((lang) =>
      translations[lang].hero.slides.map((slide) => ({
        title: slide.title,
        titleRest: slide.titleRest,
        lead: slide.lead,
      })),
    ),
    catalog: both((lang) => ({
      title: translations[lang].catalog.title,
      subtitle: translations[lang].catalog.subtitle,
    })),
    deals: both((lang) => ({
      eyebrow: translations[lang].deals.eyebrow,
      title: translations[lang].deals.title,
      highlight: translations[lang].deals.highlight,
      lead: translations[lang].deals.lead,
    })),
    bestsellers: both((lang) => ({
      eyebrow: translations[lang].bestsellers.eyebrow,
      title: translations[lang].bestsellers.title,
      lead: translations[lang].bestsellers.lead,
      bannerTitle: translations[lang].bestsellers.bannerTitle,
      bannerLead: translations[lang].bestsellers.bannerLead,
    })),
    addons: both((lang) => ({
      eyebrow: translations[lang].addons.eyebrow,
      title: translations[lang].addons.title,
      lead: translations[lang].addons.lead,
      ready: translations[lang].addons.ready,
    })),
    setups: both((lang) => ({
      eyebrow: translations[lang].setups.eyebrow,
      title: translations[lang].setups.title,
      lead: translations[lang].setups.lead,
      action: translations[lang].setups.action,
    })),
    footer: both((lang) => ({
      about: translations[lang].footer.about,
      shipping: translations[lang].footer.shipping,
      warranty: translations[lang].footer.warranty,
    })),
    categoryHidden: [],
  };
}

function load(): SiteContent {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw) as SiteContent;
    if (!Array.isArray(parsed.products) || parsed.products.length !== OFFER_PRODUCTS.length) return defaults();
    if (!parsed.hero?.ar?.length || !parsed.deals?.en || !parsed.footer?.ar) return defaults();
    if (!Array.isArray(parsed.categoryHidden)) parsed.categoryHidden = [];
    const previous = {
      ar: "تصفح الجوالات، وأجهزة البلايستيشن، وإكسسواراتها.",
      en: "Browse phones, PlayStation consoles, and their accessories.",
    };
    if (parsed.catalog?.ar?.subtitle === previous.ar) {
      parsed.catalog.ar.subtitle = translations.ar.catalog.subtitle;
    }
    if (parsed.catalog?.en?.subtitle === previous.en) {
      parsed.catalog.en.subtitle = translations.en.catalog.subtitle;
    }
    const retired = {
      ar: { title: "أقسام ومنتجات السيف", subtitle: "أقسام المتجر وعدد المنتجات في كل قسم." },
      en: { title: "Al-Saif departments", subtitle: "Store departments and how many products are in each one." },
    };
    if (parsed.catalog?.ar?.title === retired.ar.title) parsed.catalog.ar.title = translations.ar.catalog.title;
    if (parsed.catalog?.ar?.subtitle === retired.ar.subtitle) parsed.catalog.ar.subtitle = translations.ar.catalog.subtitle;
    if (parsed.catalog?.en?.title === retired.en.title) parsed.catalog.en.title = translations.en.catalog.title;
    if (parsed.catalog?.en?.subtitle === retired.en.subtitle) parsed.catalog.en.subtitle = translations.en.catalog.subtitle;
    if (parsed.deals?.ar?.eyebrow === "أقوى عروض السيف") parsed.deals.ar.eyebrow = translations.ar.deals.eyebrow;
    if (parsed.deals?.en?.eyebrow === "Al-Saif's strongest offers") parsed.deals.en.eyebrow = translations.en.deals.eyebrow;
    if (parsed.setups?.ar?.title === "جلسة البلايستيشن وشاشتها") {
      parsed.setups.ar = {
        eyebrow: translations.ar.setups.eyebrow,
        title: translations.ar.setups.title,
        lead: translations.ar.setups.lead,
        action: translations.ar.setups.action,
      };
    }
    if (parsed.setups?.en?.title === "A PlayStation session and its screen") {
      parsed.setups.en = {
        eyebrow: translations.en.setups.eyebrow,
        title: translations.en.setups.title,
        lead: translations.en.setups.lead,
        action: translations.en.setups.action,
      };
    }
    return parsed;
  } catch {
    return defaults();
  }
}

function toOffer(row: ProductRow): OfferProduct {
  const base = OFFER_PRODUCTS.find((item) => item.id === row.id) ?? OFFER_PRODUCTS[0];
  return {
    id: row.id,
    mark: row.mark || base.mark,
    price: row.price,
    compareAt: row.compareAt,
    rating: row.rating,
    reviews: row.reviews,
  };
}

type ContentApi = {
  content: SiteContent;
  updateProduct: (id: string, patch: Partial<ProductRow>) => void;
  updateHero: (lang: Lang, index: number, patch: Partial<SlideCopy>) => void;
  updateBlock: <K extends BlockKey>(key: K, lang: Lang, patch: Partial<SiteContent[K][Lang]>) => void;
  reset: () => void;
  copyOf: (lang: Lang, id: string) => { name: string; category: string } | undefined;
  visibleProducts: (mode: "home" | "all") => OfferProduct[];
  productById: (id: string) => OfferProduct | undefined;
  setCategoryHidden: (id: string, hidden: boolean) => void;
};

const SiteContentContext = createContext<ContentApi | null>(null);

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
  }, [content]);

  const api: ContentApi = {
    content,
    updateProduct(id, patch) {
      setContent((current) => ({
        ...current,
        products: current.products.map((item) => (item.id === id ? { ...item, ...patch, id: item.id } : item)),
      }));
    },
    updateHero(lang, index, patch) {
      setContent((current) => ({
        ...current,
        hero: {
          ...current.hero,
          [lang]: current.hero[lang].map((slide, slideIndex) =>
            slideIndex === index ? { ...slide, ...patch } : slide,
          ),
        },
      }));
    },
    updateBlock(key, lang, patch) {
      setContent((current) => ({
        ...current,
        [key]: {
          ...current[key],
          [lang]: { ...current[key][lang], ...patch },
        },
      }));
    },
    reset() {
      const next = defaults();
      localStorage.removeItem(STORAGE_KEY);
      setContent(next);
    },
    copyOf(lang, id) {
      const row = content.products.find((item) => item.id === id);
      if (!row) return undefined;
      return lang === "ar"
        ? { name: row.nameAr, category: row.categoryAr }
        : { name: row.nameEn, category: row.categoryEn };
    },
    visibleProducts(mode) {
      return content.products
        .filter((item) => !item.hidden && (mode === "all" || item.onHome))
        .slice(0, mode === "home" ? HOME_LIMIT : undefined)
        .map(toOffer);
    },
    productById(id) {
      const row = content.products.find((item) => item.id === id && !item.hidden);
      return row ? toOffer(row) : undefined;
    },
    setCategoryHidden(id, hidden) {
      setContent((current) => ({
        ...current,
        categoryHidden: hidden
          ? [...new Set([...current.categoryHidden, id])]
          : current.categoryHidden.filter((item) => item !== id),
      }));
    },
  };

  return <SiteContentContext.Provider value={api}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  const value = useContext(SiteContentContext);
  if (!value) throw new Error("SiteContentProvider is missing");
  return value;
}
