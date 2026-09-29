import { STORE_CATEGORIES } from "@/data/categories";

const PRODUCT_ALT: Record<string, string> = {
  phone: "جوال شاشة 6.7 بوصة",
  "phone-mini": "جوال شاشة 6.1 بوصة",
  console: "جهاز ألعاب مع يد تحكم",
  game: "لعبة",
  controller: "يد تحكم لاسلكية",
  "controller-extra": "يد تحكم إضافية",
  earbuds: "سماعة لاسلكية",
  "gaming-earbuds": "سماعة أذن للألعاب",
  charger: "شاحن سريع",
  cable: "كابل شحن",
  case: "حافظة حماية للجوال",
  bag: "حقيبة حماية",
  storage: "ذاكرة تخزين",
  "drive-512": "ذاكرة تخزين",
  screen: "شاشة 27 بوصة",
  "screen-24": "شاشة 24 بوصة",
  dock: "قاعدة شحن",
  power: "بطارية متنقلة",
  speaker: "سماعة مكبرة",
  headset: "سماعة رأس للألعاب",
};

export function CategoryArt({ id, className = "h-14 w-full" }: { id: string; className?: string }) {
  const name = STORE_CATEGORIES.find((item) => item.id === id)?.name ?? "قسم المتجر";
  return <img src={`/card-photos/cat-${id}.png`} alt={name} className={`${className} object-contain`} />;
}

export function ProductArt({ id, className = "h-24 w-24" }: { id: string; className?: string }) {
  return <img src={`/card-photos/product-${id}.png`} alt={PRODUCT_ALT[id] ?? "منتج"} className={`${className} object-contain`} />;
}
