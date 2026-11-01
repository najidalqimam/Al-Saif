import { Router } from "express";
import { categoryInclude, categoryLevels, productInclude, productOrder, publicCategory, publicProduct } from "../catalogue/serialize.js";
import { prisma } from "../db.js";

// GET /api/catalogue: what the storefront shows. Archived products and categories, and hidden products, are
// left out. Hidden categories are included with isVisible: false because the storefront filters its menus
// by that flag, exactly as it does with its built-in list.

export const catalogueRouter = Router();

catalogueRouter.get("/", async (_req, res) => {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ where: { archivedAt: null }, include: categoryInclude, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.product.findMany({ where: { isVisible: true, archivedAt: null }, include: productInclude, orderBy: productOrder }),
  ]);
  const levels = categoryLevels(categories);
  res.setHeader("Cache-Control", "no-store");
  res.json({
    categories: categories.map((category) => publicCategory(category, levels.get(category.id) ?? 1)),
    products: products.map(publicProduct),
  });
});
