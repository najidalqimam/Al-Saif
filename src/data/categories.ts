export type CategoryStatus = "active" | "empty" | "retired";

export type StoreCategory = {
  id: string;
  name: string;
  level: number;
  parentId: string | null;
  count: number;
  childCount: number;
  status: CategoryStatus;
};

/** Departments and product counts from the store category sheet. */
export const STORE_CATEGORIES: StoreCategory[] = [
  {
    "id": "3287",
    "name": "آلة حاسبة",
    "level": 1,
    "parentId": null,
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2359",
    "name": "أجهزة عرض",
    "level": 1,
    "parentId": null,
    "count": 92,
    "childCount": 3,
    "status": "active"
  },
  {
    "id": "2360",
    "name": "بروجيكتور",
    "level": 2,
    "parentId": "2359",
    "count": 25,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2361",
    "name": "شاشات عرض",
    "level": 2,
    "parentId": "2359",
    "count": 15,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2362",
    "name": "شاشات كمبيوتر",
    "level": 2,
    "parentId": "2359",
    "count": 59,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2365",
    "name": "أجهزة فاكس",
    "level": 1,
    "parentId": null,
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "4394",
    "name": "أجهزة كمبيوتر واكسسوارات",
    "level": 1,
    "parentId": null,
    "count": 24,
    "childCount": 1,
    "status": "active"
  },
  {
    "id": "4395",
    "name": "مزودات الطاقة UPS",
    "level": 2,
    "parentId": "4394",
    "count": 24,
    "childCount": 1,
    "status": "active"
  },
  {
    "id": "4396",
    "name": "ملحقات مزودات الطاقة",
    "level": 3,
    "parentId": "4395",
    "count": 9,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2383",
    "name": "أحبار منت",
    "level": 1,
    "parentId": null,
    "count": 297,
    "childCount": 3,
    "status": "active"
  },
  {
    "id": "2384",
    "name": "احبار منت انك جيت",
    "level": 2,
    "parentId": "2383",
    "count": 69,
    "childCount": 4,
    "status": "active"
  },
  {
    "id": "2386",
    "name": "احبار منت انك إتش بي",
    "level": 3,
    "parentId": "2384",
    "count": 33,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2387",
    "name": "احبار منت انك ابسون",
    "level": 3,
    "parentId": "2384",
    "count": 22,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2388",
    "name": "احبار منت انك برازر",
    "level": 3,
    "parentId": "2384",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2389",
    "name": "احبار منت انك كانون",
    "level": 3,
    "parentId": "2384",
    "count": 10,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3342",
    "name": "احبار منت ليزر برازر",
    "level": 2,
    "parentId": "2383",
    "count": 1,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2390",
    "name": "احبار منت ليزر جيت",
    "level": 2,
    "parentId": "2383",
    "count": 231,
    "childCount": 14,
    "status": "active"
  },
  {
    "id": "2391",
    "name": "احبار منت ليزر أوكي",
    "level": 3,
    "parentId": "2390",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2392",
    "name": "احبار منت ليزر إتش بي",
    "level": 3,
    "parentId": "2390",
    "count": 144,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2393",
    "name": "احبار منت ليزر ابسون",
    "level": 3,
    "parentId": "2390",
    "count": 8,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2394",
    "name": "احبار منت ليزر باناسونيك",
    "level": 3,
    "parentId": "2390",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2395",
    "name": "احبار منت ليزر برازر",
    "level": 3,
    "parentId": "2390",
    "count": 7,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2396",
    "name": "احبار منت ليزر توشيبا",
    "level": 3,
    "parentId": "2390",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2397",
    "name": "احبار منت ليزر ريكو",
    "level": 3,
    "parentId": "2390",
    "count": 17,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2398",
    "name": "احبار منت ليزر زيروكس",
    "level": 3,
    "parentId": "2390",
    "count": 5,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2399",
    "name": "احبار منت ليزر سامسونج",
    "level": 3,
    "parentId": "2390",
    "count": 3,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2400",
    "name": "احبار منت ليزر شارب",
    "level": 3,
    "parentId": "2390",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2401",
    "name": "احبار منت ليزر كانون",
    "level": 3,
    "parentId": "2390",
    "count": 41,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2402",
    "name": "احبار منت ليزر كايوسيرا",
    "level": 3,
    "parentId": "2390",
    "count": 2,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2404",
    "name": "احبار منت ليزر كونيكا",
    "level": 3,
    "parentId": "2390",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2405",
    "name": "احبار منت ليزر ليكس مارك",
    "level": 3,
    "parentId": "2390",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2363",
    "name": "احبار",
    "level": 1,
    "parentId": null,
    "count": 935,
    "childCount": 7,
    "status": "active"
  },
  {
    "id": "2364",
    "name": "احبار انك جيت",
    "level": 2,
    "parentId": "2363",
    "count": 267,
    "childCount": 4,
    "status": "active"
  },
  {
    "id": "2366",
    "name": "احبار انك إتش بي",
    "level": 3,
    "parentId": "2364",
    "count": 152,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2368",
    "name": "احبار انك ابسون",
    "level": 3,
    "parentId": "2364",
    "count": 21,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2369",
    "name": "احبار انك برازر",
    "level": 3,
    "parentId": "2364",
    "count": 24,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2554",
    "name": "احبار انك كانون",
    "level": 3,
    "parentId": "2364",
    "count": 70,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3411",
    "name": "احبار ليزر توشيبا",
    "level": 2,
    "parentId": "2363",
    "count": 2,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2367",
    "name": "احبار ليزر جيت",
    "level": 2,
    "parentId": "2363",
    "count": 644,
    "childCount": 14,
    "status": "active"
  },
  {
    "id": "2370",
    "name": "احبار ليزر أوكي",
    "level": 3,
    "parentId": "2367",
    "count": 5,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2371",
    "name": "احبار ليزر إتش بي",
    "level": 3,
    "parentId": "2367",
    "count": 242,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2372",
    "name": "احبار ليزر ابسون",
    "level": 3,
    "parentId": "2367",
    "count": 5,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2373",
    "name": "احبار ليزر باناسونيك",
    "level": 3,
    "parentId": "2367",
    "count": 12,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2374",
    "name": "احبار ليزر برازر",
    "level": 3,
    "parentId": "2367",
    "count": 49,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2375",
    "name": "احبار ليزر توشيبا",
    "level": 3,
    "parentId": "2367",
    "count": 36,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2376",
    "name": "احبار ليزر ريكو",
    "level": 3,
    "parentId": "2367",
    "count": 29,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2377",
    "name": "احبار ليزر زيروكس",
    "level": 3,
    "parentId": "2367",
    "count": 54,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2378",
    "name": "احبار ليزر سامسونج",
    "level": 3,
    "parentId": "2367",
    "count": 56,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2379",
    "name": "احبار ليزر شارب",
    "level": 3,
    "parentId": "2367",
    "count": 28,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2380",
    "name": "احبار ليزر كانون",
    "level": 3,
    "parentId": "2367",
    "count": 112,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2381",
    "name": "احبار ليزر كايوسيرا",
    "level": 3,
    "parentId": "2367",
    "count": 9,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2382",
    "name": "احبار ليزر كونيكا",
    "level": 3,
    "parentId": "2367",
    "count": 6,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2385",
    "name": "احبار ليزر ليكس مارك",
    "level": 3,
    "parentId": "2367",
    "count": 1,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3377",
    "name": "احبار ليزر ريكو",
    "level": 2,
    "parentId": "2363",
    "count": 11,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3403",
    "name": "احبار ليزر سامسونج",
    "level": 2,
    "parentId": "2363",
    "count": 1,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3373",
    "name": "احبار ليزر كايوسيرا",
    "level": 2,
    "parentId": "2363",
    "count": 5,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3407",
    "name": "احبار ليزر كونيكا",
    "level": 2,
    "parentId": "2363",
    "count": 1,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "4777",
    "name": "احبار انك إتش بي",
    "level": 1,
    "parentId": null,
    "count": 4,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "4778",
    "name": "احبار انك كانون",
    "level": 1,
    "parentId": null,
    "count": 3,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "4773",
    "name": "ادوات مكتبية و اساس مكتبي",
    "level": 1,
    "parentId": null,
    "count": 156,
    "childCount": 8,
    "status": "active"
  },
  {
    "id": "4950",
    "name": "آلات التسعير والملصقات",
    "level": 2,
    "parentId": "4773",
    "count": 10,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "4949",
    "name": "أدوات مكتبية صغيرة",
    "level": 2,
    "parentId": "4773",
    "count": 41,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "4947",
    "name": "تجليد وتغليف حراري",
    "level": 2,
    "parentId": "4773",
    "count": 24,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "4776",
    "name": "حقائب لابتوب",
    "level": 2,
    "parentId": "4773",
    "count": 1,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2603",
    "name": "فرامة ورق",
    "level": 2,
    "parentId": "4773",
    "count": 50,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2493",
    "name": "ملحقات مكتبية",
    "level": 2,
    "parentId": "4773",
    "count": 58,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "4948",
    "name": "ملفات وحفظ المستندات",
    "level": 2,
    "parentId": "4773",
    "count": 27,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "4774",
    "name": "RETIRED — فرامة ورق",
    "level": 2,
    "parentId": "4773",
    "count": 0,
    "childCount": 0,
    "status": "retired"
  },
  {
    "id": "2755",
    "name": "اكسسوار قيمنق",
    "level": 1,
    "parentId": null,
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "4388",
    "name": "اكسسوارات",
    "level": 1,
    "parentId": null,
    "count": 582,
    "childCount": 5,
    "status": "active"
  },
  {
    "id": "3688",
    "name": "اكسسوارات الآيباد",
    "level": 2,
    "parentId": "4388",
    "count": 21,
    "childCount": 3,
    "status": "active"
  },
  {
    "id": "3710",
    "name": "أقلام رقمية",
    "level": 3,
    "parentId": "3688",
    "count": 2,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3689",
    "name": "جرابات آيباد",
    "level": 3,
    "parentId": "3688",
    "count": 12,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3694",
    "name": "لوحات مفاتيح آيباد",
    "level": 3,
    "parentId": "3688",
    "count": 6,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3661",
    "name": "اكسسوارات الجوال",
    "level": 2,
    "parentId": "4388",
    "count": 145,
    "childCount": 3,
    "status": "active"
  },
  {
    "id": "4392",
    "name": "جرابات",
    "level": 3,
    "parentId": "3661",
    "count": 0,
    "childCount": 3,
    "status": "empty"
  },
  {
    "id": "3686",
    "name": "أكياس مقاومة للماء",
    "level": 4,
    "parentId": "4392",
    "count": 2,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3679",
    "name": "جرابات آيفون",
    "level": 4,
    "parentId": "4392",
    "count": 46,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3673",
    "name": "جرابات سامسونج",
    "level": 4,
    "parentId": "4392",
    "count": 8,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "4393",
    "name": "شواحن وحوامل",
    "level": 3,
    "parentId": "3661",
    "count": 0,
    "childCount": 3,
    "status": "empty"
  },
  {
    "id": "3667",
    "name": "حاملات الهاتف",
    "level": 4,
    "parentId": "4393",
    "count": 3,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3669",
    "name": "حاملات وحافظات المحفظة",
    "level": 4,
    "parentId": "4393",
    "count": 12,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3662",
    "name": "شواحن لاسلكية وسيارة",
    "level": 4,
    "parentId": "4393",
    "count": 11,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3676",
    "name": "واقيات الشاشة",
    "level": 3,
    "parentId": "3661",
    "count": 41,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3697",
    "name": "اكسسوارات السماعات",
    "level": 2,
    "parentId": "4388",
    "count": 6,
    "childCount": 1,
    "status": "active"
  },
  {
    "id": "3698",
    "name": "حافظات ايربودز",
    "level": 3,
    "parentId": "3697",
    "count": 6,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3493",
    "name": "اكسسوارات كمبيوتر",
    "level": 2,
    "parentId": "4388",
    "count": 384,
    "childCount": 5,
    "status": "active"
  },
  {
    "id": "3494",
    "name": "كابلات",
    "level": 3,
    "parentId": "3493",
    "count": 170,
    "childCount": 8,
    "status": "active"
  },
  {
    "id": "3567",
    "name": "كابلات DVI",
    "level": 4,
    "parentId": "3494",
    "count": 1,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3553",
    "name": "كابلات DisplayPort",
    "level": 4,
    "parentId": "3494",
    "count": 18,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3621",
    "name": "كابلات HDMI",
    "level": 4,
    "parentId": "3494",
    "count": 3,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3495",
    "name": "كابلات HDMI",
    "level": 4,
    "parentId": "3494",
    "count": 47,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3531",
    "name": "كابلات USB",
    "level": 4,
    "parentId": "3494",
    "count": 17,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3561",
    "name": "كابلات VGA",
    "level": 4,
    "parentId": "3494",
    "count": 3,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3502",
    "name": "كابلات الشبكة",
    "level": 4,
    "parentId": "3494",
    "count": 47,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3509",
    "name": "كابلات ومحولات الصوت",
    "level": 4,
    "parentId": "3494",
    "count": 34,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3529",
    "name": "ماوس ولوحة مفاتيح",
    "level": 3,
    "parentId": "3493",
    "count": 39,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "4389",
    "name": "محولات وموزعات ومحطات توصيل",
    "level": 3,
    "parentId": "3493",
    "count": 96,
    "childCount": 6,
    "status": "active"
  },
  {
    "id": "3596",
    "name": "كابلات ومحولات USB-C",
    "level": 4,
    "parentId": "4389",
    "count": 24,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3541",
    "name": "محطات توصيل USB-C",
    "level": 4,
    "parentId": "4389",
    "count": 27,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3544",
    "name": "محولات HDMI",
    "level": 4,
    "parentId": "4389",
    "count": 16,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3611",
    "name": "محولات الشبكة",
    "level": 4,
    "parentId": "4389",
    "count": 8,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3602",
    "name": "محولات عامة",
    "level": 4,
    "parentId": "4389",
    "count": 1,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3539",
    "name": "موزعات USB",
    "level": 4,
    "parentId": "4389",
    "count": 18,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "4391",
    "name": "ملحقات أخرى",
    "level": 3,
    "parentId": "3493",
    "count": 0,
    "childCount": 2,
    "status": "empty"
  },
  {
    "id": "3532",
    "name": "بلوتوث ولاسلكي",
    "level": 4,
    "parentId": "4391",
    "count": 12,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3646",
    "name": "ميكروفونات",
    "level": 4,
    "parentId": "4391",
    "count": 1,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "4390",
    "name": "وحدات تخزين واكسسواراتها",
    "level": 3,
    "parentId": "3493",
    "count": 61,
    "childCount": 3,
    "status": "active"
  },
  {
    "id": "3589",
    "name": "أجهزة تخزين NAS",
    "level": 4,
    "parentId": "4390",
    "count": 3,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3578",
    "name": "اكسسوارات الأقراص الصلبة",
    "level": 4,
    "parentId": "4390",
    "count": 25,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3617",
    "name": "قارئ البطاقات",
    "level": 4,
    "parentId": "4390",
    "count": 26,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3572",
    "name": "حقائب وهدايا",
    "level": 2,
    "parentId": "4388",
    "count": 25,
    "childCount": 2,
    "status": "active"
  },
  {
    "id": "3634",
    "name": "اكسسوارات مكتبية",
    "level": 3,
    "parentId": "3572",
    "count": 1,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3573",
    "name": "حقائب واكسسوارات",
    "level": 3,
    "parentId": "3572",
    "count": 24,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2539",
    "name": "الكترونيات",
    "level": 1,
    "parentId": null,
    "count": 96,
    "childCount": 5,
    "status": "active"
  },
  {
    "id": "2403",
    "name": "المنزل الذكي",
    "level": 2,
    "parentId": "2539",
    "count": 35,
    "childCount": 2,
    "status": "active"
  },
  {
    "id": "2406",
    "name": "أجهزة ذكية",
    "level": 3,
    "parentId": "2403",
    "count": 1,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2408",
    "name": "شبكات",
    "level": 3,
    "parentId": "2403",
    "count": 34,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2853",
    "name": "تابلت",
    "level": 2,
    "parentId": "2539",
    "count": 2,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2414",
    "name": "جوالات",
    "level": 2,
    "parentId": "2539",
    "count": 38,
    "childCount": 3,
    "status": "active"
  },
  {
    "id": "2416",
    "name": "جوالات أبل",
    "level": 3,
    "parentId": "2414",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2417",
    "name": "جوالات ذكية",
    "level": 3,
    "parentId": "2414",
    "count": 37,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2415",
    "name": "جوالات عادية",
    "level": 3,
    "parentId": "2414",
    "count": 1,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2418",
    "name": "ساعات ذكية",
    "level": 2,
    "parentId": "2539",
    "count": 1,
    "childCount": 3,
    "status": "active"
  },
  {
    "id": "2419",
    "name": "ساعات أبل",
    "level": 3,
    "parentId": "2418",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2420",
    "name": "ساعات أخرى",
    "level": 3,
    "parentId": "2418",
    "count": 1,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2421",
    "name": "ساعات سامسونج",
    "level": 3,
    "parentId": "2418",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2447",
    "name": "كاميرات",
    "level": 2,
    "parentId": "2539",
    "count": 20,
    "childCount": 3,
    "status": "active"
  },
  {
    "id": "2448",
    "name": "كاميرات تصوير",
    "level": 3,
    "parentId": "2447",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2449",
    "name": "كاميرات مراقبة",
    "level": 3,
    "parentId": "2447",
    "count": 20,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2450",
    "name": "كاميرات ويب",
    "level": 3,
    "parentId": "2447",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "3905",
    "name": "الكل في واحد",
    "level": 1,
    "parentId": null,
    "count": 3,
    "childCount": 1,
    "status": "active"
  },
  {
    "id": "3906",
    "name": "كمبيوتر الكل في واحد ديل",
    "level": 2,
    "parentId": "3905",
    "count": 3,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3292",
    "name": "تلفزيونات",
    "level": 1,
    "parentId": null,
    "count": 5,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3160",
    "name": "جديد",
    "level": 1,
    "parentId": null,
    "count": 5,
    "childCount": 7,
    "status": "active"
  },
  {
    "id": "3254",
    "name": "أجهزة أبل",
    "level": 2,
    "parentId": "3160",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "3236",
    "name": "بروجكترات",
    "level": 2,
    "parentId": "3160",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "3242",
    "name": "حاسبات متكاملة",
    "level": 2,
    "parentId": "3160",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "3226",
    "name": "حاسبات مكتبية",
    "level": 2,
    "parentId": "3160",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "3218",
    "name": "طابعات",
    "level": 2,
    "parentId": "3160",
    "count": 3,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3161",
    "name": "لابتوبات",
    "level": 2,
    "parentId": "3160",
    "count": 1,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3224",
    "name": "ماسحات ضوئية",
    "level": 2,
    "parentId": "3160",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "620",
    "name": "جميع المنتجات",
    "level": 1,
    "parentId": null,
    "count": 1603,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3486",
    "name": "جوالات",
    "level": 1,
    "parentId": null,
    "count": 1,
    "childCount": 1,
    "status": "active"
  },
  {
    "id": "3487",
    "name": "جولات ذكية",
    "level": 2,
    "parentId": "3486",
    "count": 1,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3305",
    "name": "حاسبات الألعاب",
    "level": 1,
    "parentId": null,
    "count": 4,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2901",
    "name": "خوادم",
    "level": 1,
    "parentId": null,
    "count": 50,
    "childCount": 4,
    "status": "active"
  },
  {
    "id": "2932",
    "name": "خوادم Dell PowerEdge",
    "level": 2,
    "parentId": "2901",
    "count": 35,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2903",
    "name": "خوادم HPE ProLiant",
    "level": 2,
    "parentId": "2901",
    "count": 15,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2902",
    "name": "خوادم تاور",
    "level": 2,
    "parentId": "2901",
    "count": 10,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2913",
    "name": "خوادم راك",
    "level": 2,
    "parentId": "2901",
    "count": 40,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3850",
    "name": "شاشات عرض",
    "level": 1,
    "parentId": null,
    "count": 4,
    "childCount": 3,
    "status": "active"
  },
  {
    "id": "3872",
    "name": "شاشات LED ولوحات إعلانية",
    "level": 2,
    "parentId": "3850",
    "count": 1,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3853",
    "name": "شاشات إعلانية رقمية",
    "level": 2,
    "parentId": "3850",
    "count": 1,
    "childCount": 1,
    "status": "active"
  },
  {
    "id": "3854",
    "name": "شاشات إعلانية عمودية",
    "level": 3,
    "parentId": "3853",
    "count": 1,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3851",
    "name": "شاشات تفاعلية",
    "level": 2,
    "parentId": "3850",
    "count": 2,
    "childCount": 2,
    "status": "active"
  },
  {
    "id": "3852",
    "name": "أكشاك تفاعلية",
    "level": 3,
    "parentId": "3851",
    "count": 1,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3855",
    "name": "شاشات تفاعلية لقاعات الاجتماعات",
    "level": 3,
    "parentId": "3851",
    "count": 1,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2423",
    "name": "طابعات",
    "level": 1,
    "parentId": null,
    "count": 141,
    "childCount": 16,
    "status": "active"
  },
  {
    "id": "2801",
    "name": "ديل",
    "level": 2,
    "parentId": "2423",
    "count": 1,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3484",
    "name": "طابعات Brother",
    "level": 2,
    "parentId": "2423",
    "count": 8,
    "childCount": 2,
    "status": "active"
  },
  {
    "id": "2437",
    "name": "طابعات سمارت برازر",
    "level": 3,
    "parentId": "3484",
    "count": 2,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2441",
    "name": "طابعات ليزر برازر",
    "level": 3,
    "parentId": "3484",
    "count": 6,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3482",
    "name": "طابعات Canon",
    "level": 2,
    "parentId": "2423",
    "count": 7,
    "childCount": 3,
    "status": "active"
  },
  {
    "id": "2429",
    "name": "طابعات ديزاين كانون",
    "level": 3,
    "parentId": "3482",
    "count": 3,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2556",
    "name": "طابعات سمارت كانون",
    "level": 3,
    "parentId": "3482",
    "count": 2,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2444",
    "name": "طابعات ليزر كانون",
    "level": 3,
    "parentId": "3482",
    "count": 2,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3483",
    "name": "طابعات Epson",
    "level": 2,
    "parentId": "2423",
    "count": 15,
    "childCount": 4,
    "status": "active"
  },
  {
    "id": "2830",
    "name": "طابعات ديزاين جيت ايبسون",
    "level": 3,
    "parentId": "3483",
    "count": 4,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2832",
    "name": "طابعات ديسك ايبسون",
    "level": 3,
    "parentId": "3483",
    "count": 2,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2436",
    "name": "طابعات سمارت ابسون",
    "level": 3,
    "parentId": "3483",
    "count": 8,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2440",
    "name": "طابعات ليزر ابسون",
    "level": 3,
    "parentId": "3483",
    "count": 1,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3481",
    "name": "طابعات HP",
    "level": 2,
    "parentId": "2423",
    "count": 48,
    "childCount": 5,
    "status": "active"
  },
  {
    "id": "2425",
    "name": "طابعات أوفيس إتش بي",
    "level": 3,
    "parentId": "3481",
    "count": 4,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2428",
    "name": "طابعات ديزاين إتش بي",
    "level": 3,
    "parentId": "3481",
    "count": 3,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2430",
    "name": "طابعات ديسك إتش بي",
    "level": 3,
    "parentId": "3481",
    "count": 1,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2434",
    "name": "طابعات سمارت إتش بي",
    "level": 3,
    "parentId": "3481",
    "count": 4,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2438",
    "name": "طابعات ليزر إتش بي",
    "level": 3,
    "parentId": "3481",
    "count": 36,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2439",
    "name": "طابعات OKI",
    "level": 2,
    "parentId": "2423",
    "count": 1,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2443",
    "name": "طابعات Samsung",
    "level": 2,
    "parentId": "2423",
    "count": 1,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2424",
    "name": "طابعات أوفيس جيت",
    "level": 2,
    "parentId": "2423",
    "count": 12,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3485",
    "name": "طابعات باركود / POS",
    "level": 2,
    "parentId": "2423",
    "count": 1,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2426",
    "name": "طابعات ديزاين جيت",
    "level": 2,
    "parentId": "2423",
    "count": 10,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2427",
    "name": "طابعات ديسك جيت",
    "level": 2,
    "parentId": "2423",
    "count": 9,
    "childCount": 2,
    "status": "active"
  },
  {
    "id": "2432",
    "name": "طابعات ديسك برازر",
    "level": 3,
    "parentId": "2427",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2433",
    "name": "طابعات ديسك كانون",
    "level": 3,
    "parentId": "2427",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2431",
    "name": "طابعات سمارت تانك",
    "level": 2,
    "parentId": "2423",
    "count": 22,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2609",
    "name": "طابعات كروت",
    "level": 2,
    "parentId": "2423",
    "count": 2,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2435",
    "name": "طابعات ليزر جيت",
    "level": 2,
    "parentId": "2423",
    "count": 41,
    "childCount": 3,
    "status": "active"
  },
  {
    "id": "2540",
    "name": "طابعات ليزر ريكو",
    "level": 3,
    "parentId": "2435",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2442",
    "name": "طابعات ليزر زيروكس",
    "level": 3,
    "parentId": "2435",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2445",
    "name": "طابعات ليزر ليكس مارك",
    "level": 3,
    "parentId": "2435",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2471",
    "name": "ماسحات ضوئية",
    "level": 2,
    "parentId": "2423",
    "count": 21,
    "childCount": 6,
    "status": "active"
  },
  {
    "id": "2473",
    "name": "ماسحات ضوئية إتش بي",
    "level": 3,
    "parentId": "2471",
    "count": 8,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2474",
    "name": "ماسحات ضوئية ايبسون",
    "level": 3,
    "parentId": "2471",
    "count": 3,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2475",
    "name": "ماسحات ضوئية برازر",
    "level": 3,
    "parentId": "2471",
    "count": 2,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2476",
    "name": "ماسحات ضوئية سبيكترون",
    "level": 3,
    "parentId": "2471",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2477",
    "name": "ماسحات ضوئية فوجيتسو",
    "level": 3,
    "parentId": "2471",
    "count": 1,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2478",
    "name": "ماسحات ضوئية كانون",
    "level": 3,
    "parentId": "2471",
    "count": 6,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2479",
    "name": "ماكينات تصوير",
    "level": 2,
    "parentId": "2423",
    "count": 13,
    "childCount": 10,
    "status": "active"
  },
  {
    "id": "2577",
    "name": "ماكينات تصوير اوكي",
    "level": 3,
    "parentId": "2479",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2600",
    "name": "ماكينات تصوير ايبسون",
    "level": 3,
    "parentId": "2479",
    "count": 3,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2480",
    "name": "ماكينات تصوير باناسونيك",
    "level": 3,
    "parentId": "2479",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2481",
    "name": "ماكينات تصوير توشيبا",
    "level": 3,
    "parentId": "2479",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2482",
    "name": "ماكينات تصوير ريكو",
    "level": 3,
    "parentId": "2479",
    "count": 1,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2483",
    "name": "ماكينات تصوير زيروكس",
    "level": 3,
    "parentId": "2479",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2484",
    "name": "ماكينات تصوير شارب",
    "level": 3,
    "parentId": "2479",
    "count": 2,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2485",
    "name": "ماكينات تصوير كانون",
    "level": 3,
    "parentId": "2479",
    "count": 7,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2486",
    "name": "ماكينات تصوير كايوسيرا",
    "level": 3,
    "parentId": "2479",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2488",
    "name": "ماكينات تصوير كونيكا",
    "level": 3,
    "parentId": "2479",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "4678",
    "name": "طابعات باركود / POS",
    "level": 1,
    "parentId": null,
    "count": 3,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3415",
    "name": "طابعات برزر",
    "level": 1,
    "parentId": null,
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "3367",
    "name": "طابعات ليزر جيت",
    "level": 1,
    "parentId": null,
    "count": 1,
    "childCount": 1,
    "status": "active"
  },
  {
    "id": "3368",
    "name": "طابعات ليزر إتش بي",
    "level": 2,
    "parentId": "3367",
    "count": 1,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2446",
    "name": "عروض وتخفيضات",
    "level": 1,
    "parentId": null,
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "370",
    "name": "قارئ باركود",
    "level": 1,
    "parentId": null,
    "count": 8,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2965",
    "name": "قطع غيار الخوادم",
    "level": 1,
    "parentId": null,
    "count": 206,
    "childCount": 4,
    "status": "active"
  },
  {
    "id": "3046",
    "name": "أقراص SSD",
    "level": 2,
    "parentId": "2965",
    "count": 54,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3023",
    "name": "أقراص صلبة (HDD)",
    "level": 2,
    "parentId": "2965",
    "count": 44,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3008",
    "name": "ذاكرة (RAM)",
    "level": 2,
    "parentId": "2965",
    "count": 81,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2966",
    "name": "معالجات (CPU)",
    "level": 2,
    "parentId": "2965",
    "count": 27,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2741",
    "name": "قيمنق",
    "level": 1,
    "parentId": null,
    "count": 207,
    "childCount": 7,
    "status": "active"
  },
  {
    "id": "2754",
    "name": "اكسسوارات أخرى",
    "level": 2,
    "parentId": "2741",
    "count": 27,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3159",
    "name": "تجميعات وقطع",
    "level": 2,
    "parentId": "2741",
    "count": 46,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3157",
    "name": "سماعات قيمنق",
    "level": 2,
    "parentId": "2741",
    "count": 12,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3154",
    "name": "شاشات قيمنق",
    "level": 2,
    "parentId": "2741",
    "count": 58,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3158",
    "name": "كراسي وطاولات قيمنق",
    "level": 2,
    "parentId": "2741",
    "count": 41,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3155",
    "name": "كيبوردات قيمنق",
    "level": 2,
    "parentId": "2741",
    "count": 10,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3156",
    "name": "ماوسات قيمنق",
    "level": 2,
    "parentId": "2741",
    "count": 10,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2451",
    "name": "كمبيوتر",
    "level": 1,
    "parentId": null,
    "count": 359,
    "childCount": 4,
    "status": "active"
  },
  {
    "id": "2452",
    "name": "الكل في واحد",
    "level": 2,
    "parentId": "2451",
    "count": 38,
    "childCount": 4,
    "status": "active"
  },
  {
    "id": "2453",
    "name": "كمبيوتر الكل في واحد إتش بي",
    "level": 3,
    "parentId": "2452",
    "count": 16,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2807",
    "name": "كمبيوتر الكل في واحد اسوس",
    "level": 3,
    "parentId": "2452",
    "count": 5,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2454",
    "name": "كمبيوتر الكل في واحد ديل",
    "level": 3,
    "parentId": "2452",
    "count": 5,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2456",
    "name": "كمبيوتر الكل في واحد لينوفو",
    "level": 3,
    "parentId": "2452",
    "count": 12,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2455",
    "name": "كمبيوتر ألعاب",
    "level": 2,
    "parentId": "2451",
    "count": 1,
    "childCount": 1,
    "status": "active"
  },
  {
    "id": "2457",
    "name": "كمبيوتر ألعاب لينوفو",
    "level": 3,
    "parentId": "2455",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2458",
    "name": "كمبيوتر محمول",
    "level": 2,
    "parentId": "2451",
    "count": 287,
    "childCount": 10,
    "status": "active"
  },
  {
    "id": "2795",
    "name": "كمبيوتر ام س اي",
    "level": 3,
    "parentId": "2458",
    "count": 3,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2459",
    "name": "كمبيوتر محمول أبل",
    "level": 3,
    "parentId": "2458",
    "count": 48,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2460",
    "name": "كمبيوتر محمول أسوس",
    "level": 3,
    "parentId": "2458",
    "count": 28,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2461",
    "name": "كمبيوتر محمول إتش بي",
    "level": 3,
    "parentId": "2458",
    "count": 62,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2796",
    "name": "كمبيوتر محمول ام اس اي",
    "level": 3,
    "parentId": "2458",
    "count": 7,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2462",
    "name": "كمبيوتر محمول ايسر",
    "level": 3,
    "parentId": "2458",
    "count": 17,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2463",
    "name": "كمبيوتر محمول توشيبا",
    "level": 3,
    "parentId": "2458",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2464",
    "name": "كمبيوتر محمول ديل",
    "level": 3,
    "parentId": "2458",
    "count": 46,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2465",
    "name": "كمبيوتر محمول لينوفو",
    "level": 3,
    "parentId": "2458",
    "count": 73,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2745",
    "name": "كمبيوتر محمول مايكروسوفت سيرفيس",
    "level": 3,
    "parentId": "2458",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2466",
    "name": "كمبيوتر مكتبي",
    "level": 2,
    "parentId": "2451",
    "count": 34,
    "childCount": 5,
    "status": "active"
  },
  {
    "id": "2467",
    "name": "كمبيوتر ماك أبل",
    "level": 3,
    "parentId": "2466",
    "count": 2,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2468",
    "name": "كمبيوتر مكتبي إتش بي",
    "level": 3,
    "parentId": "2466",
    "count": 9,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2469",
    "name": "كمبيوتر مكتبي ايسر",
    "level": 3,
    "parentId": "2466",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2470",
    "name": "كمبيوتر مكتبي ديل",
    "level": 3,
    "parentId": "2466",
    "count": 14,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2472",
    "name": "كمبيوتر مكتبي لينوفو",
    "level": 3,
    "parentId": "2466",
    "count": 6,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "4474",
    "name": "كمبيوتر محمول",
    "level": 1,
    "parentId": null,
    "count": 25,
    "childCount": 4,
    "status": "active"
  },
  {
    "id": "4493",
    "name": "كمبيوتر محمول أبل",
    "level": 2,
    "parentId": "4474",
    "count": 16,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "4477",
    "name": "كمبيوتر محمول أسوس",
    "level": 2,
    "parentId": "4474",
    "count": 1,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "4476",
    "name": "كمبيوتر محمول إتش بي",
    "level": 2,
    "parentId": "4474",
    "count": 2,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "4475",
    "name": "كمبيوتر محمول ام اس اي",
    "level": 2,
    "parentId": "4474",
    "count": 6,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2815",
    "name": "لابتوب مجدد",
    "level": 1,
    "parentId": null,
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2818",
    "name": "ماكينات مجددة",
    "level": 1,
    "parentId": null,
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "3057",
    "name": "مجدد",
    "level": 1,
    "parentId": null,
    "count": 139,
    "childCount": 7,
    "status": "active"
  },
  {
    "id": "3086",
    "name": "آبل",
    "level": 2,
    "parentId": "3057",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "3143",
    "name": "أجهزة أبل",
    "level": 2,
    "parentId": "3057",
    "count": 6,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3139",
    "name": "حاسبات متكاملة",
    "level": 2,
    "parentId": "3057",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "3080",
    "name": "كمبيوتر الكل في واحد",
    "level": 2,
    "parentId": "3057",
    "count": 6,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3901",
    "name": "كمبيوتر محمول",
    "level": 2,
    "parentId": "3057",
    "count": 35,
    "childCount": 6,
    "status": "active"
  },
  {
    "id": "3902",
    "name": "كمبيوتر محمول أبل",
    "level": 3,
    "parentId": "3901",
    "count": 3,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "4008",
    "name": "كمبيوتر محمول أسوس",
    "level": 3,
    "parentId": "3901",
    "count": 3,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "4006",
    "name": "كمبيوتر محمول إتش بي",
    "level": 3,
    "parentId": "3901",
    "count": 7,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "4473",
    "name": "كمبيوتر محمول ام اس اي",
    "level": 3,
    "parentId": "3901",
    "count": 6,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3992",
    "name": "كمبيوتر محمول ايسر",
    "level": 3,
    "parentId": "3901",
    "count": 3,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "4007",
    "name": "كمبيوتر محمول لينوفو",
    "level": 3,
    "parentId": "3901",
    "count": 11,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "3058",
    "name": "لابتوب",
    "level": 2,
    "parentId": "3057",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "3091",
    "name": "لابتوبات",
    "level": 2,
    "parentId": "3057",
    "count": 91,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2719",
    "name": "مستعمل",
    "level": 1,
    "parentId": null,
    "count": 0,
    "childCount": 4,
    "status": "empty"
  },
  {
    "id": "2727",
    "name": "طابعات فواتير حرارية",
    "level": 2,
    "parentId": "2719",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2732",
    "name": "طابعات ليزر اسود",
    "level": 2,
    "parentId": "2719",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2731",
    "name": "طابعات ليزر ملون",
    "level": 2,
    "parentId": "2719",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2726",
    "name": "منظم التيار الكهربائي",
    "level": 2,
    "parentId": "2719",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "3312",
    "name": "مكيفات",
    "level": 1,
    "parentId": null,
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2487",
    "name": "ملحقات",
    "level": 1,
    "parentId": null,
    "count": 85,
    "childCount": 3,
    "status": "active"
  },
  {
    "id": "2489",
    "name": "ملحقات جوالات",
    "level": 2,
    "parentId": "2487",
    "count": 21,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2490",
    "name": "ملحقات سيارات",
    "level": 2,
    "parentId": "2487",
    "count": 1,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2492",
    "name": "ملحقات كمبيوتر",
    "level": 2,
    "parentId": "2487",
    "count": 6,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "4511",
    "name": "ملحقات مكتبية",
    "level": 1,
    "parentId": null,
    "count": 0,
    "childCount": 11,
    "status": "empty"
  },
  {
    "id": "4584",
    "name": "آلات تسعير ورولات ولاصقات",
    "level": 2,
    "parentId": "4511",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "4680",
    "name": "برايات كهربائية",
    "level": 2,
    "parentId": "4511",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "4681",
    "name": "حقائب لابتوب",
    "level": 2,
    "parentId": "4511",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "4513",
    "name": "دباسات كهربائية",
    "level": 2,
    "parentId": "4511",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "4583",
    "name": "شرائط لاصقة وشطرطون",
    "level": 2,
    "parentId": "4511",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "4512",
    "name": "فرامة ورق",
    "level": 2,
    "parentId": "4511",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "4676",
    "name": "ماكينات تجليد وتخريم",
    "level": 2,
    "parentId": "4511",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "4514",
    "name": "ماكينات تغليف حراري",
    "level": 2,
    "parentId": "4511",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "4677",
    "name": "مقصات ورق ومستلزماتها",
    "level": 2,
    "parentId": "4511",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "4602",
    "name": "ملفات بوكس فايل",
    "level": 2,
    "parentId": "4511",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "4625",
    "name": "ملفات وجيوب بلاستيكية",
    "level": 2,
    "parentId": "4511",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2491",
    "name": "منتجات رقمية",
    "level": 1,
    "parentId": null,
    "count": 0,
    "childCount": 2,
    "status": "empty"
  },
  {
    "id": "2494",
    "name": "ألعاب",
    "level": 2,
    "parentId": "2491",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2496",
    "name": "برامج",
    "level": 2,
    "parentId": "2491",
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "2495",
    "name": "نقاط بيع",
    "level": 1,
    "parentId": null,
    "count": 18,
    "childCount": 3,
    "status": "active"
  },
  {
    "id": "1567",
    "name": "اجهزة كاشير",
    "level": 2,
    "parentId": "2495",
    "count": 15,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "4679",
    "name": "طابعات فواتير حرارية",
    "level": 2,
    "parentId": "2495",
    "count": 3,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2498",
    "name": "طابعة فواتير",
    "level": 2,
    "parentId": "2495",
    "count": 8,
    "childCount": 0,
    "status": "active"
  },
  {
    "id": "2742",
    "name": "وحدات التخزين الداخلية",
    "level": 1,
    "parentId": null,
    "count": 0,
    "childCount": 0,
    "status": "empty"
  },
  {
    "id": "3326",
    "name": "RETIRED — أحبار طابعات",
    "level": 1,
    "parentId": null,
    "count": 0,
    "childCount": 1,
    "status": "retired"
  },
  {
    "id": "3327",
    "name": "RETIRED — Toshiba",
    "level": 2,
    "parentId": "3326",
    "count": 0,
    "childCount": 0,
    "status": "retired"
  },
  {
    "id": "3722",
    "name": "RETIRED — أحبار وتونر طابعات",
    "level": 1,
    "parentId": null,
    "count": 0,
    "childCount": 2,
    "status": "retired"
  },
  {
    "id": "3723",
    "name": "RETIRED — أحبار طابعات أصلية",
    "level": 2,
    "parentId": "3722",
    "count": 0,
    "childCount": 0,
    "status": "retired"
  },
  {
    "id": "3729",
    "name": "RETIRED — تونر ليزر أصلي",
    "level": 2,
    "parentId": "3722",
    "count": 0,
    "childCount": 0,
    "status": "retired"
  },
  {
    "id": "3903",
    "name": "RETIRED — كمبيوتر محمول",
    "level": 1,
    "parentId": null,
    "count": 0,
    "childCount": 6,
    "status": "retired"
  },
  {
    "id": "4079",
    "name": "RETIRED — كمبيوتر محمول أبل",
    "level": 2,
    "parentId": "3903",
    "count": 0,
    "childCount": 0,
    "status": "retired"
  },
  {
    "id": "3963",
    "name": "RETIRED — كمبيوتر محمول أسوس",
    "level": 2,
    "parentId": "3903",
    "count": 0,
    "childCount": 0,
    "status": "retired"
  },
  {
    "id": "3908",
    "name": "RETIRED — كمبيوتر محمول إتش بي",
    "level": 2,
    "parentId": "3903",
    "count": 0,
    "childCount": 0,
    "status": "retired"
  },
  {
    "id": "3907",
    "name": "RETIRED — كمبيوتر محمول ام اس اي",
    "level": 2,
    "parentId": "3903",
    "count": 0,
    "childCount": 0,
    "status": "retired"
  },
  {
    "id": "3909",
    "name": "RETIRED — كمبيوتر محمول ديل",
    "level": 2,
    "parentId": "3903",
    "count": 0,
    "childCount": 0,
    "status": "retired"
  },
  {
    "id": "3904",
    "name": "RETIRED — كمبيوتر محمول لينوفو",
    "level": 2,
    "parentId": "3903",
    "count": 0,
    "childCount": 0,
    "status": "retired"
  }
];

export const ALL_PRODUCTS_ID = "620";
