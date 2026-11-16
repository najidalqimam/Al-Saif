import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useLocation, useSearch } from "wouter";
import { ur } from "@/lib/i18n-ur";
import { isRtl, LANG_META, localePath } from "@/lib/locale";

export type Lang = "ar" | "en" | "ur";

export interface Translations {
  brand: string;
  tagline: string;
  documentTitle: string;
  switchTo: string;
  skipToContent: string;
  railPrev: string;
  railNext: string;
  top: {
    shipping: string;
    warranty: string;
    track: string;
  };
  searchPlaceholder: string;
  searchLabel: string;
  searchFor: string;
  searchDepartment: string;
  wishlist: string;
  themeToLight: string;
  themeToDark: string;
  cart: string;
  cartEmpty: string;
  cartCount: string;
  cartEmptyMessage: string;
  cartAdded: string;
  cartRemove: string;
  cartTotal: string;
  allCategories: string;
  allProducts: string;
  offers: string;
  navOffers: string;
  cartPage: {
    title: string;
    summary: string;
    productsOne: string;
    productsTwo: string;
    productsFew: string; // {count}
    productsMany: string; // {count}
    piecesOne: string;
    piecesTwo: string;
    piecesFew: string; // {count}
    piecesMany: string; // {count}
    perPiece: string; // {price} {currency}
    lineBreakdown: string; // {qty} {price}
  };
  wholesale: {
    productNotice: string; // {price} {currency}
    loginRequired: string;
    loginLink: string;
    cartApplied: string;
    cartNudge: string; // {price} {currency}
    cartNudgeTotal: string; // {total} {currency}
    previewNote: string;
    priceChangedTitle: string;
    priceChangedLead: string;
    newSubtotal: string; // {amount} {currency}
    confirmPrices: string;
    navLabel: string;
    pageLead: string;
    pageEmpty: string;
    cardLine: string; // {price} {currency}
    cardPerPiece: string;
    cardCondition: string; // {count}
    cardRetail: string; // {price} {currency}
    cardTotal: string; // {count}
    cardAddOne: string;
    cardAddTwo: string;
    cardAddFew: string; // {count}
    cardInCart: string;
    cardUnavailable: string;
  };
  compare: {
    back: string;
    offersTitle: string; // {count}
    sortNote: string;
    startsFrom: string;
    countOne: string;
    countMany: string; // {count}
    lowest: string;
    opened: string;
    viewProduct: string;
    demoBadge: string;
    demoNote: string;
    compareButton: string;
    availableIn: string; // {shops}
    shopsTwo: string;
    shopsFew: string; // {count}, 3 to 10
    shopsMany: string; // {count}, 11 and more
    shopLabel: string;
    demoShopPrefix: string;
  };
  favoritesPage: {
    title: string;
    lead: string;
    empty: string;
    browse: string;
  };
  productPage: {
    buyNow: string;
    description: string;
    quantity: string;
    soldBy: string;
    related: string;
    rating: string;
    priceNote: string;
  };
  searchPage: {
    title: string;
    resultsFor: string;
    count: string;
    categories: string;
    products: string;
    empty: string;
    prompt: string;
    browse: string;
  };
  categoryPage: {
    related: string;
    empty: string;
    open: string;
    products: string;
    noProducts: string;
  };
  categories: string[];
  catalog: {
    title: string;
    subtitle: string;
    kicker: string;
    viewAllDepartments: string;
    featuredBadge: string;
    sectionCount: string;
    showDepartments: string;
    showMore: string;
    showLess: string;
    moreDepartments: string;
    fewerDepartments: string;
    productCount: string;
    perks: Array<{ title: string; text: string }>;
    items: Array<{ id: string; name: string; count: number }>;
  };
  deals: {
    eyebrow: string;
    title: string;
    highlight: string;
    lead: string;
    endsSoon: string;
    discount: string;
    reviews: string;
    currency: string;
    addToCart: string;
    quickView: string;
    viewAll: string;
    /** The offers banner button on the home page (the shared "viewAll" text is used by other pages too). */
    bannerAction: string;
    pageTitle: string;
    pageLead: string;
    close: string;
    inStock: string;
    savedAmount: string;
    saveBadge: string;
    featuresTitle: string;
    specsTitle: string;
    original: string;
    quantity: string;
    decrease: string;
    increase: string;
    shippingNote: string;
    warrantyNote: string;
    products: Record<string, { name: string; category: string }>;
  };
  bestsellers: {
    eyebrow: string;
    title: string;
    titleFrom: string;
    lead: string;
    viewAll: string;
    filters: Array<{ id: string; label: string }>;
    bannerTitle: string;
    bannerLead: string;
    bannerAction: string;
    inquiry: {
      title: string;
      lead: string;
      name: string;
      phone: string;
      phoneHint: string;
      note: string;
      noteHint: string;
      submit: string;
      close: string;
      success: string;
      successLocal: string;
      saveError: string;
      phoneError: string;
      required: string;
    };
    badges: Record<string, string>;
  };
  addons: {
    eyebrow: string;
    title: string;
    lead: string;
    ready: string;
    badges: Record<string, string>;
  };
  setups: {
    eyebrow: string;
    title: string;
    lead: string;
    action: string;
    items: Array<{ id: string; title: string; text: string }>;
  };
  footer: {
    about: string;
    shipping: string;
    warranty: string;
    departmentsTitle: string;
    departments: string[];
    serviceTitle: string;
    services: string[];
    helpTitle: string;
    help: string[];
    rights: string;
    intro: string;
    shopTitle: string;
    beforeTitle: string;
    before: string[];
  };
  hero: {
    imageAlt: string;
    prev: string;
    next: string;
    pause: string;
    play: string;
    position: string;
    slides: Array<{
      eyebrow: string;
      title: string;
      titleRest: string;
      lead: string;
      points: string[];
      primary: string;
      secondary: string;
      badge: string;
      offer: string;
    }>;
  };
}

