/**
 * Urdu display layer for product specs. It only rewrites what is shown: spec labels and descriptive values that match
 * a known Arabic term, plus "number + unit" values. Anything else (models, brands, numbers, admin free text) is untouched,
 * and the stored product data is never changed.
 */
const LABELS: Record<string, string> = {
  "الشاشة": "اسکرین",
  "المقاس": "سائز",
  "السعة": "گنجائش",
  "اللون": "رنگ",
  "الحالة": "حالت",
  "الضمان": "وارنٹی",
  "النوع": "قسم",
  "الاستخدام": "استعمال",
  "الاتصال": "کنیکشن",
  "التوافق": "مطابقت",
  "المنصة": "پلیٹ فارم",
  "يشمل": "شامل",
  "المعالج": "پروسیسر",
  "الذاكرة": "میموری",
  "التخزين": "اسٹوریج",
  "الوزن": "وزن",
  "البطارية": "بیٹری",
  "الكاميرا": "کیمرا",
  "نظام التشغيل": "آپریٹنگ سسٹم",
  "الدقة": "ریزولوشن",
  "المنافذ": "پورٹس",
  "الموديل": "ماڈل",
  "الماركة": "برانڈ",
};

const VALUES: Record<string, string> = {
  "جديد": "نیا",
  "مستعمل": "استعمال شدہ",
  "رمادي": "سرمئی",
  "أسود": "کالا",
  "أبيض": "سفید",
  "أزرق": "نیلا",
  "أحمر": "سرخ",
  "أخضر": "سبز",
  "فضي": "چاندی جیسا",
  "ذهبي": "سنہری",
  "لاسلكي": "وائرلیس",
  "سنتان": "دو سال",
  "سنة واحدة": "ایک سال",
  "جوال": "موبائل",
  "ألعاب": "گیمز",
  "مكتب": "دفتر",
  "عمل وألعاب": "کام اور گیمز",
  "بلايستيشن": "پلے اسٹیشن",
  "يد تحكم": "کنٹرولر",
  "علبة شحن": "چارجنگ کیس",
  "شاحن سريع": "فاسٹ چارجر",
  "كابل شحن": "چارجنگ کیبل",
};

const UNITS: Array<[RegExp, string]> = [
  [/^([\d.,]+)\s*بوصة$/, "$1 انچ"],
  [/^([\d.,]+)\s*(?:جيجا|جيجابايت)$/, "$1 جی بی"],
  [/^([\d.,]+)\s*(?:تيرا|تيرابايت)$/, "$1 ٹی بی"],
  [/^([\d.,]+)\s*ميجا(?:بايت)?$/, "$1 ایم بی"],
  [/^([\d.,]+)\s*(?:ساعة|ساعات)$/, "$1 گھنٹے"],
  [/^([\d.,]+)\s*(?:شهر|أشهر)$/, "$1 ماہ"],
  [/^([\d.,]+)\s*(?:سنة|سنوات)$/, "$1 سال"],
];

function value(text: string): string {
  const key = text.trim();
  if (VALUES[key]) return VALUES[key];
  for (const [pattern, replacement] of UNITS) if (pattern.test(key)) return key.replace(pattern, replacement);
  return text;
}

/** Urdu display version of a spec list; unknown labels and values stay exactly as stored. */
export function specsForUrdu(specs: Array<[string, string]>): Array<[string, string]> {
  return specs.map(([label, text]) => [LABELS[label.trim()] ?? label, value(text)]);
}
