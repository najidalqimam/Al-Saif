import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ApiError, PREVIEW, api, apiMessage } from "@/lib/api";
import { CATALOG, allCategories, registerAddedCategories, registerCatalogue, registerCategoryOrder, type CatalogCategory } from "@/lib/catalog";
import { translations, type Lang } from "@/lib/i18n";
import { DEMO_PRODUCTS, DEMO_PRODUCTS_UR, type DemoProduct } from "@/data/demo-products";
import { OFFER_PRODUCTS, type OfferProduct } from "@/lib/products";

const STORAGE_KEY = "alsaif-home-content";
const HOME_LIMIT = 10;

export type ProductRow = {
  id: string;
  mark: string;
  price: number;
  compareAt: number;
  rating: number;
  reviews: number;
  hidden: boolean;
  onHome: boolean;
  nameAr: string;
  nameEn: string;
  /** Urdu copy is optional; empty means the Arabic text shows in Urdu. */
  nameUr?: string;
  categoryAr: string;
  categoryEn: string;
  categoryUr?: string;
  /** Archived products stay saved but leave the store; the dashboard can restore them. */
  archived?: boolean;
  /** Department chosen in the dashboard; without it the dashboard's default placement applies. */
  categoryId?: string;
  /** Photo for products added from the dashboard (a data URL) or the demo set (a public path). */
  image?: string;
  /** Where the product came from when it is not one of the built-in store products. */
  source?: "demo" | "added";
  /** Set on a product a shop sent from its own dashboard: pending waits for the admin's approval, rejected was refused. Missing: published (added or approved by the admin). */
  approval?: "pending" | "rejected";
  /** Why the admin refused it, shown to the shop. */
  rejectReason?: string;
  /** When the shop sent it (ISO date). */
  submittedAt?: string;
  /** Recorded stock from the database (dashboard only); null means not tracked. */
  stock?: number | null;
  /** Explicit match key shared by the same product listed by different shops (preview data only for now). */
  matchKey?: string;
  /** Optional wholesale price per piece for this listing (from 5 pieces); local to this browser, not sent to the server. */
  wholesalePrice?: number | null;
  /** The shop that owns this product listing; missing or null: not linked to any shop. */
  shopId?: string | null;
  /** The shop's name as sent with the product by the API (the dashboard reads the current name from its shop list). */
  shop?: Shop | null;
  /** Product page copy from the dashboard. Null or missing: the built-in highlights and specs show instead. */
  descriptionAr?: string;
  descriptionEn?: string;
  descriptionUr?: string;
  featuresAr?: string[] | null;
  featuresEn?: string[] | null;
  featuresUr?: string[] | null;
  specsAr?: ProductSpec[] | null;
  specsEn?: ProductSpec[] | null;
  specsUr?: ProductSpec[] | null;
};

export type ProductSpec = { label: string; value: string };

/** A shop; the contact details are optional (empty means not filled in). */
/** How a shop gets paid; shown on the shop's page in the admin dashboard. */
export type ShopPayment = { bankName?: string; accountHolder?: string; iban?: string; accountNumber?: string; acceptsCod?: boolean; acceptsBankTransfer?: boolean; notes?: string };
export type Shop = { id: string; name: string; ownerName?: string; phone?: string; email?: string; city?: string; address?: string; description?: string; payment?: ShopPayment; /** "PENDING" / "REJECTED" for a seller that signed up by itself; otherwise approved. */ status?: "APPROVED" | "PENDING" | "REJECTED"; rejectReason?: string; createdAt?: string; /** false = suspended: hidden from the store with its products. */ isActive?: boolean; /** In the dashboard's archive (deleted from the list); hidden like a suspended shop. */ archived?: boolean };
export type ShopInput = Omit<Shop, "id" | "status" | "rejectReason" | "createdAt" | "isActive" | "archived">;

/** The product page copy (description, highlights, spec table) in the three languages. */
export type PageCopyKey = "descriptionAr" | "descriptionEn" | "descriptionUr" | "featuresAr" | "featuresEn" | "featuresUr" | "specsAr" | "specsEn" | "specsUr";

export type NewProduct = Pick<ProductRow, "nameAr" | "nameEn" | "nameUr" | "categoryAr" | "categoryEn" | "categoryUr" | "categoryId" | "price" | "compareAt" | "image" | "hidden" | "onHome" | PageCopyKey> & { shopId?: string | null; wholesalePrice?: number | null };

// Preview data for the shop price comparison: 3 demo shops, each listing the same tablet (same model, storage,
// colour and condition) at a different price. The offers share an explicit matchKey; nothing is matched by name.
// Added only in preview (`VITE_ADMIN_PREVIEW=1`), once per id, and never replaces anything already saved.
const COMPARE_DEMO_KEY = "demo:tablet-11in-256gb-gray-new";
const COMPARE_DEMO_SHOPS: Shop[] = [
  {
    id: "demo-shop-1",
    name: "محل تجريبي: الرياض للإلكترونيات",
    ownerName: "عبدالله الحربي",
    phone: "0501234567",
    email: "riyadh@example.com",
    city: "الرياض",
    address: "حي العليا، طريق الملك فهد، مجمع التقنية، محل 12",
    description: "متخصصون في الجوالات والأجهزة اللوحية والإكسسوارات منذ 2015، مع ضمان محلي وتوصيل سريع داخل الرياض.",
  },
  {
    id: "demo-shop-2",
    name: "محل تجريبي: النور للحاسبات",
    ownerName: "نورة القحطاني",
    phone: "0559876543",
    email: "alnoor@example.com",
    city: "جدة",
    address: "حي الروضة، شارع التحلية، برج النور، الدور الأرضي",
    description: "لابتوبات وأجهزة مكتبية وشاشات للأعمال والدراسة، مع صيانة وتجهيز حسب الطلب.",
  },
  {
    id: "demo-shop-3",
    name: "محل تجريبي: الواحة للتقنية",
    ownerName: "خالد الشمري",
    phone: "0533344455",
    email: "oasis@example.com",
    city: "الدمام",
    address: "حي الشاطئ، شارع الأمير محمد بن فهد، مبنى 8",
    description: "ملحقات الكمبيوتر وأجهزة الشبكات والطابعات بأسعار منافسة وعروض أسبوعية.",
  },
];
const COMPARE_DEMO_SPECS: Record<Lang, ProductSpec[]> = {
  ar: [
    { label: "الشاشة", value: "11 بوصة" },
    { label: "السعة", value: "256 جيجا" },
    { label: "اللون", value: "رمادي" },
    { label: "الحالة", value: "جديد" },
  ],
  en: [
    { label: "Display", value: "11 inch" },
    { label: "Storage", value: "256 GB" },
    { label: "Colour", value: "Gray" },
    { label: "Condition", value: "New" },
  ],
  ur: [
    { label: "ڈسپلے", value: "11 انچ" },
    { label: "اسٹوریج", value: "256 جی بی" },
    { label: "رنگ", value: "سرمئی" },
    { label: "حالت", value: "نیا" },
  ],
};
// Urdu copy for the demo rows. Used only while a row still holds the untouched Arabic demo text, so edits made in
// the dashboard always win. Shop names are brand names and stay as they are.
const COMPARE_DEMO_AR_NAME = "[بيانات تجريبية] جهاز لوحي 11 بوصة · 256 جيجا · رمادي · جديد";
const COMPARE_DEMO_UR = {
  name: "[آزمائشی ڈیٹا] 11 انچ ٹیبلٹ · 256 جی بی · سرمئی · نیا",
  category: "ٹیبلٹس",
};
// A second demo device listed by two different shops (the Riyadh and Oasis demo shops), same model and configuration.
const LAPTOP_DEMO_KEY = "demo:laptop-servo-15-16gb-512gb-gray-new";
const LAPTOP_DEMO_AR_NAME = "[بيانات تجريبية] لابتوب سيرفو 15 · 16 جيجا · 512 جيجا · رمادي · جديد";
const LAPTOP_DEMO_SPECS: Record<Lang, ProductSpec[]> = {
  ar: [
    { label: "الشاشة", value: "15.6 بوصة" },
    { label: "الذاكرة", value: "16 جيجا" },
    { label: "التخزين", value: "512 جيجا" },
    { label: "اللون", value: "رمادي" },
    { label: "الحالة", value: "جديد" },
  ],
  en: [
    { label: "Display", value: "15.6 inch" },
    { label: "Memory", value: "16 GB" },
    { label: "Storage", value: "512 GB" },
    { label: "Colour", value: "Gray" },
    { label: "Condition", value: "New" },
  ],
  ur: [
    { label: "ڈسپلے", value: "15.6 انچ" },
    { label: "میموری", value: "16 جی بی" },
    { label: "اسٹوریج", value: "512 جی بی" },
    { label: "رنگ", value: "سرمئی" },
    { label: "حالت", value: "نیا" },
  ],
};
const LAPTOP_DEMO_OFFERS: Array<{ shopId: string; price: number }> = [
  { shopId: "demo-shop-1", price: 4449 },
  { shopId: "demo-shop-3", price: 4299 },
];
// Sample Urdu text for products that have none yet (description, highlights, spec table). Preview text, not a review.
const URDU_SAMPLE_FEATURES = ["دو سال کی مقامی وارنٹی", "قیمت آرڈر سے پہلے ظاہر ہوتی ہے", "آسان اور تیز ترسیل"];
const URDU_SAMPLE_SPECS: ProductSpec[] = [
  { label: "حالت", value: "نیا" },
  { label: "وارنٹی", value: "دو سال" },
  { label: "ترسیل", value: "تیز" },
];
const urduSampleDescription = (name: string) => `${name}۔ معیاری مصنوعہ، مقامی وارنٹی اور تیز ترسیل کے ساتھ دستیاب ہے۔`;