const ar: Translations = {
  brand: "سوق الكمبيوترات",
  tagline: "",
  documentTitle: "سوق الكمبيوترات",
  switchTo: "زبان / Language",
  skipToContent: "تخطَّ إلى المحتوى الرئيسي",
  railPrev: "السابق",
  railNext: "التالي",
  top: {
    shipping: "شحن مجاني للطلبات فوق 300 ر.س",
    warranty: "ضمان محلي لمدة سنتين",
    track: "تتبع الطلب",
  },
  searchPlaceholder: "ابحث عن جوال، بلايستيشن، أو إكسسوار...",
  searchLabel: "بحث في المتجر",
  searchFor: "ابحث عن «{query}»",
  searchDepartment: "قسم",
  wishlist: "المفضلة",
  themeToLight: "التبديل إلى الوضع الفاتح",
  themeToDark: "التبديل إلى الوضع الداكن",
  cart: "السلة",
  cartEmpty: "فارغة",
  cartCount: "{count} قطعة",
  cartEmptyMessage: "السلة فاضية. ضيف منتج من أي كارت.",
  cartAdded: "تم إضافة {name} إلى السلة",
  cartRemove: "حذف",
  cartTotal: "الإجمالي",
  allCategories: "جميع الأقسام",
  allProducts: "جميع المنتجات",
  offers: "العروض",
  navOffers: "عروض وتخفيضات",
  cartPage: {
    title: "سلة التسوق",
    summary: "ملخص الطلب",
    productsOne: "منتج واحد",
    productsTwo: "منتجان",
    productsFew: "{count} منتجات",
    productsMany: "{count} منتجًا",
    piecesOne: "قطعة واحدة",
    piecesTwo: "قطعتان",
    piecesFew: "{count} قطع",
    piecesMany: "{count} قطعة",
    perPiece: "{price} {currency} للقطعة",
    lineBreakdown: "{qty} × {price}",
  },
  wholesale: {
    productNotice: "اشترِ 5 قطع أو أكثر من نفس المنتج من هذا المحل بسعر الجملة: {price} {currency} للقطعة",
    loginRequired: "الاستفادة من سعر الجملة تتطلب تسجيل الدخول.",
    loginLink: "تسجيل الدخول",
    cartApplied: "سعر الجملة",
    cartNudge: "زوّد قطعة واحدة واستفد بسعر الجملة: {price} {currency} للقطعة",
    cartNudgeTotal: "إجمالي 5 قطع بسعر الجملة: {total} {currency}",
    previewNote: "سعر الجملة معاينة محلية على هذا المتصفح، ولا يُطبَّق بعد عند إتمام الطلب.",
    priceChangedTitle: "تغيّرت الأسعار",
    priceChangedLead: "تغيّر سعر أحد المنتجات أو لم تعد تنطبق عليه شروط سعر الجملة، فلم نُنفّذ الطلب. راجع الإجمالي الجديد وأكّده لإتمام الطلب.",
    newSubtotal: "إجمالي المنتجات الجديد: {amount} {currency}",
    confirmPrices: "أؤكد الأسعار الجديدة وأكمل الطلب",
    navLabel: "عروض الجملة",
    pageLead: "سعر الجملة يبدأ من 5 قطع من نفس المنتج عند نفس المحل، بعد تسجيل الدخول",
    pageEmpty: "لا توجد عروض جملة متاحة حاليًا",
    cardLine: "سعر الجملة: {price} {currency} للقطعة من 5 قطع",
    cardPerPiece: "/ قطعة",
    cardCondition: "عند شراء {count} قطع فأكثر من نفس المنتج ومن نفس المحل",
    cardRetail: "سعر القطعة منفردة: {price} {currency}",
    cardTotal: "إجمالي {count} قطع",
    cardAddOne: "أضف قطعة واحدة للسلة",
    cardAddTwo: "أضف قطعتين للسلة",
    cardAddFew: "أضف {count} قطع للسلة",
    cardInCart: "عرض في السلة",
    cardUnavailable: "غير متاح حاليًا",
  },
  compare: {
    back: "رجوع للمنتج",
    offersTitle: "عروض المحلات ({count})",
    sortNote: "مرتبة من الأقل سعرًا",
    startsFrom: "يبدأ من",
    countOne: "عرض واحد من محل",
    countMany: "{count} عروض من محلات",
    lowest: "الأقل سعرًا",
    opened: "العرض الذي فتحته",
    viewProduct: "عرض المنتج",
    demoBadge: "بيانات تجريبية",
    demoNote: "بيانات تجريبية للمعاينة، وليست أسعار محلات حقيقية.",
    compareButton: "مقارنة بالمحلات الأخرى",
    availableIn: "موجود في {shops}",
    shopsTwo: "محلّين",
    shopsFew: "{count} محلات",
    shopsMany: "{count} محلًا",
    shopLabel: "المحل",
    demoShopPrefix: "محل تجريبي",
  },
  favoritesPage: {
    title: "المفضلة",
    lead: "المنتجات اللي حفظتها، علشان ترجع لها بسهولة.",
    empty: "لسه ما حفظتش أي منتج. اضغط على القلب في أي منتج علشان يظهر هنا.",
    browse: "تصفح العروض",
  },
  productPage: {
    buyNow: "اشتري الآن",
    description: "عن المنتج",
    quantity: "الكمية",
    soldBy: "البائع",
    related: "منتجات مشابهة",
    rating: "{rating} من 5",
    priceNote: "السعر النهائي يظهر قبل ما تأكد الطلب.",
  },
  searchPage: {
    title: "البحث",
    resultsFor: "نتائج البحث عن «{query}»",
    count: "{count} نتيجة",
    categories: "أقسام مطابقة",
    products: "منتجات مطابقة",
    empty: "ما لقينا نتائج لـ «{query}». جرّب كلمة ثانية أو تصفح الأقسام.",
    prompt: "اكتب اسم المنتج أو القسم في خانة البحث.",
    browse: "تصفح العروض",
  },
  categoryPage: {
    related: "التصنيفات داخل هذا القسم.",
    empty: "هذا القسم جاهز، والمنتجات تتضاف له لاحقًا.",
    open: "افتح القسم",
    products: "المنتجات",
    noProducts: "ما فيه منتجات في هذا القسم حاليًا. تقدر تشوف العروض أو ترجع للأقسام.",
  },
  categories: ["جوالات", "بلايستيشن", "إكسسوارات بلايستيشن", "سماعات", "شواحن وكابلات"],
  catalog: {
    title: "كل احتياجاتك التقنية، في مكان واحد",
    subtitle: "اكتشف مجموعة واسعة من حلول الكمبيوتر والطباعة والشبكات والإلكترونيات، واختر القسم المناسب لاحتياجاتك.",
    kicker: "CATEGORIES",
    viewAllDepartments: "عرض جميع الأقسام",
    featuredBadge: "الأكثر مبيعاً",
    sectionCount: "{count} قسم",
    showDepartments: "عرض الأقسام ({count})",
    showMore: "عرض باقي الأقسام ({count})",
    showLess: "إخفاء الأقسام الإضافية",
    moreDepartments: "استكشف جميع الأقسام",
    fewerDepartments: "عرض أقسام أقل",
    productCount: "{count} منتج",
    perks: [
      {
        title: "شحن سريع ومجاني",
        text: "للطلبات فوق 300 ر.س",
      },
      {
        title: "ضمان محلي سنتين",
        text: "على الأجهزة المختارة، مع استبدال خلال فترة الضمان",
      },
      {
        title: "أسعار واضحة",
        text: "السعر ظاهر قبل ما تطلب",
      },
      {
        title: "طلب بسهولة",
        text: "تختار الجهاز، ونكمل معاك الخطوة التالية",
      },
    ],
    items: [
      { id: "all", name: "جميع المنتجات", count: 0 },
      { id: "offers", name: "عروض وتخفيضات", count: 20 },
      { id: "phones", name: "جوالات", count: 48 },
      { id: "playstation", name: "بلايستيشن", count: 16 },
      { id: "ps-accessories", name: "إكسسوارات بلايستيشن", count: 36 },
      { id: "controllers", name: "أيدي تحكم", count: 22 },
      { id: "games", name: "ألعاب", count: 40 },
      { id: "audio", name: "سماعات", count: 28 },
      { id: "cables", name: "شواحن وكابلات", count: 34 },
      { id: "cases", name: "حافظات وجرابات", count: 30 },
      { id: "storage", name: "ذاكرات وتخزين", count: 18 },
      { id: "screens", name: "شاشات", count: 12 },
      { id: "phone-accessories", name: "إكسسوارات الجوال", count: 26 },
      { id: "docks", name: "قواعد شحن", count: 14 },
      { id: "power", name: "بطاريات متنقلة", count: 19 },
      { id: "bags", name: "حقائب وحماية", count: 11 },
      { id: "headsets", name: "سماعات رأس", count: 17 },
      { id: "arrivals", name: "وصل حديثًا", count: 15 },
    ],
  },
  deals: {
    eyebrow: "أقوى عروض سوق الكمبيوترات",
    title: "عروض على أجهزتك وإكسسواراتك",
    highlight: "خصومات تصل إلى 60%",
    lead: "تصفّح عروض الجوالات والشاشات وأجهزة الألعاب، واختر ما يناسبك.",
    endsSoon: "ينتهي العرض قريبًا",
    discount: "خصم {percent}%",
    reviews: "{count} تقييم",
    currency: "ر.س",
    addToCart: "أضف إلى السلة",
    quickView: "عرض سريع",
    viewAll: "عرض الكل",
    bannerAction: "تصفّح العروض",
    pageTitle: "كل الخصومات",
    pageLead: "كل العروض الحالية على الجوالات، وأجهزة البلايستيشن، وإكسسواراتها.",
    close: "إغلاق",
    inStock: "متوفر للطلب",
    savedAmount: "وفرت {amount} {currency}",
    saveBadge: "وفر {percent}%",
    featuresTitle: "أبرز التفاصيل",
    specsTitle: "بيانات المنتج",
    original: "جهاز أصلي بضمان محلي",
    quantity: "الكمية",
    decrease: "تقليل الكمية",
    increase: "زيادة الكمية",
    shippingNote: "شحن مجاني للطلبات فوق 300 ر.س",
    warrantyNote: "استبدال خلال فترة الضمان على الأجهزة المختارة",
    products: {
      phone: { name: "جوال شاشة 6.7 بوصة", category: "جوالات" },
      console: { name: "جهاز بلايستيشن مع يد تحكم", category: "بلايستيشن" },
      controller: { name: "يد تحكم لاسلكية", category: "أيدي تحكم" },
      earbuds: { name: "سماعة لاسلكية", category: "سماعات" },
      charger: { name: "شاحن سريع", category: "شواحن وكابلات" },
      case: { name: "حافظة حماية للجوال", category: "حافظات وجرابات" },
      storage: { name: "ذاكرة تخزين", category: "ذاكرات وتخزين" },
      screen: { name: "شاشة 27 بوصة", category: "شاشات" },
      dock: { name: "قاعدة شحن", category: "قواعد شحن" },
      headset: { name: "سماعة رأس للألعاب", category: "سماعات رأس" },
      "phone-mini": { name: "جوال شاشة 6.1 بوصة", category: "جوالات" },
      game: { name: "لعبة بلايستيشن", category: "ألعاب" },
      cable: { name: "كابل شحن", category: "شواحن وكابلات" },
      power: { name: "بطارية متنقلة", category: "بطاريات متنقلة" },
      speaker: { name: "سماعة مكبرة", category: "سماعات" },
      bag: { name: "حقيبة حماية", category: "حقائب وحماية" },
      "screen-24": { name: "شاشة 24 بوصة", category: "شاشات" },
      "controller-extra": { name: "يد تحكم إضافية", category: "أيدي تحكم" },
      "gaming-earbuds": { name: "سماعة أذن للألعاب", category: "سماعات" },
      "drive-512": { name: "ذاكرة 512 جيجا", category: "ذاكرات وتخزين" },
    },
  },
  bestsellers: {
    eyebrow: "الأكثر طلبًا هذا الأسبوع",
    title: "الأكثر مبيعًا من الجوالات والبلايستيشن",
    titleFrom: "الأكثر مبيعًا من {name}",
    lead: "جوالات، أجهزة بلايستيشن، وأيد تحكم وسماعات. السعر واضح قبل ما تطلب.",
    viewAll: "جميع الجوالات والبلايستيشن",
    filters: [
      { id: "all", label: "الكل" },
      { id: "phones", label: "جوالات" },
      { id: "playstation", label: "بلايستيشن" },
      { id: "accessories", label: "إكسسوارات" },
    ],
    bannerTitle: "تجهيز أكثر من جهاز في طلب واحد",
    bannerLead: "لو بتجهز جوالات أو بلايستيشن مع الإكسسوارات، نرتب القطع والضمان المحلي معاك.",
    bannerAction: "اسأل عن التجهيز",
    inquiry: {
      title: "اطلب تجهيز طلبك",
      lead: "اكتب اسمك ورقم جوالك، وقولنا إيه الأجهزة أو الإكسسوارات اللي عايز تجهّزها في طلب واحد.",
      name: "الاسم",
      phone: "رقم الجوال",
      phoneHint: "مثال: 0512345678",
      note: "تفاصيل التجهيز",
      noteHint: "مثال: جوالين + بلايستيشن مع يد تحكم وسماعات",
      submit: "إرسال الطلب",
      close: "إغلاق",
      success: "وصلنا طلبك، وهنتواصل معاك قريب على رقم الجوال.",
      successLocal: "تم حفظ الطلب على هذا المتصفح فقط للمعاينة، ولم يُرسل إلى المتجر.",
      saveError: "تعذّر حفظ طلبك. حاول مرة ثانية.",
      phoneError: "أدخل رقم جوال سعودي يبدأ بـ 05 ومكوّن من 10 أرقام.",
      required: "هذا الحقل مطلوب.",
    },
    badges: {
      phone: "ضمان محلي سنتين",
      "phone-mini": "ضمان محلي سنتين",
      case: "حماية للجوال",
      charger: "شحن سريع",
      screen: "للعرض والألعاب",
      console: "مع يد تحكم",
      controller: "لاسلكية",
      game: "متوفرة للطلب",
      headset: "للألعاب",
      "controller-extra": "لاسلكية",
      earbuds: "جاهزة للطلب",
      storage: "تتسع للألعاب",
      dock: "قاعدة شحن",
      cable: "للشحن اليومي",
    },
  },
  addons: {
    eyebrow: "كماليات الجوال والبلايستيشن",
    title: "الأكثر مبيعًا من الإكسسوارات",
    lead: "أيد تحكم، سماعات، شواحن، وذاكرات. تقدر تطلبها مع الجهاز أو لوحدها.",
    ready: "جاهزة للطلب، والشحن مجاني فوق 300 ر.س",
    badges: {
      "controller-extra": "الأكثر طلبًا",
      "gaming-earbuds": "للألعاب",
      charger: "شحن سريع",
      "drive-512": "تتسع للألعاب",
      dock: "قاعدة شحن",
    },
  },
  setups: {
    eyebrow: "حلول الأعمال",
    title: "حلول متكاملة لأعمالك",
    lead: "من البنية التحتية إلى نقاط البيع والأمن والمراقبة، نوفر لك حلولًا تقنية متكاملة مصممة لتلبية احتياجات أعمالك.",
    action: "استكشف جميع الحلول",
    items: [
      {
        id: "networking",
        title: "الشبكات والاتصالات",
        text: "تصميم وتجهيز شبكات موثوقة وسريعة للشركات والمكاتب.",
      },
      {
        id: "pos",
        title: "أنظمة نقاط البيع POS",
        text: "حلول نقاط بيع متكاملة تشمل الأجهزة والبرمجيات وملحقاتها.",
      },
      {
        id: "security",
        title: "المراقبة والأمن",
        text: "أنظمة كاميرات ومراقبة وتحكم تساعدك على حماية أعمالك.",
      },
      {
        id: "servers",
        title: "السيرفرات ومراكز البيانات",
        text: "حلول سيرفرات وتخزين وبنية تحتية تناسب احتياجات أعمالك.",
      },
    ],
  },
  footer: {
    about: "مكان واحد للجوالات، وأجهزة البلايستيشن، وإكسسواراتها. أسعار واضحة، وقطع أصلية.",
    shipping: "شحن مجاني للطلبات فوق 300 ر.س",
    warranty: "ضمان محلي لمدة سنتين على الأجهزة المختارة",
    departmentsTitle: "أقسام المتجر",
    departments: ["جوالات", "بلايستيشن", "إكسسوارات بلايستيشن", "أيدي تحكم", "سماعات", "شواحن وكابلات", "شاشات"],
    serviceTitle: "خدمات العملاء",
    services: [
      "السعر ظاهر قبل ما تطلب",
      "استبدال خلال فترة الضمان على الأجهزة المختارة",
      "تجهيز أكثر من جهاز في طلب واحد",
      "تقدر تطلب الإكسسوار مع الجهاز أو لوحده",
    ],
    helpTitle: "الطلب",
    help: ["تختار الجهاز، ونكمل معاك الخطوة التالية", "قطع أصلية بضمان محلي", "طلب بخطوات بسيطة"],
    rights: "© 2026 سوق الكمبيوترات",
    intro: "كل احتياجاتك التقنية في مكان واحد، من الكمبيوترات والجوالات إلى الأجهزة والإكسسوارات.",
    shopTitle: "تسوّق حسب القسم",
    beforeTitle: "قبل إتمام الطلب",
    before: ["راجع مواصفات المنتج.", "اختر الكمية المناسبة.", "تأكد من تفاصيل سلتك."],
  },
  hero: {
    imageAlt: "جوال، يد تحكم، وسماعات على قماش فاتح",
    prev: "الخبر السابق",
    next: "الخبر التالي",
    pause: "إيقاف التبديل التلقائي",
    play: "تشغيل التبديل التلقائي",
    position: "الخبر {current} من {total}",
    slides: [
      {
        eyebrow: "وصل حديثًا",
        title: "بلايستيشن",
        titleRest: "وإكسسواراتها",
        lead: "مكان واحد لأجهزة البلايستيشن وكمالياتها. أسعار واضحة، وقطع أصلية.",
        points: ["أجهزة أصلية بضمان محلي", "إكسسوارات البلايستيشن جاهزة للطلب"],
        primary: "تسوّق البلايستيشن",
        secondary: "شاهد العروض",
        badge: "مختارات سوق الكمبيوترات",
        offer: "عروض على أجهزة مختارة",
      },
      {
        eyebrow: "خبر المتجر",
        title: "إكسسوارات البلايستيشن",
        titleRest: "وصلت المجموعة",
        lead: "يد تحكم، سماعات، وشواحن. تقدر تطلب القطعة مع الجهاز أو لوحدها.",
        points: ["قطع متوافقة مع أجهزة البلايستيشن", "متوفرة للطلب هذا الأسبوع"],
        primary: "تسوّق الإكسسوارات",
        secondary: "اقرأ الخبر",
        badge: "جديد هذا الأسبوع",
        offer: "متوفر للطلب الآن",
      },
      {
        eyebrow: "الجوالات",
        title: "جوالات مختارة",
        titleRest: "بعناية",
        lead: "اكتشف مجموعة متنوعة من الجوالات، بمعلومات واضحة وأسعار تعرفها قبل ما تطلب.",
        points: ["تعرّف على المنتجات وقارن بينها بسهولة"],
        primary: "تصفّح الجوالات",
        secondary: "شاهد العروض",
        badge: "مختارات الجوالات",
        offer: "اختيارات تناسبك",
      },
    ],
  },
};

