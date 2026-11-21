import { hashPassword } from "../auth/password.js";
import { prisma } from "../db.js";
import { placeOrder } from "../orders/place-order.js";

// Demo data for the local dashboard: pnpm demo:seed
// Adds a few shops, customers and orders marked "(تجريبي)" / @example.com. Safe to run again: anything that already
// exists is left as it is, and nothing is deleted. Customer password for all demo accounts: DEMO_PASSWORD below.

const DEMO_PASSWORD = "Demo-Pass-2026!";

const SHOPS = [
  { name: "مدار الرياض للحاسب", city: "الرياض", ownerName: "خالد العتيبي", phone: "0501110001" },
  { name: "واحة جدة للإلكترونيات (تجريبي)", city: "جدة", ownerName: "سعد الحربي", phone: "0501110002" },
  { name: "نخبة الدمام للتقنية (تجريبي)", city: "الدمام", ownerName: "فهد القحطاني", phone: "0501110003" },
];

const CUSTOMERS = [
  { firstName: "محمد", lastName: "الغامدي", phone: "0551230001", email: "demo1@example.com", zone: "central", city: "الرياض" },
  { firstName: "نورة", lastName: "الشمري", phone: "0551230002", email: "demo2@example.com", zone: "western", city: "جدة" },
  { firstName: "عبدالله", lastName: "الدوسري", phone: "0551230003", email: "demo3@example.com", zone: "eastern", city: "الدمام" },
  { firstName: "ريم", lastName: "العنزي", phone: "0551230004", email: "demo4@example.com", zone: "central", city: "الرياض" },
];

async function main() {
  // Shops (matched by name).
  const shops = [];
  for (const data of SHOPS) {
    shops.push((await prisma.shop.findFirst({ where: { name: data.name } })) ?? (await prisma.shop.create({ data: { ...data, email: "", address: `${data.city}، حي التجربة`, description: "محل تجريبي" } })));
  }

  // Link products that belong to no shop yet, round-robin. Products that already have a shop are left alone.
  const free = await prisma.product.findMany({ where: { shopId: null, archivedAt: null }, orderBy: { createdAt: "asc" }, select: { id: true } });
  for (const [index, product] of free.entries()) await prisma.product.update({ where: { id: product.id }, data: { shopId: shops[index % shops.length].id } });

  // Customers (matched by email) and a couple of orders each, placed through the real order code.
  const products = await prisma.product.findMany({ where: { isVisible: true, archivedAt: null, approvalStatus: null }, orderBy: { createdAt: "asc" }, take: 12, select: { id: true } });
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  let orders = 0;
  for (const [index, c] of CUSTOMERS.entries()) {
    const customer =
      (await prisma.customer.findUnique({ where: { email: c.email } })) ??
      (await prisma.customer.create({ data: { firstName: c.firstName, lastName: c.lastName, fullName: `${c.firstName} ${c.lastName}`, phone: c.phone, email: c.email, passwordHash } }));
    if (await prisma.order.count({ where: { customerId: customer.id } })) continue;
    for (let n = 0; n < 2; n++) {
      const picks = [products[(index * 3 + n) % products.length], products[(index * 3 + n + 1) % products.length]];
      try {
        await placeOrder({
          customerId: customer.id,
          customer: { fullName: customer.fullName, phone: customer.phone, email: customer.email },
          address: { zoneCode: c.zone, city: c.city, line1: "حي التجربة، شارع الاختبار 10" },
          shippingMethodCode: "standard",
          paymentMethod: "COD",
          items: picks.map((p, i) => ({ productId: p.id, quantity: i + 1 })),
          locale: "ar",
        });
        orders++;
      } catch (error) {
        console.warn(`order skipped for ${c.email}:`, error instanceof Error ? error.message : error);
      }
    }
  }
  console.log(`shops: ${shops.length}, customers: ${CUSTOMERS.length}, new orders: ${orders}, products linked to shops: ${free.length}`);
}

main().finally(() => prisma.$disconnect());