const COMPARE_DEMO_PRICES = [1749, 1689, 1799];
const COMPARE_DEMO_PRODUCTS: ProductRow[] = COMPARE_DEMO_SHOPS.map((shop, index) => ({
  id: `demo-compare-${index + 1}`,
  mark: "",
  price: COMPARE_DEMO_PRICES[index],
  compareAt: COMPARE_DEMO_PRICES[index],
  rating: 0,
  reviews: 0,
  hidden: false,
  onHome: false,
  nameAr: COMPARE_DEMO_AR_NAME,
  nameEn: "[Demo data] 11-inch tablet · 256 GB · Gray · New",
  nameUr: COMPARE_DEMO_UR.name,
  categoryUr: COMPARE_DEMO_UR.category,
  categoryAr: "أجهزة لوحية",
  categoryEn: "Tablets",
  categoryId: "tablets",
  image: "/departments/tablets.png",
  source: "demo",
  matchKey: COMPARE_DEMO_KEY,
  shopId: shop.id,
  specsAr: COMPARE_DEMO_SPECS.ar,
  specsEn: COMPARE_DEMO_SPECS.en,
  descriptionUr: urduSampleDescription(COMPARE_DEMO_UR.name),
  featuresUr: URDU_SAMPLE_FEATURES,
  specsUr: COMPARE_DEMO_SPECS.ur,
}));

const LAPTOP_DEMO_PRODUCTS: ProductRow[] = LAPTOP_DEMO_OFFERS.map((offer, index) => ({
  id: `demo-compare-laptop-${index + 1}`,
  mark: "",
  price: offer.price,
  compareAt: offer.price,
  rating: 0,
  reviews: 0,
  hidden: false,
  onHome: false,
  nameAr: LAPTOP_DEMO_AR_NAME,
  nameEn: "[Demo data] Servo 15 laptop · 16 GB · 512 GB · Gray · New",
  nameUr: "[آزمائشی ڈیٹا] سروو 15 لیپ ٹاپ · 16 جی بی · 512 جی بی · سرمئی · نیا",
  categoryUr: "اسٹوڈنٹ لیپ ٹاپس",
  categoryAr: "لابتوبات دراسة",
  categoryEn: "Student laptops",
  categoryId: "student-laptops",
  image: "/departments/student-laptops.png",
  source: "demo",
  matchKey: LAPTOP_DEMO_KEY,
  shopId: offer.shopId,
  specsAr: LAPTOP_DEMO_SPECS.ar,
  specsEn: LAPTOP_DEMO_SPECS.en,
  descriptionUr: urduSampleDescription("[آزمائشی ڈیٹا] سروو 15 لیپ ٹاپ · 16 جی بی · 512 جی بی · سرمئی · نیا"),
  featuresUr: URDU_SAMPLE_FEATURES,
  specsUr: LAPTOP_DEMO_SPECS.ur,
}));
const ALL_DEMO_PRODUCTS = [...COMPARE_DEMO_PRODUCTS, ...LAPTOP_DEMO_PRODUCTS];

function withCompareDemo(content: SiteContent): SiteContent {
  if (!PREVIEW) return content;
  const missing = ALL_DEMO_PRODUCTS.filter((item) => !content.products.some((row) => row.id === item.id));
  // Demo rows saved before their specs existed get them filled in; specs that are already set are never touched.
  const known = new Map(ALL_DEMO_PRODUCTS.map((item) => [item.id, item]));
  const needSpecs = content.products.some((row) => known.has(row.id) && !row.specsAr);
  if (!missing.length && !needSpecs) return content;
  const filled = content.products.map((row) => {
    const demo = known.get(row.id);
    return demo ? { ...row, specsAr: row.specsAr ?? demo.specsAr, specsEn: row.specsEn ?? demo.specsEn } : row;
  });
  return { ...content, products: [...filled, ...missing] };
}

// Old local demo products that stay in src/data/demo-products.ts but no longer show in the store: the 11-inch tablet is
// replaced by the shop-comparison offers (demo-compare-1..3). Hidden, not deleted, so it stays in the dashboard's hidden list.
const RETIRED_DEMO_IDS: ReadonlySet<string> = new Set(["demo-tablet"]);

function demoRow(item: DemoProduct): ProductRow {
  const ur = DEMO_PRODUCTS_UR[item.id];
  return { ...item, nameUr: ur?.name ?? "", categoryUr: ur?.category ?? "", descriptionUr: urduSampleDescription(ur?.name ?? item.nameAr), featuresUr: URDU_SAMPLE_FEATURES, specsUr: URDU_SAMPLE_SPECS, mark: "", rating: 0, reviews: 0, hidden: RETIRED_DEMO_IDS.has(item.id), onHome: false, source: "demo" };
}

/** Home page sections the dashboard can switch off. The footer always shows. */
export type SectionKey = "hero" | "catalog" | "deals" | "bestsellers" | "addons" | "setups";

// The accessories block is not part of the home page yet, so it starts switched off.
const DEFAULT_SECTION_HIDDEN: SectionKey[] = ["addons"];

export type SlideCopy = {
  title: string;
  titleRest: string;
  lead: string;
  /** Button text; without it the built-in text for the slide shows. */
  primary?: string;
  /** Where the button goes, relative to the language root: "c/<category>" or "offers". Same in both languages. */
  link?: string;
  /** The small card under the button: its heading and its lines. */
  offer?: string;
  points?: string[];
};

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
  /** Departments archived from the dashboard; they are also listed in categoryHidden. */
  categoryArchived: string[];
  /** Hero slide positions switched off or archived from the dashboard. */
  heroHidden: number[];
  heroArchived: number[];
  sectionHidden: SectionKey[];
  /** Departments added from the dashboard; they show in the store menus next to the built-in tree. */
  addedCategories: CatalogCategory[];
  /** Order the dashboard gave to departments on this browser (category id -> sort); empty means the built-in order. */
  categoryOrder: Record<string, number>;
  /** Order of the home page sections, built-in and custom. */
  homeOrder: HomeBlock[];
  customSections: CustomSection[];
  brand: Brand;
};

/** A home page block: a built-in section key or the id of a section added from the dashboard. */
export type HomeBlock = SectionKey | `custom-${string}`;

const DEFAULT_ORDER: SectionKey[] = ["hero", "catalog", "deals", "bestsellers", "addons", "setups"];

export type CustomCopy = { eyebrow: string; title: string; lead: string; action: string };

/** A home section added from the dashboard: a text banner with a button, or a row of chosen products. */
export type CustomSection = {
  id: `custom-${string}`;
  kind: "banner" | "products";
  hidden: boolean;
  ar: CustomCopy;
  en: CustomCopy;
  /** Where the banner button goes, e.g. /offers or /c/gaming (the language prefix is added). */
  link: string;
  productIds: string[];
};

export type Brand = {
  name: Record<Lang, string>;
  tagline: Record<Lang, string>;
  /** The letter in the logo tile when no logo image is set. */
  mark: Record<Lang, string>;
  /** Uploaded logo as a data URL; empty uses the letter tile. */
  logo: string;
};

export type NewCategory = Pick<CatalogCategory, "nameAr" | "nameEn" | "nameUr" | "descriptionAr" | "descriptionEn" | "descriptionUr" | "parentId" | "featured"> & { icon?: string };

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
    nameUr: textOf("ur", item.id)?.name ?? "",
    descriptionUr: urduSampleDescription(textOf("ur", item.id)?.name ?? item.id),
    categoryAr: textOf("ar", item.id)?.category ?? "",
    categoryEn: textOf("en", item.id)?.category ?? "",
    categoryUr: textOf("ur", item.id)?.category ?? "",
  }));
  products.push(...DEMO_PRODUCTS.map(demoRow));

  const both = <T,>(pick: (lang: Lang) => T): Record<Lang, T> => ({
    ar: pick("ar"),
    en: pick("en"),
    ur: pick("ur"),
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
    categoryArchived: [],
    heroHidden: [],
    heroArchived: [],
    sectionHidden: [...DEFAULT_SECTION_HIDDEN],
    addedCategories: [],
    categoryOrder: {},
    homeOrder: [...DEFAULT_ORDER],
    customSections: [],
    brand: {
      name: both((lang) => translations[lang].brand),
      tagline: both((lang) => translations[lang].tagline ?? ""),
      mark: { ar: "س", en: "E", ur: "ا" },
      logo: "",
    },
  };
}

