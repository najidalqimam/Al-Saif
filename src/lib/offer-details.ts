import type { Lang } from "@/lib/i18n";

type Detail = {
  features: string[];
  specs: Array<[string, string]>;
};

const ar: Record<string, Detail> = {
  phone: {
    features: ["شاشة 6.7 بوصة", "ضمان محلي لمدة سنتين", "السعر ظاهر قبل ما تطلب"],
    specs: [
      ["الشاشة", "6.7 بوصة"],
      ["الضمان", "سنتان"],
      ["الحالة", "جديد"],
    ],
  },
  console: {
    features: ["جهاز مع يد تحكم", "جاهز للألعاب والإكسسوارات", "ضمان محلي لمدة سنتين"],
    specs: [
      ["يشمل", "يد تحكم"],
      ["الضمان", "سنتان"],
      ["الحالة", "جديد"],
    ],
  },
  controller: {
    features: ["يد لاسلكية", "مناسبة لأجهزة البلايستيشن", "تقدر تطلبها مع الجهاز أو لوحدها"],
    specs: [
      ["الاتصال", "لاسلكي"],
      ["التوافق", "بلايستيشن"],
    ],
  },
  earbuds: {
    features: ["سماعة لاسلكية", "صوت واضح للمكالمات والموسيقى", "علبة شحن مع السماعة"],
    specs: [
      ["الاتصال", "لاسلكي"],
      ["يشمل", "علبة شحن"],
    ],
  },
  charger: {
    features: ["شاحن سريع", "مناسب للجوال", "كابل الشحن يُطلب لوحده"],
    specs: [
      ["النوع", "شاحن سريع"],
      ["الاستخدام", "جوال"],
    ],
  },
  case: {
    features: ["حماية للجوال", "خفيفة وسهلة التركيب", "تظهر شكل الجهاز"],
    specs: [
      ["النوع", "حافظة حماية"],
      ["الاستخدام", "جوال"],
    ],
  },
  storage: {
    features: ["ذاكرة تخزين إضافية", "مناسبة للصور والألعاب", "تنتقل بين الأجهزة"],
    specs: [
      ["النوع", "ذاكرة تخزين"],
      ["الاستخدام", "جوال وبلايستيشن"],
    ],
  },
  screen: {
    features: ["شاشة 27 بوصة", "مناسبة للعمل والألعاب", "الصورة واضحة من قريب"],
    specs: [
      ["المقاس", "27 بوصة"],
      ["الاستخدام", "عمل وألعاب"],
    ],
  },
  dock: {
    features: ["قاعدة تثبّت الجهاز أثناء الشحن", "مناسبة للمكتب", "الكابل منفصل"],
    specs: [
      ["النوع", "قاعدة شحن"],
      ["الاستخدام", "جوال"],
    ],
  },
  headset: {
    features: ["سماعة رأس للألعاب", "مايكروفون للمكالمات", "مريحة في الجلسات الطويلة"],
    specs: [
      ["النوع", "سماعة رأس"],
      ["الاستخدام", "ألعاب"],
    ],
  },
  "phone-mini": {
    features: ["شاشة 6.1 بوصة", "أخف في اليد", "ضمان محلي لمدة سنتين"],
    specs: [
      ["الشاشة", "6.1 بوصة"],
      ["الضمان", "سنتان"],
      ["الحالة", "جديد"],
    ],
  },
  game: {
    features: ["لعبة لأجهزة البلايستيشن", "نسخة جديدة", "تقدر تطلبها مع الجهاز"],
    specs: [
      ["المنصة", "بلايستيشن"],
      ["الحالة", "جديد"],
    ],
  },
  cable: {
    features: ["كابل شحن", "متين للاستخدام اليومي", "يناسب الشاحن السريع"],
    specs: [
      ["النوع", "كابل شحن"],
      ["الاستخدام", "جوال"],
    ],
  },
  power: {
    features: ["بطارية متنقلة", "تشحن الجوال أكثر من مرة", "خفيفة في الشنطة"],
    specs: [
      ["النوع", "بطارية متنقلة"],
      ["الاستخدام", "جوال"],
    ],
  },
  speaker: {
    features: ["سماعة مكبرة للصوت", "مناسبة للغرفة", "تتصل لاسلكيًا"],
    specs: [
      ["النوع", "سماعة مكبرة"],
      ["الاتصال", "لاسلكي"],
    ],
  },
  bag: {
    features: ["حقيبة حماية للجهاز", "جيب للإكسسوارات", "مناسبة للتنقل"],
    specs: [
      ["النوع", "حقيبة حماية"],
      ["الاستخدام", "جهاز وإكسسوارات"],
    ],
  },
  "screen-24": {
    features: ["شاشة 24 بوصة", "مقاس مريح للمكتب", "الصورة واضحة"],
    specs: [
      ["المقاس", "24 بوصة"],
      ["الاستخدام", "مكتب"],
    ],
  },
  "controller-extra": {
    features: ["يد إضافية للعب الجماعي", "لاسلكية", "متوافقة مع البلايستيشن"],
    specs: [
      ["الاتصال", "لاسلكي"],
      ["التوافق", "بلايستيشن"],
    ],
  },
  "gaming-earbuds": {
    features: ["سماعة أذن للألعاب", "صوت أوضح أثناء اللعب", "خفيفة على الأذن"],
    specs: [
      ["النوع", "سماعة أذن"],
      ["الاستخدام", "ألعاب"],
    ],
  },
  "drive-512": {
    features: ["سعة 512 جيجا", "مساحة للألعاب والصور", "تنتقل بين الأجهزة"],
    specs: [
      ["السعة", "512 جيجا"],
      ["النوع", "ذاكرة تخزين"],
    ],
  },
};

