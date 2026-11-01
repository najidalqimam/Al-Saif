import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ApiError, api, apiMessage } from "@/lib/api";
import { CATALOG, allCategories, registerAddedCategories, registerCatalogue, type CatalogCategory } from "@/lib/catalog";
import { translations, type Lang } from "@/lib/i18n";
import { DEMO_PRODUCTS, type DemoProduct } from "@/data/demo-products";
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
  categoryAr: string;
  categoryEn: string;
  /** Archived products stay saved but leave the store; the dashboard can restore them. */
  archived?: boolean;
  /** Department chosen in the dashboard; without it the dashboard's default placement applies. */
  categoryId?: string;
  /** Photo for products added from the dashboard (a data URL) or the demo set (a public path). */
  image?: string;
  /** Where the product came from when it is not one of the built-in store products. */
  source?: "demo" | "added";
  /** Recorded stock from the database (dashboard only); null means not tracked. */
  stock?: number | null;
  /** Product page copy from the dashboard. Null or missing: the built-in highlights and specs show instead. */
  descriptionAr?: string;
  descriptionEn?: string;
  featuresAr?: string[] | null;
  featuresEn?: string[] | null;
  specsAr?: ProductSpec[] | null;
  specsEn?: ProductSpec[] | null;
};

export type ProductSpec = { label: string; value: string };

export type NewProduct = Pick<ProductRow, "nameAr" | "nameEn" | "categoryAr" | "categoryEn" | "categoryId" | "price" | "compareAt" | "image" | "hidden" | "onHome">;

function demoRow(item: DemoProduct): ProductRow {
  return { ...item, mark: "", rating: 0, reviews: 0, hidden: false, onHome: false, source: "demo" };
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

export type NewCategory = Pick<CatalogCategory, "nameAr" | "nameEn" | "descriptionAr" | "descriptionEn" | "parentId" | "featured">;

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
  products.push(...DEMO_PRODUCTS.map(demoRow));

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
    categoryArchived: [],
    heroHidden: [],
    heroArchived: [],
    sectionHidden: [...DEFAULT_SECTION_HIDDEN],
    addedCategories: [],
    homeOrder: [...DEFAULT_ORDER],
    customSections: [],
    brand: {
      name: both((lang) => translations[lang].brand),
      tagline: both((lang) => translations[lang].tagline ?? ""),
      mark: { ar: "س", en: "E" },
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
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw) as SiteContent;
    // Every built-in product must be there; rows added from the dashboard come on top of them.
    if (!Array.isArray(parsed.products) || OFFER_PRODUCTS.some((item) => !parsed.products.some((row) => row.id === item.id))) return defaults();
    // Demo products ship with the code, so older saved content picks up any it is missing.
    parsed.products = [...parsed.products, ...DEMO_PRODUCTS.filter((item) => !parsed.products.some((row) => row.id === item.id)).map(demoRow)];
    if (!parsed.hero?.ar?.length || !parsed.deals?.en || !parsed.footer?.ar) return defaults();
    if (!Array.isArray(parsed.categoryHidden)) parsed.categoryHidden = [];
    if (!Array.isArray(parsed.categoryArchived)) parsed.categoryArchived = [];
    if (!Array.isArray(parsed.heroHidden)) parsed.heroHidden = [];
    if (!Array.isArray(parsed.heroArchived)) parsed.heroArchived = [];
    if (!Array.isArray(parsed.sectionHidden)) parsed.sectionHidden = [...DEFAULT_SECTION_HIDDEN];
    if (!Array.isArray(parsed.addedCategories)) parsed.addedCategories = [];
    if (!Array.isArray(parsed.customSections)) parsed.customSections = [];
    parsed.homeOrder = normalOrder(parsed.homeOrder, parsed.customSections);
    const base = defaults().brand;
    parsed.brand = {
      name: { ...base.name, ...parsed.brand?.name },
      tagline: { ...base.tagline, ...parsed.brand?.tagline },
      mark: { ...base.mark, ...parsed.brand?.mark },
      logo: typeof parsed.brand?.logo === "string" ? parsed.brand.logo : "",
    };
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
  labelAr: string;
  labelEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  featuresAr?: string[] | null;
  featuresEn?: string[] | null;
  specsAr?: ProductSpec[] | null;
  specsEn?: ProductSpec[] | null;
  price: string;
  compareAtPrice: string | null;
  categoryId: string | null;
  showInHomeOffers: boolean;
  ratingAverage: string | null;
  reviewCount: number;
  images: Array<{ url: string }>;
  isVisible?: boolean;
  archivedAt?: string | null;
  stockQuantity?: number | null;
};