/** Keeps every built-in and custom section in the order exactly once, dropping stale entries. */
function normalOrder(order: readonly string[] | undefined, custom: readonly CustomSection[]): HomeBlock[] {
  const known = new Set<string>([...DEFAULT_ORDER, ...custom.map((item) => item.id)]);
  const kept = (order ?? []).filter((id, index, list) => known.has(id) && list.indexOf(id) === index) as HomeBlock[];
  const missing = [...DEFAULT_ORDER, ...custom.map((item) => item.id)].filter((id) => !kept.includes(id));
  return [...kept, ...missing];
}

function load(): SiteContent {
  return withCompareDemo(loadSaved());
}

function loadSaved(): SiteContent {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw) as SiteContent;
    // Every built-in product must be there; rows added from the dashboard come on top of them.
    if (!Array.isArray(parsed.products) || OFFER_PRODUCTS.some((item) => !parsed.products.some((row) => row.id === item.id))) return defaults();
    // Demo products ship with the code, so older saved content picks up any it is missing.
    parsed.products = [...parsed.products, ...DEMO_PRODUCTS.filter((item) => !parsed.products.some((row) => row.id === item.id)).map(demoRow)];
    // Sample Urdu text for rows saved before Urdu existed; a row that already has its own Urdu text keeps it.
    parsed.products = parsed.products.map((row) => {
      if (row.nameUr?.trim()) {
        // The Urdu name is already there; a row still without Urdu description, highlights or specs gets the samples.
        const demo = row.source === "demo";
        return {
          ...row,
          descriptionUr: row.descriptionUr?.trim() ? row.descriptionUr : urduSampleDescription(row.nameUr),
          featuresUr: row.featuresUr ?? (demo ? URDU_SAMPLE_FEATURES : null),
          specsUr: row.specsUr ?? (demo ? (ALL_DEMO_PRODUCTS.find((item) => item.id === row.id)?.specsUr ?? URDU_SAMPLE_SPECS) : null),
        };
      }
      const shown = ALL_DEMO_PRODUCTS.find((item) => item.id === row.id);
      const sample = shown?.nameUr ? { name: shown.nameUr, category: shown.categoryUr ?? "" } : row.source === "demo" ? DEMO_PRODUCTS_UR[row.id] : !row.source ? textOf("ur", row.id) : undefined;
      if (!sample) return row;
      const demo = row.source === "demo";
      return {
        ...row,
        nameUr: sample.name,
        categoryUr: row.categoryUr?.trim() || sample.category,
        descriptionUr: row.descriptionUr?.trim() ? row.descriptionUr : urduSampleDescription(sample.name),
        featuresUr: row.featuresUr ?? (demo ? URDU_SAMPLE_FEATURES : null),
        specsUr: row.specsUr ?? (demo ? (shown?.specsUr ?? URDU_SAMPLE_SPECS) : null),
      };
    });
    // A retired demo product that was saved earlier in this browser is hidden too (only that exact id).
    parsed.products = parsed.products.map((row) => (RETIRED_DEMO_IDS.has(row.id) && row.source === "demo" && !row.hidden ? { ...row, hidden: true } : row));
    if (!parsed.hero?.ar?.length || !parsed.deals?.en || !parsed.footer?.ar) return defaults();
    if (!Array.isArray(parsed.categoryHidden)) parsed.categoryHidden = [];
    if (!Array.isArray(parsed.categoryArchived)) parsed.categoryArchived = [];
    if (!Array.isArray(parsed.heroHidden)) parsed.heroHidden = [];
    if (!Array.isArray(parsed.heroArchived)) parsed.heroArchived = [];
    if (!Array.isArray(parsed.sectionHidden)) parsed.sectionHidden = [...DEFAULT_SECTION_HIDDEN];
    if (!Array.isArray(parsed.addedCategories)) parsed.addedCategories = [];
    if (!parsed.categoryOrder || typeof parsed.categoryOrder !== "object") parsed.categoryOrder = {};
    if (!Array.isArray(parsed.customSections)) parsed.customSections = [];
    parsed.homeOrder = normalOrder(parsed.homeOrder, parsed.customSections);
    const fresh = defaults();
    const base = fresh.brand;
    parsed.brand = {
      name: { ...base.name, ...parsed.brand?.name },
      tagline: { ...base.tagline, ...parsed.brand?.tagline },
      mark: { ...base.mark, ...parsed.brand?.mark },
      logo: typeof parsed.brand?.logo === "string" ? parsed.brand.logo : "",
    };
    // Older saves only have ar/en; fill Urdu from code defaults without wiping edits.
    parsed.hero = { ...fresh.hero, ...parsed.hero, ur: parsed.hero?.ur ?? fresh.hero.ur };
    parsed.catalog = { ...fresh.catalog, ...parsed.catalog, ur: parsed.catalog?.ur ?? fresh.catalog.ur };
    parsed.deals = { ...fresh.deals, ...parsed.deals, ur: parsed.deals?.ur ?? fresh.deals.ur };
    parsed.bestsellers = { ...fresh.bestsellers, ...parsed.bestsellers, ur: parsed.bestsellers?.ur ?? fresh.bestsellers.ur };
    parsed.addons = { ...fresh.addons, ...parsed.addons, ur: parsed.addons?.ur ?? fresh.addons.ur };
    parsed.setups = { ...fresh.setups, ...parsed.setups, ur: parsed.setups?.ur ?? fresh.setups.ur };
    parsed.footer = { ...fresh.footer, ...parsed.footer, ur: parsed.footer?.ur ?? fresh.footer.ur };
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
    const listed = {
      ar: { title: "تصفح الأقسام", subtitle: "أهم أقسام المتجر. باقي الأقسام من قائمة جميع الأقسام." },
      en: { title: "Browse departments", subtitle: "The main departments. The rest are in All departments." },
    };
    const interim = {
      ar: { title: "تصفح حسب القسم", subtitle: "اختار القسم اللي تدور عليه، وشوف المنتجات المتوفرة فيه." },
      en: { title: "Browse by department", subtitle: "Pick a department to see the products in it." },
    };
    for (const l of ["ar", "en"] as const) {
      if (parsed.catalog?.[l]?.title === interim[l].title) parsed.catalog[l].title = translations[l].catalog.title;
      if (parsed.catalog?.[l]?.subtitle === interim[l].subtitle) parsed.catalog[l].subtitle = translations[l].catalog.subtitle;
      if (parsed.catalog?.[l]?.title === listed[l].title) parsed.catalog[l].title = translations[l].catalog.title;
      if (parsed.catalog?.[l]?.subtitle === listed[l].subtitle) parsed.catalog[l].subtitle = translations[l].catalog.subtitle;
    }
    if (parsed.deals?.ar?.eyebrow === "أقوى عروض السيف") parsed.deals.ar.eyebrow = translations.ar.deals.eyebrow;
    if (parsed.deals?.en?.eyebrow === "Al-Saif's strongest offers") parsed.deals.en.eyebrow = translations.en.deals.eyebrow;
    // The offers banner's title and description moved to new wording: a copy that still holds the previous built-in text
    // is updated; anything edited in the dashboard is left as it is.
    const previousDeals = {
      ar: { title: "أقوى العروض الحصرية", lead: "أسعار واضحة على جوالات، وأجهزة بلايستيشن، وإكسسوارات مختارة." },
      en: { title: "Exclusive offers", lead: "Clear prices on selected phones, PlayStation consoles, and accessories." },
      ur: { title: "خصوصی آفرز", lead: "موبائل، پلے اسٹیشن اور منتخب لوازمات پر صاف قیمتیں۔" },
    } as const;
    for (const l of ["ar", "en", "ur"] as const) {
      const saved = parsed.deals?.[l];
      if (!saved) continue;
      if (saved.title === previousDeals[l].title) saved.title = translations[l].deals.title;
      if (saved.lead === previousDeals[l].lead) saved.lead = translations[l].deals.lead;
    }
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
    // The third hero slide used to describe a warranty; saved copies of it move to the current wording.
    for (const l of ["ar", "en"] as const) {
      const saved = parsed.hero[l][2];
      const fresh = translations[l].hero.slides[2];
      const stale = /ضمان|warranty|كل اللي تحتاجه|لتجربة لعب أفضل|سماعات، وأيدي تحكم/i;
      if (saved && stale.test(`${saved.title} ${saved.titleRest} ${saved.lead}`)) {
        parsed.hero[l][2] = { ...saved, title: fresh.title, titleRest: fresh.titleRest, lead: fresh.lead };
      }
    }
    // The English phone slide's headline was a literal translation; saved copies move to the natural wording.
    const phoneSlide = parsed.hero.en[2];
    if (phoneSlide?.title === "Phones, selected" && phoneSlide.titleRest === "with care") {
      parsed.hero.en[2] = { ...phoneSlide, title: translations.en.hero.slides[2].title, titleRest: translations.en.hero.slides[2].titleRest };
    }
    return parsed;
  } catch {
    return defaults();
  }
}