const en: Record<string, Detail> = {
  phone: {
    features: ["6.7-inch screen", "Two-year local warranty", "The price is shown before you order"],
    specs: [
      ["Screen", "6.7 inches"],
      ["Warranty", "Two years"],
      ["Condition", "New"],
    ],
  },
  console: {
    features: ["Console with a controller", "Ready for games and accessories", "Two-year local warranty"],
    specs: [
      ["Includes", "Controller"],
      ["Warranty", "Two years"],
      ["Condition", "New"],
    ],
  },
  controller: {
    features: ["Wireless controller", "Fits PlayStation consoles", "Order it with the console or on its own"],
    specs: [
      ["Connection", "Wireless"],
      ["Fits", "PlayStation"],
    ],
  },
  earbuds: {
    features: ["Wireless earbuds", "Clear sound for calls and music", "Charging case included"],
    specs: [
      ["Connection", "Wireless"],
      ["Includes", "Charging case"],
    ],
  },
  charger: {
    features: ["Fast charger", "Made for a phone", "The cable is ordered separately"],
    specs: [
      ["Type", "Fast charger"],
      ["Use", "Phone"],
    ],
  },
  case: {
    features: ["Protects the phone", "Light and easy to fit", "Leaves the device visible"],
    specs: [
      ["Type", "Protective case"],
      ["Use", "Phone"],
    ],
  },
  storage: {
    features: ["Extra storage", "Room for photos and games", "Moves between devices"],
    specs: [
      ["Type", "Storage"],
      ["Use", "Phone and PlayStation"],
    ],
  },
  screen: {
    features: ["27-inch screen", "For work and games", "A clear picture up close"],
    specs: [
      ["Size", "27 inches"],
      ["Use", "Work and games"],
    ],
  },
  dock: {
    features: ["Holds the phone while it charges", "Sits on a desk", "Cable sold separately"],
    specs: [
      ["Type", "Charging dock"],
      ["Use", "Phone"],
    ],
  },
  headset: {
    features: ["Gaming headset", "Microphone for calls", "Comfortable for long sessions"],
    specs: [
      ["Type", "Headset"],
      ["Use", "Games"],
    ],
  },
  "phone-mini": {
    features: ["6.1-inch screen", "Lighter in the hand", "Two-year local warranty"],
    specs: [
      ["Screen", "6.1 inches"],
      ["Warranty", "Two years"],
      ["Condition", "New"],
    ],
  },
  game: {
    features: ["A game for PlayStation", "New copy", "Order it with the console"],
    specs: [
      ["Platform", "PlayStation"],
      ["Condition", "New"],
    ],
  },
  cable: {
    features: ["Charging cable", "Made for daily use", "Works with the fast charger"],
    specs: [
      ["Type", "Charging cable"],
      ["Use", "Phone"],
    ],
  },
  power: {
    features: ["Power bank", "Charges a phone more than once", "Light enough for a bag"],
    specs: [
      ["Type", "Power bank"],
      ["Use", "Phone"],
    ],
  },
  speaker: {
    features: ["Room speaker", "Fills a small space", "Connects wirelessly"],
    specs: [
      ["Type", "Speaker"],
      ["Connection", "Wireless"],
    ],
  },
  bag: {
    features: ["Protective bag for the device", "A pocket for accessories", "Easy to carry"],
    specs: [
      ["Type", "Protective bag"],
      ["Use", "Device and accessories"],
    ],
  },
  "screen-24": {
    features: ["24-inch screen", "A comfortable desk size", "A clear picture"],
    specs: [
      ["Size", "24 inches"],
      ["Use", "Desk"],
    ],
  },
  "controller-extra": {
    features: ["An extra controller for playing together", "Wireless", "Fits PlayStation"],
    specs: [
      ["Connection", "Wireless"],
      ["Fits", "PlayStation"],
    ],
  },
  "gaming-earbuds": {
    features: ["Gaming earbuds", "Clearer sound while you play", "Light on the ear"],
    specs: [
      ["Type", "Earbuds"],
      ["Use", "Games"],
    ],
  },
  "drive-512": {
    features: ["512 GB of space", "Room for games and photos", "Moves between devices"],
    specs: [
      ["Capacity", "512 GB"],
      ["Type", "Storage"],
    ],
  },
};

export function offerDetail(lang: Lang, id: string) {
  return (lang === "ar" ? ar : en)[id];
}