type ApiCategory = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
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
    rating: item.ratingAverage === null ? 0 : Number(item.ratingAverage),
    reviews: item.reviewCount,
    hidden: item.isVisible === false,
    onHome: item.showInHomeOffers,
    nameAr: item.nameAr,
    nameEn: item.nameEn,
    categoryAr: item.labelAr,
    categoryEn: item.labelEn,
    archived: Boolean(item.archivedAt),
    categoryId: item.categoryId ?? undefined,
    // Built-in products keep their own photo files (/showcase and /card-photos) until a photo is uploaded from
    // the dashboard; uploads live under /uploads and are listed first.
    image: builtIn ? (item.images[0]?.url.startsWith("/uploads/") ? item.images[0].url : undefined) : item.images[0]?.url,
    source: builtIn ? undefined : item.id.startsWith("demo-") ? "demo" : "added",
    stock: item.stockQuantity ?? null,
    descriptionAr: item.descriptionAr ?? "",
    descriptionEn: item.descriptionEn ?? "",
    featuresAr: item.featuresAr ?? null,
    featuresEn: item.featuresEn ?? null,
    specsAr: item.specsAr ?? null,
    specsEn: item.specsEn ?? null,
  };
}

function categoryFromApi(item: ApiCategory): CatalogCategory & { archivedAt: string | null; isVisible: boolean } {
  return {
    id: item.id,
    slug: item.slug,
    nameAr: item.nameAr,
    nameEn: item.nameEn,
    descriptionAr: item.descriptionAr,
    descriptionEn: item.descriptionEn,
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

function remoteFromApi(mode: Remote["mode"], data: { categories: ApiCategory[]; products: ApiProduct[]; settings?: { lowStock: number }; canEdit?: boolean }): Remote {
  const base: Remote = { mode, products: data.products.map(productFromApi), categories: [], hidden: [], archived: [], lowStock: data.settings?.lowStock ?? 5, canEdit: Boolean(data.canEdit) };
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

type ContentApi = {
  content: SiteContent;
  catalogue: CatalogueState;
  updateProduct: (id: string, patch: Partial<ProductRow>) => void;
  /** Adds a product and resolves with its id once it is saved. */
  addProduct: (input: NewProduct) => Promise<string>;
  updateHero: (lang: Lang, index: number, patch: Partial<SlideCopy>) => void;
  updateBlock: <K extends BlockKey>(key: K, lang: Lang, patch: Partial<SiteContent[K][Lang]>) => void;
  reset: () => void;
  copyOf: (lang: Lang, id: string) => { name: string; category: string } | undefined;
  visibleProducts: (mode: "home" | "all") => OfferProduct[];
  productById: (id: string) => OfferProduct | undefined;
  setCategoryHidden: (id: string, hidden: boolean) => void;
  setCategoryArchived: (id: string, archived: boolean) => void;
  setSlideHidden: (index: number, hidden: boolean) => void;
  setSlideArchived: (index: number, archived: boolean) => void;
  setSectionHidden: (key: SectionKey, hidden: boolean) => void;
  /** Adds a department or subcategory and resolves with its id once it is saved. */
  addCategory: (input: NewCategory) => Promise<string>;
  updateAddedCategory: (id: string, patch: Partial<NewCategory>) => void;
  /** Moves a home section one place up (-1) or down (+1). */
  moveSection: (id: HomeBlock, step: -1 | 1) => void;
  addCustomSection: (kind: CustomSection["kind"]) => CustomSection["id"];
  updateCustomSection: (id: string, patch: Partial<Omit<CustomSection, "id" | "ar" | "en">>) => void;
  updateCustomCopy: (id: string, lang: Lang, patch: Partial<CustomCopy>) => void;
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

const SiteContentContext = createContext<ContentApi | null>(null);

export function SiteContentProvider({ children }: { children: ReactNode }) {
  // This browser's saved content. Catalogue fields here are only used when the database is not available.
  const [local, setContent] = useState<SiteContent>(load);
  const [remote, setRemote] = useState<Remote | null>(null);
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

  useEffect(() => {
    try {
      // Only this browser's own content is written; catalogue data from the database never replaces it.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(local));
    } catch {
      // Storage full or blocked (a large logo can do it); the page keeps the change for this visit.
    }
  }, [local]);

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

  const remember = (rows: ProductRow[]) => {
    for (const row of rows) confirmedStock.current.set(row.id, row.stock ?? null);
  };

  const loadAdminCatalogue = useCallback(async () => {
    const data = await api<{ categories: ApiCategory[]; products: ApiProduct[]; settings: { lowStock: number }; canEdit: boolean }>("/admin/catalogue");
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
      return await work;
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
          : [...current.products, fresh],
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
      return withCategoryLists(current, known ? list.map((row) => (row.id === fresh.id ? (kept ? { ...fresh, nameAr: row.nameAr, nameEn: row.nameEn, descriptionAr: row.descriptionAr, descriptionEn: row.descriptionEn } : fresh) : row)) : [...list, fresh]);
    });
  };

  const admin = remote?.mode === "admin";
  const sendProduct = (id: string) => async (body: Record<string, unknown>) => applyProduct((await api<{ product: ApiProduct }>(`/admin/products/${encodeURIComponent(id)}`, { method: "PATCH", body })).product);
  const sendCategory = (id: string) => async (body: Record<string, unknown>) => applyCategory((await api<{ category: ApiCategory }>(`/admin/categories/${encodeURIComponent(id)}`, { method: "PATCH", body })).category);
  const patchCategoryLocally = (id: string, patch: Partial<ReturnType<typeof categoryFromApi>>) =>
    setRemote((current) => current && withCategoryLists(current, (current.categories as Array<ReturnType<typeof categoryFromApi>>).map((row) => (row.id === id ? { ...row, ...patch } : row))));

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
      const body: Record<string, unknown> = {};
      // Blank names and a zero price are not saved (the server refuses them); they stay on screen until fixed.
      if (patch.nameAr !== undefined && patch.nameAr.trim()) body.nameAr = patch.nameAr;
      if (patch.nameEn !== undefined && patch.nameEn.trim()) body.nameEn = patch.nameEn;
      if (patch.categoryAr !== undefined) body.labelAr = patch.categoryAr;
      if (patch.categoryEn !== undefined) body.labelEn = patch.categoryEn;
      if (patch.price !== undefined && patch.price > 0) body.price = patch.price;
      if (patch.compareAt !== undefined) body.compareAtPrice = patch.compareAt;
      if (patch.hidden !== undefined) body.isVisible = !patch.hidden;
      if (patch.onHome !== undefined) body.showInHomeOffers = patch.onHome;
      if (patch.categoryId !== undefined) body.categoryId = patch.categoryId || null;
      if (patch.image?.startsWith("data:")) body.image = patch.image;
      for (const key of ["descriptionAr", "descriptionEn", "featuresAr", "featuresEn", "specsAr", "specsEn"] as const) {
        if (patch[key] !== undefined) body[key] = patch[key];
      }
      const immediate = patch.hidden !== undefined || patch.onHome !== undefined || patch.categoryId !== undefined || body.image !== undefined;
      if (Object.keys(body).length) schedule(`product:${id}`, body, sendProduct(id), immediate ? 0 : 600);
      if (patch.archived !== undefined) {
        const action = patch.archived ? "archive" : "restore";
        track(api<{ product: ApiProduct }>(`/admin/products/${encodeURIComponent(id)}/${action}`, { body: {} }))
          .then((result) => applyProduct(result.product))
          .catch(fail);
      }
    },
    async addProduct(input) {
      if (!admin) {
        const id = `p-${Date.now().toString(36)}`;
        const row: ProductRow = { ...input, id, mark: "", rating: 0, reviews: 0, source: "added" };
        setContent((current) => ({ ...current, products: [...current.products, row] }));
        return id;
      }
      const result = await track(
        api<{ product: ApiProduct }>("/admin/products", {
          body: {
            nameAr: input.nameAr,
            nameEn: input.nameEn,
            labelAr: input.categoryAr,
            labelEn: input.categoryEn,
            categoryId: input.categoryId,
            price: input.price,
            compareAtPrice: input.compareAt,
            isVisible: !input.hidden,
            showInHomeOffers: input.onHome,
            image: input.image?.startsWith("data:") ? input.image : undefined,
          },
        }),
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
    async addCategory(input) {
      if (admin) {
        const result = await track(
          api<{ category: ApiCategory }>("/admin/categories", {
            body: { nameAr: input.nameAr, nameEn: input.nameEn, descriptionAr: input.descriptionAr, descriptionEn: input.descriptionEn, parentId: input.parentId, isFeatured: input.featured },
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
        icon: "grid",
        sort: Math.max(0, ...siblings.map((item) => item.sort)) + 1,
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
    updateCustomCopy(id, lang, patch) {
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
      return lang === "ar"
        ? { name: row.nameAr, category: row.categoryAr }
        : { name: row.nameEn, category: row.categoryEn };
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