function toOffer(row: ProductRow): OfferProduct {
  const base = OFFER_PRODUCTS.find((item) => item.id === row.id);
  return {
    id: row.id,
    mark: row.mark || base?.mark || "",
    price: row.price,
    compareAt: row.compareAt,
    rating: row.rating,
    reviews: row.reviews,
    image: row.image,
  };
}

// ---------------------------------------------------------------------------
// Catalogue from the store's database (server/). Products and categories come from the API when it answers;
// without it (a static build, or the server is off) the storefront keeps the built-in catalogue below with
// this browser's saved edits. The dashboard always works on the database: its changes are saved through the
// API and the browser's saved copy is never overwritten, so it stays as a fallback.
// ---------------------------------------------------------------------------

type ApiProduct = {
  id: string;
  nameAr: string;
  nameEn: string;
  nameUr?: string;
  labelAr: string;
  labelEn: string;
  labelUr?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  descriptionUr?: string;
  featuresAr?: string[] | null;
  featuresEn?: string[] | null;
  featuresUr?: string[] | null;
  specsAr?: ProductSpec[] | null;
  specsEn?: ProductSpec[] | null;
  specsUr?: ProductSpec[] | null;
  price: string;
  compareAtPrice: string | null;
  /** Optional per-piece wholesale price, set by the server; null when the listing has none. */
  wholesalePrice?: string | null;
  categoryId: string | null;
  showInHomeOffers: boolean;
  ratingAverage: string | null;
  reviewCount: number;
  images: Array<{ url: string }>;
  isVisible?: boolean;
  archivedAt?: string | null;
  stockQuantity?: number | null;
  shop?: Shop | null;
  /** A product a shop sent: PENDING or REJECTED; null when it is published. */
  approval?: "PENDING" | "REJECTED" | null;
  rejectReason?: string | null;
  submittedAt?: string | null;
};

type ApiShop = Shop & { products?: number };
const shopFromApi = ({ id, name, ownerName, phone, email, city, address, description, payment, status, rejectReason, createdAt, isActive, archived }: ApiShop): Shop => ({ id, name, ownerName, phone, email, city, address, description, payment, status, rejectReason, createdAt, isActive, archived });

type ApiCategory = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  nameUr?: string;
  descriptionAr: string;
  descriptionEn: string;
  descriptionUr?: string;
  imageUrl: string | null;
  icon: string;
  parentId: string | null;
  level: number;
  sortOrder: number;
  isFeatured: boolean;
  isVisible: boolean;
  archivedAt?: string | null;
};

type Remote = {
  mode: "public" | "admin";
  products: ProductRow[];
  categories: CatalogCategory[];
  /** Categories switched off or archived; the storefront filters its menus by this list. */
  hidden: string[];
  archived: string[];
  lowStock: number;
  canEdit: boolean;
  /** Shops from the database (dashboard only). */
  shops: Shop[];
};

const BUILT_IN_CATEGORIES = new Set(CATALOG.map((item) => item.id));

function productFromApi(item: ApiProduct): ProductRow {
  const builtIn = OFFER_PRODUCTS.find((product) => product.id === item.id);
  const price = Number(item.price);
  return {
    id: item.id,
    mark: builtIn?.mark ?? "",
    price,
    compareAt: item.compareAtPrice === null ? price : Number(item.compareAtPrice),
    wholesalePrice: item.wholesalePrice == null ? null : Number(item.wholesalePrice),
    rating: item.ratingAverage === null ? 0 : Number(item.ratingAverage),
    reviews: item.reviewCount,
    hidden: item.isVisible === false,
    onHome: item.showInHomeOffers,
    nameAr: item.nameAr,
    nameEn: item.nameEn,
    nameUr: item.nameUr ?? "",
    categoryAr: item.labelAr,
    categoryEn: item.labelEn,
    categoryUr: item.labelUr ?? "",
    archived: Boolean(item.archivedAt),
    categoryId: item.categoryId ?? undefined,
    // Built-in products keep their own photo files (/showcase and /card-photos) until a photo is uploaded from
    // the dashboard; uploads live under /uploads and are listed first.
    image: builtIn ? (item.images[0]?.url.startsWith("/uploads/") ? item.images[0].url : undefined) : item.images[0]?.url,
    source: builtIn ? undefined : item.id.startsWith("demo-") ? "demo" : "added",
    stock: item.stockQuantity ?? null,
    shopId: item.shop?.id ?? null,
    shop: item.shop ?? null,
    ...(item.approval ? { approval: item.approval === "REJECTED" ? ("rejected" as const) : ("pending" as const), rejectReason: item.rejectReason ?? undefined, submittedAt: item.submittedAt ?? undefined } : {}),
    descriptionAr: item.descriptionAr ?? "",
    descriptionEn: item.descriptionEn ?? "",
    descriptionUr: item.descriptionUr ?? "",
    featuresAr: item.featuresAr ?? null,
    featuresEn: item.featuresEn ?? null,
    featuresUr: item.featuresUr ?? null,
    specsAr: item.specsAr ?? null,
    specsEn: item.specsEn ?? null,
    specsUr: item.specsUr ?? null,
  };
}

function categoryFromApi(item: ApiCategory): CatalogCategory & { archivedAt: string | null; isVisible: boolean } {
  return {
    id: item.id,
    slug: item.slug,
    nameAr: item.nameAr,
    nameEn: item.nameEn,
    nameUr: item.nameUr ?? "",
    descriptionAr: item.descriptionAr,
    descriptionEn: item.descriptionEn,
    descriptionUr: item.descriptionUr ?? "",
    image: item.imageUrl ?? "",
    icon: item.icon,
    parentId: item.parentId,
    level: Math.min(3, Math.max(1, item.level)) as CatalogCategory["level"],
    sort: item.sortOrder,
    active: true,
    featured: item.isFeatured,
    archivedAt: item.archivedAt ?? null,
    isVisible: item.isVisible,
  };
}

function withCategoryLists(remote: Remote, categories: Array<ReturnType<typeof categoryFromApi>>): Remote {
  return {
    ...remote,
    categories,
    hidden: categories.filter((item) => !item.isVisible || item.archivedAt).map((item) => item.id),
    archived: categories.filter((item) => item.archivedAt).map((item) => item.id),
  };
}

function remoteFromApi(mode: Remote["mode"], data: { categories: ApiCategory[]; products: ApiProduct[]; shops?: ApiShop[]; settings?: { lowStock: number }; canEdit?: boolean }): Remote {
  const base: Remote = {
    mode,
    products: data.products.map(productFromApi),
    categories: [],
    hidden: [],
    archived: [],
    lowStock: data.settings?.lowStock ?? 5,
    canEdit: Boolean(data.canEdit),
    shops: (data.shops ?? []).map(shopFromApi),
  };
  return withCategoryLists(base, data.categories.map(categoryFromApi));
}

export type CatalogueState = {
  /** local: built-in catalogue in this browser; public: the store database; admin: the database, with hidden and archived items. */
  source: "local" | "public" | "admin";
  saving: boolean;
  error: string | null;
  lowStock: number;
  canEdit: boolean;
};

