import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import helmet from "helmet";
import { config } from "./config.js";
import { prisma } from "./db.js";
import { accountRouter } from "./routes/account.js";
import { adminAuthRouter } from "./routes/admin-auth.js";
import { adminCatalogueRouter } from "./routes/admin-catalogue.js";
import { adminCustomersRouter } from "./routes/admin-customers.js";
import { adminOrdersRouter } from "./routes/admin-orders.js";
import { catalogueRouter } from "./routes/catalogue.js";
import { adminCheckoutRouter, checkoutRouter } from "./routes/checkout-settings.js";
import { ordersRouter } from "./routes/orders.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  // Only the configured frontends may call the API from a browser, with cookies for the admin routes.
  app.use(cors({ origin: config.corsOrigins, credentials: true }));
  // Product photos are sent as data URLs, so only the product create/edit routes accept larger bodies.
  app.use(["/api/admin/products"], express.json({ limit: "2mb" }));
  app.use(express.json({ limit: "50kb" }));

  app.get("/api/health", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ ok: true, database: "up" });
    } catch {
      res.status(503).json({ ok: false, database: "down" });
    }
  });

  // Photos uploaded from the dashboard. Served by the API itself so a new photo is reachable the moment it is
  // saved; file names carry a random part and never change, so browsers may cache them for good.
  app.use(
    config.UPLOAD_URL_PREFIX.replace(/\/$/, ""),
    helmet.crossOriginResourcePolicy({ policy: "cross-origin" }),
    express.static(config.UPLOAD_DIR, { fallthrough: false, index: false, dotfiles: "deny", immutable: true, maxAge: "365d" }),
  );

  app.use("/api/catalogue", catalogueRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/checkout", checkoutRouter);
  app.use("/api/account", accountRouter);
  app.use("/api/admin/auth", adminAuthRouter);
  app.use("/api/admin/orders", adminOrdersRouter);
  app.use("/api/admin/customers", adminCustomersRouter);
  app.use("/api/admin", adminCheckoutRouter);
  app.use("/api/admin", adminCatalogueRouter);

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "NOT_FOUND" });
  });

  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    // Malformed JSON bodies come through here from express.json().
    if (error?.type === "entity.parse.failed" || error?.type === "entity.too.large") {
      res.status(400).json({ error: "INVALID_BODY" });
      return;
    }
    // A missing or refused upload file (express.static with fallthrough off).
    if (error?.status === 404 || error?.status === 403) {
      res.status(404).json({ error: "NOT_FOUND" });
      return;
    }
    console.error(error);
    res.status(500).json({ error: "INTERNAL_ERROR" });
  };
  app.use(errorHandler);

  return app;
}
