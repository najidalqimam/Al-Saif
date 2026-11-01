// Demo products so the computer departments have something to show. Prices are sample values, they carry
// no ratings or reviews, and each one is marked demo in the dashboard where it can be edited or archived.
// Photos reuse the department artwork in /public/departments.

export type DemoProduct = {
  id: string;
  nameAr: string;
  nameEn: string;
  categoryAr: string;
  categoryEn: string;
  /** Category id from src/data/catalog-tree.ts. */
  categoryId: string;
  price: number;
  compareAt: number;
  image: string;
};

export const DEMO_PRODUCTS: DemoProduct[] = [
  { id: "demo-laptop-business", nameAr: "لابتوب أعمال 14 بوصة", nameEn: "14-inch business laptop", categoryAr: "لابتوبات أعمال", categoryEn: "Business laptops", categoryId: "laptops", price: 3299, compareAt: 3899, image: "/departments/computers-laptops.png" },
  { id: "demo-laptop-student", nameAr: "لابتوب دراسة 15.6 بوصة", nameEn: "15.6-inch student laptop", categoryAr: "لابتوبات دراسة", categoryEn: "Student laptops", categoryId: "laptops", price: 2199, compareAt: 2599, image: "/departments/student-laptops.png" },
  { id: "demo-laptop-creator", nameAr: "لابتوب تصميم 16 بوصة", nameEn: "16-inch creator laptop", categoryAr: "لابتوبات تصميم", categoryEn: "Creator laptops", categoryId: "laptops", price: 5499, compareAt: 6299, image: "/departments/creator-laptops.png" },
  { id: "demo-desktop", nameAr: "كمبيوتر مكتبي للأعمال", nameEn: "Business desktop PC", categoryAr: "أجهزة مكتبية", categoryEn: "Desktops", categoryId: "desktops", price: 2799, compareAt: 3199, image: "/departments/desktops.png" },
  { id: "demo-all-in-one", nameAr: "كمبيوتر الكل في واحد 24 بوصة", nameEn: "24-inch all-in-one PC", categoryAr: "الكل في واحد", categoryEn: "All-in-one PCs", categoryId: "all-in-one", price: 3599, compareAt: 3999, image: "/departments/all-in-one.png" },
  { id: "demo-workstation", nameAr: "محطة عمل احترافية", nameEn: "Pro workstation", categoryAr: "محطات عمل", categoryEn: "Workstations", categoryId: "workstations", price: 8999, compareAt: 9999, image: "/departments/workstations.png" },
  { id: "demo-portable-monitor", nameAr: "شاشة محمولة 15.6 بوصة", nameEn: "15.6-inch portable monitor", categoryAr: "شاشات محمولة", categoryEn: "Portable monitors", categoryId: "portable-monitors", price: 799, compareAt: 999, image: "/departments/portable-monitors.png" },
  { id: "demo-keyboard", nameAr: "لوحة مفاتيح ميكانيكية", nameEn: "Mechanical keyboard", categoryAr: "لوحات مفاتيح", categoryEn: "Keyboards", categoryId: "keyboards", price: 299, compareAt: 399, image: "/departments/keyboards.png" },
  { id: "demo-mouse", nameAr: "ماوس لاسلكي", nameEn: "Wireless mouse", categoryAr: "ماوس", categoryEn: "Mice", categoryId: "mice", price: 129, compareAt: 179, image: "/departments/mice.png" },
  { id: "demo-webcam", nameAr: "كاميرا ويب 1080p", nameEn: "1080p webcam", categoryAr: "كاميرات ويب", categoryEn: "Webcams", categoryId: "webcams", price: 199, compareAt: 259, image: "/departments/webcams.png" },
  { id: "demo-ssd", nameAr: "قرص SSD سعة 1 تيرا", nameEn: "1 TB SSD", categoryAr: "أقراص SSD", categoryEn: "SSDs", categoryId: "ssd", price: 349, compareAt: 449, image: "/departments/ssd.png" },
  { id: "demo-tablet", nameAr: "جهاز لوحي 11 بوصة", nameEn: "11-inch tablet", categoryAr: "أجهزة لوحية", categoryEn: "Tablets", categoryId: "tablets", price: 1799, compareAt: 2099, image: "/departments/tablets.png" },
  { id: "demo-printer", nameAr: "طابعة حبر ملونة", nameEn: "Color inkjet printer", categoryAr: "طابعات حبر", categoryEn: "Inkjet printers", categoryId: "inkjet-printers", price: 449, compareAt: 549, image: "/departments/inkjet-printers.png" },
  { id: "demo-switch", nameAr: "سويتش شبكة 8 منافذ", nameEn: "8-port network switch", categoryAr: "سويتشات", categoryEn: "Switches", categoryId: "switches", price: 249, compareAt: 329, image: "/departments/switches.png" },
  { id: "demo-ups", nameAr: "جهاز UPS سعة 1500VA", nameEn: "1500VA UPS", categoryAr: "أجهزة UPS", categoryEn: "UPS units", categoryId: "ups", price: 899, compareAt: 1099, image: "/departments/ups.png" },
  { id: "demo-tv", nameAr: "تلفزيون 55 بوصة 4K", nameEn: "55-inch 4K TV", categoryAr: "تلفزيونات", categoryEn: "TVs", categoryId: "tvs", price: 2499, compareAt: 2999, image: "/departments/tvs.png" },
  { id: "demo-camera", nameAr: "كاميرا تصوير احترافية", nameEn: "Pro photo camera", categoryAr: "كاميرات", categoryEn: "Cameras", categoryId: "photo-cameras", price: 3999, compareAt: 4599, image: "/departments/photo-cameras.png" },
  { id: "demo-smartwatch", nameAr: "ساعة ذكية", nameEn: "Smartwatch", categoryAr: "ساعات ذكية", categoryEn: "Smartwatches", categoryId: "smartwatches", price: 699, compareAt: 899, image: "/departments/smartwatches.png" },
];