export type ContentApi = {
  content: SiteContent;
  catalogue: CatalogueState;
  updateProduct: (id: string, patch: Partial<ProductRow>) => void;
  /** Saves product fields immediately and waits for the server (or the local catalogue). Used by the edit form's Save button. */
  saveProduct: (id: string, patch: Partial<ProductRow>) => Promise<void>;
  /** Shops listed in the dashboard: from the database when connected, otherwise this browser's own list (preview). */
  shops: Shop[];
  /** Adds a shop and resolves with its id once it is saved. */
  /** Adds a shop (a name, or the full details) and resolves with its id once it is saved. */
  addShop: (input: string | ShopInput) => Promise<string>;
  renameShop: (id: string, name: string) => Promise<void>;
  /** Suspends or reactivates a shop (isActive), or moves it to the archive / restores it (archived). Its products leave the store while it is suspended or archived. */
  setShopState: (id: string, state: { isActive?: boolean; archived?: boolean }) => Promise<void>;
  /** The admin answers a seller's request to join: approve it, or refuse it with a reason. */
  reviewShop: (id: string, decision: { approve: true } | { approve: false; reason: string }) => Promise<void>;
  /** Saves a shop's details. */
  updateShop: (id: string, patch: Partial<ShopInput>) => Promise<void>;
  /** The shop that owns a product, or null when the product is not linked to a shop. */
  shopOf: (productId: string) => Shop | null;
  /** A shop by id: the database's shops, or the preview shops kept in this browser when the database has none with that id. */
  shopById: (id: string) => Shop | null;
  /** Every visible listing of the same product (same explicit matchKey), with its shop; empty when it has no matchKey. */
  offersOf: (productId: string) => Array<{ id: string; price: number; shop: Shop | null }>;
  /** Adds a product and resolves with its id once it is saved. */
  addProduct: (input: NewProduct) => Promise<string>;
  /** A shop sends a new product from its dashboard: it stays hidden from the store until the admin approves it. */
  submitProduct: (input: NewProduct) => Promise<string>;
  /** The admin approves a pending product (it goes live) or refuses it with a reason the shop can read. */
  approveProduct: (id: string) => void | Promise<void>;
  rejectProduct: (id: string, reason: string) => void | Promise<void>;
  updateHero: (lang: Lang, index: number, patch: Partial<SlideCopy>) => void;
  updateBlock: <K extends BlockKey>(key: K, lang: Lang, patch: Partial<SiteContent[K][Lang]>) => void;
  reset: () => void;
  copyOf: (lang: Lang, id: string) => { name: string; category: string } | undefined;
  visibleProducts: (mode: "home" | "all") => OfferProduct[];
  productById: (id: string) => OfferProduct | undefined;
  setCategoryHidden: (id: string, hidden: boolean) => void;
  /** Saves a new order for sibling categories (the first id comes first). */
  reorderCategories: (orderedIds: string[]) => Promise<void>;
  setCategoryArchived: (id: string, archived: boolean) => void;
  setSlideHidden: (index: number, hidden: boolean) => void;
  setSlideArchived: (index: number, archived: boolean) => void;
  setSectionHidden: (key: SectionKey, hidden: boolean) => void;
  /** Adds a department or subcategory and resolves with its id once it is saved. */
  addCategory: (input: NewCategory) => Promise<string>;
  updateAddedCategory: (id: string, patch: Partial<NewCategory>) => void;
  /** Saves a category's editable fields immediately and waits for the server when connected. */
  saveCategory: (id: string, patch: Partial<NewCategory> & { hidden?: boolean }) => Promise<void>;
  /** Moves a home section one place up (-1) or down (+1). */
  moveSection: (id: HomeBlock, step: -1 | 1) => void;
  addCustomSection: (kind: CustomSection["kind"]) => CustomSection["id"];
  updateCustomSection: (id: string, patch: Partial<Omit<CustomSection, "id" | "ar" | "en">>) => void;
  updateCustomCopy: (id: string, lang: "ar" | "en", patch: Partial<CustomCopy>) => void;
  removeCustomSection: (id: string) => void;
  updateBrand: (patch: { name?: Partial<Record<Lang, string>>; tagline?: Partial<Record<Lang, string>>; mark?: Partial<Record<Lang, string>>; logo?: string }) => void;
  /** Loads the full catalogue for the dashboard (needs an admin session). */
  loadAdminCatalogue: () => Promise<void>;
  /** Back to the public catalogue after signing out. */
  leaveAdminCatalogue: () => void;
  /** Sets a product's recorded stock; null stops tracking it. */
  setStock: (id: string, qty: number | null) => void;
  setLowStock: (value: number) => void;
  dismissSaveError: () => void;
};

/** URL-safe slug from the English name, kept unique against every existing category. */
function uniqueSlug(name: string) {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "department";
  const taken = new Set(allCategories().map((item) => item.slug));
  let slug = base;
  for (let n = 2; taken.has(slug); n += 1) slug = `${base}-${n}`;
  return slug;
}

function toggled(list: number[], value: number, on: boolean) {
  return on ? [...new Set([...list, value])] : list.filter((item) => item !== value);
}

const SHOPS_KEY = "alsaif:shops:v1";

function loadLocalShops(): Shop[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SHOPS_KEY) ?? "[]");
    const saved = Array.isArray(parsed) ? parsed.filter((item): item is Shop => typeof item?.id === "string" && typeof item?.name === "string") : [];
    // Preview: the demo shops are added once per id; renamed or existing shops are left as they are.
    if (!PREVIEW) return saved;
    // A demo shop saved before it had details gets the sample details; anything already written is kept.
    const filled = saved.map((shop) => {
      const demo = COMPARE_DEMO_SHOPS.find((item) => item.id === shop.id);
      return demo ? { ...demo, ...Object.fromEntries(Object.entries(shop).filter(([, value]) => typeof value === "string" ? value.trim() !== "" : value !== undefined)) } as Shop : shop;
    });
    return [...filled, ...COMPARE_DEMO_SHOPS.filter((demo) => !saved.some((shop) => shop.id === demo.id))];
  } catch {
    return PREVIEW ? [...COMPARE_DEMO_SHOPS] : [];
  }
}

/** Builds the admin PATCH body for a product. Blank names and a zero price are skipped (the server refuses them). */
function productPatchBody(patch: Partial<ProductRow>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (patch.nameAr !== undefined && patch.nameAr.trim()) body.nameAr = patch.nameAr;
  // English and Urdu are optional, so they may be cleared; the Arabic name may not.
  if (patch.nameEn !== undefined) body.nameEn = patch.nameEn;
  if (patch.nameUr !== undefined) body.nameUr = patch.nameUr;
  if (patch.categoryAr !== undefined) body.labelAr = patch.categoryAr;
  if (patch.categoryEn !== undefined) body.labelEn = patch.categoryEn;
  if (patch.categoryUr !== undefined) body.labelUr = patch.categoryUr;
  if (patch.price !== undefined && patch.price > 0) body.price = patch.price;
  if (patch.compareAt !== undefined) body.compareAtPrice = patch.compareAt;
  if (patch.wholesalePrice !== undefined) body.wholesalePrice = patch.wholesalePrice;
  if (patch.hidden !== undefined) body.isVisible = !patch.hidden;
  if (patch.onHome !== undefined) body.showInHomeOffers = patch.onHome;
  if (patch.categoryId !== undefined) body.categoryId = patch.categoryId || null;
  if (patch.shopId !== undefined) body.shopId = patch.shopId || null;
  if (patch.image?.startsWith("data:")) body.image = patch.image;
  for (const key of ["descriptionAr", "descriptionEn", "descriptionUr", "featuresAr", "featuresEn", "featuresUr", "specsAr", "specsEn", "specsUr"] as const) {
    if (patch[key] !== undefined) body[key] = patch[key];
  }
  return body;
}

const SYNC_CHANNEL = "alsaif-catalogue";

/** Tells the other open tabs (the storefront) that the dashboard saved something. */
function notifyOtherTabs() {
  try {
    const channel = new BroadcastChannel(SYNC_CHANNEL);
    channel.postMessage("changed");
    channel.close();
  } catch {
    // Not supported: other tabs refresh when they regain focus.
  }
}

export const SiteContentContext = createContext<ContentApi | null>(null);