const en: Translations = {
  brand: "Electronics Market",
  tagline: "",
  documentTitle: "Electronics Market",
  switchTo: "Language / لغة",
  skipToContent: "Skip to main content",
  railPrev: "Previous",
  railNext: "Next",
  top: {
    shipping: "Free shipping on orders over SAR 300",
    warranty: "Two-year local warranty",
    track: "Track an order",
  },
  searchPlaceholder: "Search phones, PlayStation, or accessories...",
  searchLabel: "Search the store",
  searchFor: "Search for “{query}”",
  searchDepartment: "Department",
  wishlist: "Wishlist",
  themeToLight: "Switch to light mode",
  themeToDark: "Switch to dark mode",
  cart: "Cart",
  cartEmpty: "Empty",
  cartCount: "{count} items",
  cartEmptyMessage: "The cart is empty. Add a product from any card.",
  cartAdded: "{name} was added to the cart",
  cartRemove: "Remove",
  cartTotal: "Total",
  allCategories: "All departments",
  allProducts: "All products",
  offers: "Offers",
  navOffers: "Offers and discounts",
  cartPage: {
    title: "Shopping cart",
    summary: "Order summary",
    productsOne: "1 product",
    productsTwo: "2 products",
    productsFew: "{count} products",
    productsMany: "{count} products",
    piecesOne: "1 item",
    piecesTwo: "2 items",
    piecesFew: "{count} items",
    piecesMany: "{count} items",
    perPiece: "{price} {currency} per piece",
    lineBreakdown: "{qty} × {price}",
  },
  wholesale: {
    productNotice: "Buy 5 or more pieces of this same product from this shop at the wholesale price: {price} {currency} per piece",
    loginRequired: "Signing in is required to get the wholesale price.",
    loginLink: "Sign in",
    cartApplied: "Wholesale price",
    cartNudge: "Add one more piece to get the wholesale price: {price} {currency} per piece",
    cartNudgeTotal: "Total for 5 pieces at the wholesale price: {total} {currency}",
    previewNote: "The wholesale price is a local preview in this browser and is not applied at checkout yet.",
    priceChangedTitle: "Prices have changed",
    priceChangedLead: "A product price changed, or the wholesale price no longer applies, so the order was not placed. Review the new total and confirm it to place the order.",
    newSubtotal: "New items total: {amount} {currency}",
    confirmPrices: "Confirm the new prices and place the order",
    navLabel: "Wholesale offers",
    pageLead: "The wholesale price starts from 5 pieces of the same product at the same shop, after signing in",
    pageEmpty: "No wholesale offers are available right now",
    cardLine: "Wholesale price: {price} {currency} per piece from 5 pieces",
    cardPerPiece: "/ piece",
    cardCondition: "When you buy {count} or more pieces of the same product from the same shop",
    cardRetail: "Single-piece price: {price} {currency}",
    cardTotal: "Total for {count} pieces",
    cardAddOne: "Add 1 piece to cart",
    cardAddTwo: "Add 2 pieces to cart",
    cardAddFew: "Add {count} pieces to cart",
    cardInCart: "View in cart",
    cardUnavailable: "Currently unavailable",
  },
  compare: {
    back: "Back to product",
    offersTitle: "Shop offers ({count})",
    sortNote: "Sorted from the lowest price",
    startsFrom: "Starts from",
    countOne: "1 offer from shops",
    countMany: "{count} offers from shops",
    lowest: "Lowest price",
    opened: "The offer you opened",
    viewProduct: "View product",
    demoBadge: "Demo data",
    demoNote: "Preview demo data, not real shop prices.",
    compareButton: "Compare with other shops",
    availableIn: "available in {shops}",
    shopsTwo: "2 shops",
    shopsFew: "{count} shops",
    shopsMany: "{count} shops",
    shopLabel: "Shop",
    demoShopPrefix: "Demo shop",
  },
  favoritesPage: {
    title: "Wishlist",
    lead: "Products you saved, so you can come back to them easily.",
    empty: "You haven't saved any products yet. Tap the heart on any product to add it here.",
    browse: "Browse offers",
  },
  productPage: {
    buyNow: "Buy now",
    description: "About this product",
    quantity: "Quantity",
    soldBy: "Sold by",
    related: "Similar products",
    rating: "{rating} out of 5",
    priceNote: "You see the final price before you confirm the order.",
  },
  searchPage: {
    title: "Search",
    resultsFor: "Results for “{query}”",
    count: "{count} results",
    categories: "Matching departments",
    products: "Matching products",
    empty: "No results for “{query}”. Try another word or browse the departments.",
    prompt: "Type a product or department name in the search box.",
    browse: "Browse offers",
  },
  categoryPage: {
    related: "Categories inside this department.",
    empty: "This department is ready for products later.",
    open: "Open department",
    products: "Products",
    noProducts: "No products in this category yet. Browse the offers or go back to the departments.",
  },
  categories: ["Phones", "PlayStation", "PlayStation accessories", "Audio", "Chargers and cables"],
  catalog: {
    title: "All your tech needs, in one place",
    subtitle: "Explore a wide range of computing, printing, networking, and electronics solutions, and choose the department that fits what you need.",
    kicker: "CATEGORIES",
    viewAllDepartments: "View all departments",
    featuredBadge: "Best seller",
    sectionCount: "{count} departments",
    showDepartments: "View departments ({count})",
    showMore: "Show the rest ({count})",
    showLess: "Hide extra departments",
    moreDepartments: "Explore all departments",
    fewerDepartments: "Show fewer departments",
    productCount: "{count} products",
    perks: [
      {
        title: "Fast free shipping",
        text: "On orders over SAR 300",
      },
      {
        title: "Two-year local warranty",
        text: "On selected devices, with replacement during the warranty",
      },
      {
        title: "Clear prices",
        text: "The price is shown before you order",
      },
      {
        title: "Simple ordering",
        text: "Pick the device, and we take the next step with you",
      },
    ],
    items: [
      { id: "all", name: "All products", count: 0 },
      { id: "offers", name: "Offers", count: 20 },
      { id: "phones", name: "Phones", count: 48 },
      { id: "playstation", name: "PlayStation", count: 16 },
      { id: "ps-accessories", name: "PlayStation accessories", count: 36 },
      { id: "controllers", name: "Controllers", count: 22 },
      { id: "games", name: "Games", count: 40 },
      { id: "audio", name: "Audio", count: 28 },
      { id: "cables", name: "Chargers and cables", count: 34 },
      { id: "cases", name: "Cases", count: 30 },
      { id: "storage", name: "Storage", count: 18 },
      { id: "screens", name: "Screens", count: 12 },
      { id: "phone-accessories", name: "Phone accessories", count: 26 },
      { id: "docks", name: "Charging docks", count: 14 },
      { id: "power", name: "Power banks", count: 19 },
      { id: "bags", name: "Bags and protection", count: 11 },
      { id: "headsets", name: "Headsets", count: 17 },
      { id: "arrivals", name: "Just arrived", count: 15 },
    ],
  },
  deals: {
    eyebrow: "Electronics Market's strongest offers",
    title: "Offers on your devices and accessories",
    highlight: "Discounts up to 60%",
    lead: "Browse offers on phones, monitors, and gaming devices, and pick what suits you.",
    endsSoon: "Offer ends soon",
    discount: "{percent}% off",
    reviews: "{count} reviews",
    currency: "SAR",
    addToCart: "Add to cart",
    quickView: "Quick view",
    viewAll: "View all",
    bannerAction: "Browse offers",
    pageTitle: "All discounts",
    pageLead: "Every current offer on phones, PlayStation consoles, and their accessories.",
    close: "Close",
    inStock: "Available to order",
    savedAmount: "You save {amount} {currency}",
    saveBadge: "Save {percent}%",
    featuresTitle: "Highlights",
    specsTitle: "Product details",
    original: "Original device with a local warranty",
    quantity: "Quantity",
    decrease: "Decrease quantity",
    increase: "Increase quantity",
    shippingNote: "Free shipping on orders over SAR 300",
    warrantyNote: "Replacement during the warranty on selected devices",
    products: {
      phone: { name: "6.7-inch phone", category: "Phones" },
      console: { name: "PlayStation console with a controller", category: "PlayStation" },
      controller: { name: "Wireless controller", category: "Controllers" },
      earbuds: { name: "Wireless earbuds", category: "Audio" },
      charger: { name: "Fast charger", category: "Chargers and cables" },
      case: { name: "Phone case", category: "Cases" },
      storage: { name: "Storage drive", category: "Storage" },
      screen: { name: "27-inch screen", category: "Screens" },
      dock: { name: "Charging dock", category: "Charging docks" },
      headset: { name: "Gaming headset", category: "Headsets" },
      "phone-mini": { name: "6.1-inch phone", category: "Phones" },
      game: { name: "PlayStation game", category: "Games" },
      cable: { name: "Charging cable", category: "Chargers and cables" },
      power: { name: "Power bank", category: "Power banks" },
      speaker: { name: "Speaker", category: "Audio" },
      bag: { name: "Protective bag", category: "Bags and protection" },
      "screen-24": { name: "24-inch screen", category: "Screens" },
      "controller-extra": { name: "Extra controller", category: "Controllers" },
      "gaming-earbuds": { name: "Gaming earbuds", category: "Audio" },
      "drive-512": { name: "512 GB drive", category: "Storage" },
    },
  },
  bestsellers: {
    eyebrow: "Most requested this week",
    title: "Best sellers in phones and PlayStation",
    titleFrom: "Best sellers in {name}",
    lead: "Phones, PlayStation consoles, controllers, and headsets. The price is clear before you order.",
    viewAll: "All phones and PlayStation",
    filters: [
      { id: "all", label: "All" },
      { id: "phones", label: "Phones" },
      { id: "playstation", label: "PlayStation" },
      { id: "accessories", label: "Accessories" },
    ],
    bannerTitle: "Set up more than one device in a single order",
    bannerLead: "If you are getting phones or PlayStation gear with accessories, we line up the pieces and the local warranty with you.",
    bannerAction: "Ask about a group order",
    inquiry: {
      title: "Ask us to prepare your order",
      lead: "Leave your name and mobile number, and tell us which devices or accessories you want prepared in one order.",
      name: "Name",
      phone: "Mobile number",
      phoneHint: "e.g. 0512345678",
      note: "What to prepare",
      noteHint: "e.g. two phones + PlayStation with a controller and headset",
      submit: "Send request",
      close: "Close",
      success: "We received your request and will contact you soon on this number.",
      successLocal: "The request was saved on this browser only, for preview. It was not sent to the store.",
      saveError: "We could not save your request. Please try again.",
      phoneError: "Enter a Saudi mobile number starting with 05 (10 digits).",
      required: "This field is required.",
    },
    badges: {
      phone: "Two-year local warranty",
      "phone-mini": "Two-year local warranty",
      case: "Phone protection",
      charger: "Fast charging",
      screen: "For play and work",
      console: "With a controller",
      controller: "Wireless",
      game: "Ready to order",
      headset: "For gaming",
      "controller-extra": "Wireless",
      earbuds: "Ready to order",
      storage: "Room for games",
      dock: "Charging dock",
      cable: "Everyday charging",
    },
  },
  addons: {
    eyebrow: "Phone and PlayStation add-ons",
    title: "Best-selling accessories",
    lead: "Controllers, headsets, chargers, and storage. Order them with the device, or on their own.",
    ready: "Ready to order, with free shipping over SAR 300",
    badges: {
      "controller-extra": "Most requested",
      "gaming-earbuds": "For gaming",
      charger: "Fast charging",
      "drive-512": "Room for games",
      dock: "Charging dock",
    },
  },
  setups: {
    eyebrow: "Business solutions",
    title: "Integrated solutions for your business",
    lead: "From infrastructure to point of sale, security, and surveillance, we provide integrated technology solutions designed for your business.",
    action: "Explore all solutions",
    items: [
      {
        id: "networking",
        title: "Networking and communications",
        text: "Reliable, fast networks designed and fitted for companies and offices.",
      },
      {
        id: "pos",
        title: "POS systems",
        text: "Integrated point-of-sale solutions covering hardware, software, and accessories.",
      },
      {
        id: "security",
        title: "Surveillance and security",
        text: "Cameras, monitoring, and control systems that help you protect your business.",
      },
      {
        id: "servers",
        title: "Servers and data centers",
        text: "Server, storage, and infrastructure solutions sized for your business.",
      },
    ],
  },
  footer: {
    about: "One place for phones, PlayStation consoles, and their accessories. Clear prices, original gear.",
    shipping: "Free shipping on orders over SAR 300",
    warranty: "A two-year local warranty on selected devices",
    departmentsTitle: "Store departments",
    departments: ["Phones", "PlayStation", "PlayStation accessories", "Controllers", "Audio", "Chargers and cables", "Screens"],
    serviceTitle: "Customer care",
    services: [
      "The price is shown before you order",
      "Replacement during the warranty on selected devices",
      "More than one device in a single order",
      "Order an accessory with the device, or on its own",
    ],
    helpTitle: "Ordering",
    help: ["Pick the device, and we take the next step with you", "Original pieces with a local warranty", "Shipping after the order is confirmed"],
    rights: "© 2026 Electronics Market",
    intro: "All your tech needs in one place, from computers and phones to devices and accessories.",
    shopTitle: "Shop by department",
    beforeTitle: "Before you check out",
    before: ["Review the product specifications.", "Choose the right quantity.", "Check your cart details."],
  },
  hero: {
    imageAlt: "A phone, a controller, and earbuds on light linen",
    prev: "Previous story",
    next: "Next story",
    pause: "Pause auto-rotation",
    play: "Start auto-rotation",
    position: "Story {current} of {total}",
    slides: [
      {
        eyebrow: "Just in",
        title: "PlayStation",
        titleRest: "and accessories",
        lead: "One place for PlayStation consoles and their add-ons. Clear prices, original gear.",
        points: ["Original devices with a local warranty", "PlayStation accessories ready to order"],
        primary: "Shop PlayStation",
        secondary: "See offers",
        badge: "Electronics Market picks",
        offer: "Offers on selected devices",
      },
      {
        eyebrow: "Store news",
        title: "PlayStation accessories",
        titleRest: "just arrived",
        lead: "Controllers, headsets, and chargers. Order a piece with the console, or on its own.",
        points: ["Gear that fits PlayStation consoles", "Available to order this week"],
        primary: "Shop accessories",
        secondary: "Read the story",
        badge: "New this week",
        offer: "Ready to order now",
      },
      {
        eyebrow: "Phones",
        title: "Choose your phone",
        titleRest: "with confidence",
        lead: "Explore a range of phones, with clear details and prices you know before you order.",
        points: ["Get to know the products and compare them easily"],
        primary: "Browse phones",
        secondary: "See offers",
        badge: "Phone picks",
        offer: "Choices that fit you",
      },
    ],
  },
};