export function SiteContentProvider({ children }: { children: ReactNode }) {
  // This browser's saved content. Catalogue fields here are only used when the database is not available.
  const [local, setContent] = useState<SiteContent>(load);
  const [remote, setRemote] = useState<Remote | null>(null);
  // Shops made in this browser (preview, no database). Never sent to a server.
  const [localShops, setLocalShops] = useState<Shop[]>(loadLocalShops);
  const [saving, setSaving] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Edits waiting to be sent (typing is sent after a short pause), and the stock each product had on the server.
  const pending = useRef(new Map<string, { body: Record<string, unknown>; timer: number; send: (body: Record<string, unknown>) => Promise<void> }>());
  const confirmedStock = useRef(new Map<string, number | null>());
  const remoteRef = useRef(remote);
  remoteRef.current = remote;

  const content = useMemo<SiteContent>(
    () =>
      remote
        ? {
            ...local,
            products: remote.products,
            categoryHidden: remote.hidden,
            categoryArchived: remote.archived,
            addedCategories: remote.categories.filter((item) => !BUILT_IN_CATEGORIES.has(item.id)),
          }
        : local,
    [local, remote],
  );
  // Registered during render so every menu below reads the current list on this same pass.
  registerCatalogue(remote ? remote.categories : null);
  registerAddedCategories(remote ? [] : local.addedCategories);
  registerCategoryOrder(remote ? {} : local.categoryOrder);

  useEffect(() => {
    try {
      // Only this browser's own content is written; catalogue data from the database never replaces it.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(local));
    } catch {
      // Storage full or blocked (a large logo can do it); the page keeps the change for this visit.
    }
  }, [local]);

  useEffect(() => {
    try {
      localStorage.setItem(SHOPS_KEY, JSON.stringify(localShops));
    } catch {
      // Storage blocked: the shops stay for this visit.
    }
  }, [localShops]);

  // The storefront reads the catalogue from the database when the API answers.
  useEffect(() => {
    const controller = new AbortController();
    api<{ categories: ApiCategory[]; products: ApiProduct[] }>("/catalogue", { signal: controller.signal })
      .then((data) => setRemote((current) => (current?.mode === "admin" ? current : remoteFromApi("public", data))))
      .catch(() => {
        // No API (static hosting or server off): keep the built-in catalogue.
      });
    return () => controller.abort();
  }, []);

  // Live sync: when the dashboard saves in another tab, or this tab comes back into view, the storefront
  // fetches the catalogue again so the change shows without reloading the page.
  useEffect(() => {
    const refresh = () => {
      if (remoteRef.current?.mode === "admin") return; // the dashboard already holds the newest data
      api<{ categories: ApiCategory[]; products: ApiProduct[] }>("/catalogue")
        .then((data) => setRemote((current) => (current?.mode === "admin" ? current : remoteFromApi("public", data))))
        .catch(() => {});
    };
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(SYNC_CHANNEL);
      channel.onmessage = refresh;
    } catch {
      // No BroadcastChannel: the focus refresh and the timer below still keep the page current.
    }
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    // Preview mode (no database) keeps the content in this browser's storage; follow edits made in another tab.
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && !remoteRef.current) setContent(load());
    };
    const timer = window.setInterval(onVisible, 30_000);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      channel?.close();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const remember = (rows: ProductRow[]) => {
    for (const row of rows) confirmedStock.current.set(row.id, row.stock ?? null);
  };

  const loadAdminCatalogue = useCallback(async () => {
    if (PREVIEW) return; // preview: stay on the browser's own catalogue, no database
    const data = await api<{ categories: ApiCategory[]; products: ApiProduct[]; shops: ApiShop[]; settings: { lowStock: number }; canEdit: boolean }>("/admin/catalogue");
    const next = remoteFromApi("admin", data);
    remember(next.products);
    setRemote(next);
  }, []);

  const leaveAdminCatalogue = useCallback(() => {
    setRemote(null);
    setSaveError(null);
    api<{ categories: ApiCategory[]; products: ApiProduct[] }>("/catalogue")
      .then((data) => setRemote((current) => current ?? remoteFromApi("public", data)))
      .catch(() => {});
  }, []);

  /** Shows a failed save and reloads the dashboard data, so the screen matches what is really saved. */
  const fail = (error: unknown) => {
    setSaveError(apiMessage(error));
    if (remoteRef.current?.mode === "admin" && !(error instanceof ApiError && error.status === 401)) void loadAdminCatalogue().catch(() => {});
  };

  async function track<T>(work: Promise<T>) {
    setSaving((count) => count + 1);
    try {
      const result = await work;
      notifyOtherTabs();
      return result;
    } finally {
      setSaving((count) => count - 1);
    }
  }

  /** Queues a change; repeated changes to the same item are merged and sent once the typing stops. */
  function schedule(key: string, patch: Record<string, unknown>, send: (body: Record<string, unknown>) => Promise<void>, delay: number) {
    const entry = pending.current.get(key) ?? { body: {}, timer: 0, send };
    Object.assign(entry.body, patch);
    entry.send = send;
    window.clearTimeout(entry.timer);
    entry.timer = window.setTimeout(() => {
      pending.current.delete(key);
      track(entry.send(entry.body)).catch(fail);
    }, delay);
    pending.current.set(key, entry);
  }

  const applyProduct = (item: ApiProduct) => {
    const fresh = productFromApi(item);
    confirmedStock.current.set(fresh.id, fresh.stock ?? null);
    setRemote((current) => {
      if (!current) return current;
      const known = current.products.some((row) => row.id === fresh.id);
      return {
        ...current,
        products: known
          ? current.products.map((row) => {
              if (row.id !== fresh.id) return row;
              // Newer edits still waiting to be sent win over this older answer.
              if (pending.current.has(`product:${row.id}`)) return { ...row, stock: pending.current.has(`stock:${row.id}`) ? row.stock : fresh.stock };
              return pending.current.has(`stock:${row.id}`) ? { ...fresh, stock: row.stock } : fresh;
            })
          : [fresh, ...current.products], // a product that is new to the list goes first
      };
    });
  };

  const applyCategory = (item: ApiCategory) => {
    const fresh = categoryFromApi(item);
    setRemote((current) => {
      if (!current) return current;
      const list = current.categories as Array<ReturnType<typeof categoryFromApi>>;
      const known = list.some((row) => row.id === fresh.id);
      const kept = pending.current.has(`category:${fresh.id}`);
      return withCategoryLists(current, known ? list.map((row) => (row.id === fresh.id ? (kept ? { ...fresh, nameAr: row.nameAr, nameEn: row.nameEn, nameUr: row.nameUr, descriptionAr: row.descriptionAr, descriptionEn: row.descriptionEn, descriptionUr: row.descriptionUr } : fresh) : row)) : [...list, fresh]);
    });
  };

  const admin = remote?.mode === "admin";
  const sendProduct = (id: string) => async (body: Record<string, unknown>) => applyProduct((await api<{ product: ApiProduct }>(`/admin/products/${encodeURIComponent(id)}`, { method: "PATCH", body })).product);
  const sendCategory = (id: string) => async (body: Record<string, unknown>) => applyCategory((await api<{ category: ApiCategory }>(`/admin/categories/${encodeURIComponent(id)}`, { method: "PATCH", body })).category);
  const patchCategoryLocally = (id: string, patch: Partial<ReturnType<typeof categoryFromApi>>) =>
    setRemote((current) => current && withCategoryLists(current, (current.categories as Array<ReturnType<typeof categoryFromApi>>).map((row) => (row.id === id ? { ...row, ...patch } : row))));

  /** The body of a new product for the API. A shop account sends no shop and no home-page flag: the server fixes both. */
  const productBody = (input: NewProduct, asShop: boolean) => ({
    nameAr: input.nameAr,
    nameEn: input.nameEn,
    nameUr: input.nameUr ?? "",
    labelAr: input.categoryAr,
    labelEn: input.categoryEn,
    labelUr: input.categoryUr ?? "",
    categoryId: input.categoryId,
    ...(asShop ? {} : { shopId: input.shopId || null, showInHomeOffers: input.onHome }),
    price: input.price,
    compareAtPrice: input.compareAt,
    wholesalePrice: input.wholesalePrice ?? null,
    descriptionAr: input.descriptionAr ?? "",
    descriptionEn: input.descriptionEn ?? "",
    descriptionUr: input.descriptionUr ?? "",
    featuresAr: input.featuresAr ?? undefined,
    featuresEn: input.featuresEn ?? undefined,
    featuresUr: input.featuresUr ?? undefined,
    specsAr: input.specsAr ?? undefined,
    specsEn: input.specsEn ?? undefined,
    specsUr: input.specsUr ?? undefined,
    isVisible: !input.hidden,
    image: input.image?.startsWith("data:") ? input.image : undefined,
  });

  const api_: ContentApi = {
    content,
    catalogue: { source: remote ? remote.mode : "local", saving: saving > 0, error: saveError, lowStock: remote?.lowStock ?? 5, canEdit: Boolean(remote?.canEdit) },
    loadAdminCatalogue,
    leaveAdminCatalogue,
    dismissSaveError: () => setSaveError(null),
    updateProduct(id, patch) {
      if (!admin) {
        setContent((current) => ({
          ...current,
          products: current.products.map((item) => (item.id === id ? { ...item, ...patch, id: item.id } : item)),
        }));
        return;
      }
      setRemote((current) => current && { ...current, products: current.products.map((item) => (item.id === id ? { ...item, ...patch, id: item.id } : item)) });
      const body = productPatchBody(patch);
      const immediate = patch.hidden !== undefined || patch.onHome !== undefined || patch.categoryId !== undefined || patch.shopId !== undefined || body.image !== undefined;
      if (Object.keys(body).length) schedule(`product:${id}`, body, sendProduct(id), immediate ? 0 : 600);
      if (patch.archived !== undefined) {
        const action = patch.archived ? "archive" : "restore";
        track(api<{ product: ApiProduct }>(`/admin/products/${encodeURIComponent(id)}/${action}`, { body: {} }))
          .then((result) => applyProduct(result.product))
          .catch(fail);
      }
    },
    async saveProduct(id, patch) {
      if (!admin) {
        setContent((current) => ({
          ...current,
          products: current.products.map((item) => (item.id === id ? { ...item, ...patch, id: item.id } : item)),
        }));
        return;
      }
      // Drop any typing debounce for this product so Save is the only write.
      const pendingKey = `product:${id}`;
      const queued = pending.current.get(pendingKey);
      if (queued) {
        window.clearTimeout(queued.timer);
        pending.current.delete(pendingKey);
      }
      setRemote((current) => current && { ...current, products: current.products.map((item) => (item.id === id ? { ...item, ...patch, id: item.id } : item)) });
      const body = productPatchBody(patch);
      if (!Object.keys(body).length) return;
      await track(sendProduct(id)(body));
    },
    shops: admin ? remote.shops : localShops,
    async addShop(input) {
      const data: ShopInput = typeof input === "string" ? { name: input } : input;
      const clean = { ...data, name: data.name.trim() };
      if (!clean.name) throw new ApiError(400, "INVALID_INPUT");
      if (!admin) {
        const shop: Shop = { id: `shop-${Date.now().toString(36)}`, ...clean };
        setLocalShops((current) => [...current, shop]);
        return shop.id;
      }
      const result = await track(api<{ shop: ApiShop }>("/admin/shops", { body: clean }));
      setRemote((current) => current && { ...current, shops: [...current.shops, shopFromApi(result.shop)] });
      return result.shop.id;
    },
    async setShopState(id, state) {
      if (!admin) {
        setLocalShops((current) => current.map((shop) => (shop.id === id ? { ...shop, ...state } : shop)));
        return;
      }
      const result = await track(api<{ shop: ApiShop }>(`/admin/shops/${encodeURIComponent(id)}/state`, { method: "PATCH", body: state }));
      setRemote((current) => current && { ...current, shops: current.shops.map((shop) => (shop.id === id ? shopFromApi(result.shop) : shop)) });
    },
    async reviewShop(id, decision) {
      if (!admin) return;
      const result = await track(api<{ shop: ApiShop }>(`/admin/shops/${encodeURIComponent(id)}/review`, { body: decision.approve ? { decision: "approve" } : { decision: "reject", reason: decision.reason } }));
      setRemote((current) => current && { ...current, shops: current.shops.map((shop) => (shop.id === id ? shopFromApi(result.shop) : shop)) });
    },
    async renameShop(id, name) {
      return this.updateShop(id, { name });
    },
    async updateShop(id, patch) {
      const clean = { ...patch, ...(patch.name !== undefined ? { name: patch.name.trim() } : {}) };
      if (clean.name !== undefined && !clean.name) throw new ApiError(400, "INVALID_INPUT");
      if (!admin) {
        setLocalShops((current) => current.map((shop) => (shop.id === id ? { ...shop, ...clean } : shop)));
        return;
      }
      const result = await track(api<{ shop: ApiShop }>(`/admin/shops/${encodeURIComponent(id)}`, { method: "PATCH", body: clean }));
      setRemote((current) => current && { ...current, shops: current.shops.map((shop) => (shop.id === id ? shopFromApi(result.shop) : shop)) });
    },
    shopOf(productId) {
      const row = content.products.find((item) => item.id === productId);
      if (!row?.shopId) {
        // The database does not link this product to a shop: use the preview link kept in this browser, if any.
        const previewShopId = admin ? local.products.find((item) => item.id === productId)?.shopId : null;
        return previewShopId ? (localShops.find((shop) => shop.id === previewShopId) ?? null) : null;
      }
      const list = admin ? remote.shops : localShops;
      return list.find((shop) => shop.id === row.shopId) ?? row.shop ?? null;
    },
    shopById(id) {
      return (admin ? remote.shops : localShops).find((shop) => shop.id === id) ?? localShops.find((shop) => shop.id === id) ?? null;
    },
    offersOf(productId) {
      const key = content.products.find((item) => item.id === productId)?.matchKey;
      if (!key) return [];
      const list = admin ? remote.shops : localShops;
      return content.products
        .filter((item) => item.matchKey === key && !item.hidden && !item.archived)
        .map((item) => ({ id: item.id, price: item.price, shop: (item.shopId && list.find((shop) => shop.id === item.shopId)) || item.shop || null }));
    },
    async submitProduct(input) {
      if (admin) {
        // A shop account: the server stores the product as waiting for the admin and keeps it hidden from the store.
        const result = await track(api<{ product: ApiProduct }>("/admin/products", { body: productBody(input, true) }));
        applyProduct(result.product);
        return result.product.id;
      }
      // Preview (no server): the submission lives in this browser's own list.
      const id = `p-${Date.now().toString(36)}`;
      const row: ProductRow = { ...input, id, mark: "", rating: 0, reviews: 0, source: "added", hidden: true, onHome: false, approval: "pending", submittedAt: new Date().toISOString() };
      setContent((current) => ({ ...current, products: [row, ...current.products] }));
      return id;
    },
    async approveProduct(id) {
      if (admin) {
        await track(api<{ product: ApiProduct }>(`/admin/products/${encodeURIComponent(id)}/approve`, { body: {} }))
          .then((result) => applyProduct(result.product))
          .catch(fail);
        return;
      }
      setContent((current) => ({
        ...current,
        products: current.products.map((row) => {
          if (row.id !== id) return row;
          const { approval: _approval, rejectReason: _reason, ...rest } = row;
          return { ...rest, hidden: false };
        }),
      }));
    },
    async rejectProduct(id, reason) {
      if (admin) {
        await track(api<{ product: ApiProduct }>(`/admin/products/${encodeURIComponent(id)}/reject`, { body: { reason: reason.trim() } }))
          .then((result) => applyProduct(result.product))
          .catch(fail);
        return;
      }
      setContent((current) => ({ ...current, products: current.products.map((row) => (row.id === id ? { ...row, approval: "rejected", rejectReason: reason.trim(), hidden: true } : row)) }));
    },
    async addProduct(input) {
      if (!admin) {
        const id = `p-${Date.now().toString(36)}`;
        const row: ProductRow = { ...input, id, mark: "", rating: 0, reviews: 0, source: "added" };
        setContent((current) => ({ ...current, products: [row, ...current.products] }));
        return id;
      }
      const result = await track(
        api<{ product: ApiProduct }>("/admin/products", { body: productBody(input, false) }),
      );
      applyProduct(result.product);
      return result.product.id;
    },
    setStock(id, qty) {
      if (!admin) return;
      const quantity = qty === null || !Number.isFinite(qty) ? null : Math.max(0, Math.floor(qty));
      setRemote((current) => current && { ...current, products: current.products.map((item) => (item.id === id ? { ...item, stock: quantity } : item)) });
      schedule(
        `stock:${id}`,
        { quantity },
        async (body) => {
          const result = await api<{ product: ApiProduct }>(`/admin/products/${encodeURIComponent(id)}/stock`, { method: "PUT", body: { quantity: body.quantity, expected: confirmedStock.current.get(id) ?? null } });
          applyProduct(result.product);
        },
        600,
      );
    },
    setLowStock(value) {
      if (!admin) return;
      const lowStock = Math.max(0, Math.floor(value) || 0);
      setRemote((current) => current && { ...current, lowStock });
      schedule("settings:inventory", { lowStock }, async (body) => void (await api("/admin/settings/inventory", { method: "PUT", body })), 600);
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
    async reorderCategories(orderedIds) {
      if (admin) {
        // Shown at once, then saved; if the server refuses, the list from the database comes back.
        setRemote((current) => current && withCategoryLists(current, (current.categories as Array<ReturnType<typeof categoryFromApi>>).map((row) => (orderedIds.includes(row.id) ? { ...row, sort: orderedIds.indexOf(row.id) + 1 } : row))));
        try {
          await track(api("/admin/categories/order", { method: "PUT", body: { ids: orderedIds } }));
        } catch (failure) {
          void loadAdminCatalogue().catch(() => undefined);
          throw failure;
        }
        return;
      }
      setContent((current) => ({ ...current, categoryOrder: { ...current.categoryOrder, ...Object.fromEntries(orderedIds.map((id, index) => [id, index + 1])) } }));
    },
    async addCategory(input) {
      if (admin) {
        const result = await track(
          api<{ category: ApiCategory }>("/admin/categories", {
            body: { nameAr: input.nameAr, nameEn: input.nameEn, nameUr: input.nameUr ?? "", descriptionAr: input.descriptionAr, descriptionEn: input.descriptionEn, descriptionUr: input.descriptionUr ?? "", parentId: input.parentId, isFeatured: input.featured, ...(input.icon ? { icon: input.icon } : {}) },
          }),
        );
        applyCategory(result.category);
        return result.category.id;
      }
      const slug = uniqueSlug(input.nameEn);
      const parent = input.parentId ? allCategories().find((item) => item.id === input.parentId) : null;
      const level = (parent ? Math.min(parent.level + 1, 3) : 1) as CatalogCategory["level"];
      const siblings = allCategories().filter((item) => item.parentId === (parent?.id ?? null));
      const category: CatalogCategory = {
        ...input,
        id: slug,
        slug,
        parentId: parent?.id ?? null,
        level,
        featured: level === 1 && input.featured,
        image: "",
        icon: input.icon || "grid",
        // A new department goes first among its siblings.
        sort: Math.min(1, ...siblings.map((item) => item.sort)) - 1,
        active: true,
      };
      setContent((current) => ({ ...current, addedCategories: [...current.addedCategories, category] }));
      return slug;
    },
    updateAddedCategory(id, patch) {
      if (admin) {
        patchCategoryLocally(id, patch);
        const body: Record<string, unknown> = {};
        if (patch.nameAr !== undefined && patch.nameAr.trim()) body.nameAr = patch.nameAr;
        if (patch.nameEn !== undefined && patch.nameEn.trim()) body.nameEn = patch.nameEn;
        if (patch.descriptionAr !== undefined) body.descriptionAr = patch.descriptionAr;
        if (patch.descriptionEn !== undefined) body.descriptionEn = patch.descriptionEn;
        if (patch.nameUr !== undefined) body.nameUr = patch.nameUr;
        if (patch.descriptionUr !== undefined) body.descriptionUr = patch.descriptionUr;
        if (patch.featured !== undefined) body.isFeatured = patch.featured;
        if (Object.keys(body).length) schedule(`category:${id}`, body, sendCategory(id), 600);
        return;
      }
      setContent((current) => ({
        ...current,
        addedCategories: current.addedCategories.map((item) =>
          item.id === id ? { ...item, ...patch, featured: item.level === 1 && (patch.featured ?? item.featured), parentId: item.parentId } : item,
        ),
      }));
    },
    async saveCategory(id, patch) {
      if (admin) {
        const pendingKey = `category:${id}`;
        const queued = pending.current.get(pendingKey);
        if (queued) {
          window.clearTimeout(queued.timer);
          pending.current.delete(pendingKey);
        }
        patchCategoryLocally(id, {
          ...patch,
          ...(patch.hidden !== undefined ? { isVisible: !patch.hidden } : {}),
        });
        const body: Record<string, unknown> = {};
        if (patch.nameAr !== undefined && patch.nameAr.trim()) body.nameAr = patch.nameAr;
        if (patch.nameEn !== undefined && patch.nameEn.trim()) body.nameEn = patch.nameEn;
        if (patch.descriptionAr !== undefined) body.descriptionAr = patch.descriptionAr;
        if (patch.descriptionEn !== undefined) body.descriptionEn = patch.descriptionEn;
        if (patch.nameUr !== undefined) body.nameUr = patch.nameUr;
        if (patch.descriptionUr !== undefined) body.descriptionUr = patch.descriptionUr;
        if (patch.featured !== undefined) body.isFeatured = patch.featured;
        if (patch.hidden !== undefined) body.isVisible = !patch.hidden;
        if (patch.icon !== undefined && patch.icon) body.icon = patch.icon;
        if (Object.keys(body).length) await track(sendCategory(id)(body));
        return;
      }
      setContent((current) => ({
        ...current,
        addedCategories: current.addedCategories.map((item) =>
          item.id === id ? { ...item, ...patch, featured: item.level === 1 && (patch.featured ?? item.featured), parentId: item.parentId } : item,
        ),
        categoryHidden:
          patch.hidden === undefined
            ? current.categoryHidden
            : patch.hidden
              ? [...new Set([...current.categoryHidden, id])]
              : current.categoryHidden.filter((value) => value !== id),
      }));
    },
    moveSection(id, step) {
      setContent((current) => {
        const order = [...current.homeOrder];
        const from = order.indexOf(id);
        const to = from + step;
        if (from < 0 || to < 0 || to >= order.length) return current;
        [order[from], order[to]] = [order[to], order[from]];
        return { ...current, homeOrder: order };
      });
    },
    addCustomSection(kind) {
      const id = `custom-${Date.now().toString(36)}` as const;
      const copy = (lang: Lang): CustomCopy =>
        lang === "ar"
          ? { eyebrow: "", title: kind === "banner" ? "قسم جديد" : "منتجات مختارة", lead: "", action: kind === "banner" ? "تسوق الآن" : "" }
          : { eyebrow: "", title: kind === "banner" ? "New section" : "Picked products", lead: "", action: kind === "banner" ? "Shop now" : "" };
      const section: CustomSection = { id, kind, hidden: false, ar: copy("ar"), en: copy("en"), link: "/offers", productIds: [] };
      setContent((current) => ({ ...current, customSections: [...current.customSections, section], homeOrder: [...current.homeOrder, id] }));
      return id;
    },
    updateCustomSection(id, patch) {
      setContent((current) => ({ ...current, customSections: current.customSections.map((item) => (item.id === id ? { ...item, ...patch } : item)) }));
    },
    updateCustomCopy(id, lang: "ar" | "en", patch) {
      setContent((current) => ({
        ...current,
        customSections: current.customSections.map((item) => (item.id === id ? { ...item, [lang]: { ...item[lang], ...patch } } : item)),
      }));
    },
    removeCustomSection(id) {
      setContent((current) => ({
        ...current,
        customSections: current.customSections.filter((item) => item.id !== id),
        homeOrder: current.homeOrder.filter((item) => item !== id),
      }));
    },
    updateBrand(patch) {
      setContent((current) => ({
        ...current,
        brand: {
          name: { ...current.brand.name, ...patch.name },
          tagline: { ...current.brand.tagline, ...patch.tagline },
          mark: { ...current.brand.mark, ...patch.mark },
          logo: patch.logo ?? current.brand.logo,
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
      // English and Urdu are optional extras: an empty value falls back to the Arabic text.
      if (lang === "en") return { name: row.nameEn.trim() || row.nameAr, category: row.categoryEn.trim() || row.categoryAr };
      if (lang === "ur" && (row.nameUr?.trim() || row.categoryUr?.trim())) return { name: row.nameUr?.trim() || row.nameAr, category: row.categoryUr?.trim() || row.categoryAr };
      if (lang === "ur" && row.source === "demo" && row.nameAr === COMPARE_DEMO_AR_NAME) return { name: COMPARE_DEMO_UR.name, category: COMPARE_DEMO_UR.category };
      if (lang === "ur" && row.source === "demo" && row.nameAr === LAPTOP_DEMO_AR_NAME) return { name: "[آزمائشی ڈیٹا] سروو 15 لیپ ٹاپ · 16 جی بی · 512 جی بی · سرمئی · نیا", category: "اسٹوڈنٹ لیپ ٹاپس" };
      return { name: row.nameAr, category: row.categoryAr };
    },
    visibleProducts(mode) {
      return content.products
        .filter((item) => !item.hidden && !item.archived && (mode === "all" || item.onHome))
        .slice(0, mode === "home" ? HOME_LIMIT : undefined)
        .map(toOffer);
    },
    productById(id) {
      const row = content.products.find((item) => item.id === id && !item.hidden && !item.archived);
      return row ? toOffer(row) : undefined;
    },
    setCategoryHidden(id, hidden) {
      if (admin) {
        patchCategoryLocally(id, { isVisible: !hidden });
        schedule(`category:${id}`, { isVisible: !hidden }, sendCategory(id), 0);
        return;
      }
      setContent((current) => ({
        ...current,
        categoryHidden: hidden
          ? [...new Set([...current.categoryHidden, id])]
          : current.categoryHidden.filter((item) => item !== id),
      }));
    },
    setCategoryArchived(id, archived) {
      if (admin) {
        // Waits for the server: archiving is refused while the category still holds products or subcategories.
        track(api<{ category: ApiCategory }>(`/admin/categories/${encodeURIComponent(id)}/${archived ? "archive" : "restore"}`, { body: {} }))
          .then((result) => applyCategory(result.category))
          .catch(fail);
        return;
      }
      setContent((current) => ({
        ...current,
        categoryArchived: archived
          ? [...new Set([...current.categoryArchived, id])]
          : current.categoryArchived.filter((item) => item !== id),
        categoryHidden: archived
          ? [...new Set([...current.categoryHidden, id])]
          : current.categoryHidden.filter((item) => item !== id),
      }));
    },
    setSlideHidden(index, hidden) {
      setContent((current) => ({ ...current, heroHidden: toggled(current.heroHidden, index, hidden) }));
    },
    setSlideArchived(index, archived) {
      setContent((current) => ({ ...current, heroArchived: toggled(current.heroArchived, index, archived) }));
    },
    setSectionHidden(key, hidden) {
      setContent((current) => ({
        ...current,
        sectionHidden: hidden ? [...new Set([...current.sectionHidden, key])] : current.sectionHidden.filter((item) => item !== key),
      }));
    },
  };

  return <SiteContentContext.Provider value={api_}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  const value = useContext(SiteContentContext);
  if (!value) throw new Error("SiteContentProvider is missing");
  return value;
}