export const translations: Record<Lang, Translations> = { ar, en, ur };

interface LangContextType {
  lang: Lang;
  t: Translations;
  dir: "rtl" | "ltr";
  /** Legacy toggle target (next language in the cycle). Prefer `localeHref` for menus. */
  otherHref: string;
  localeHref: (next: Lang) => string;
}

const LangContext = createContext<LangContextType>({
  lang: "ar",
  t: ar,
  dir: "rtl",
  otherHref: "/en",
  localeHref: (next) => `/${next}`,
});

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const [location] = useLocation();
  const search = useSearch();
  const dir = isRtl(lang) ? "rtl" : "ltr";
  const t = translations[lang];
  const cycle: Lang[] = ["ar", "en", "ur"];
  const other = cycle[(cycle.indexOf(lang) + 1) % cycle.length]!;
  // Keeps the query string, so switching language on the search page keeps the search.
  const otherHref = localePath(location, other, search ? `?${search}` : "");
  const localeHref = (next: Lang) => localePath(location, next, search ? `?${search}` : "");

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = LANG_META[lang].htmlLang;
    document.title = t.documentTitle;
    document.documentElement.style.fontFamily = isRtl(lang)
      ? "'IBM Plex Sans Arabic', 'Noto Nastaliq Urdu', 'IBM Plex Sans', sans-serif"
      : "'IBM Plex Sans', sans-serif";
  }, [lang, dir, t.documentTitle]);

  return (
    <LangContext.Provider value={{ lang, t, dir, otherHref, localeHref }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
