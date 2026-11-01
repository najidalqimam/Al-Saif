import { fileURLToPath } from "node:url";
import { z } from "zod";

// Settings read from the environment (server/.env in development). Everything except DATABASE_URL has a safe
// local default, so an existing .env keeps working without new keys.
const Env = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  /** 127.0.0.1 keeps the API reachable from this machine only during development. */
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  /** Comma-separated list of frontends allowed to call the API with cookies. */
  CORS_ORIGIN: z.string().default("http://localhost:5175,http://127.0.0.1:5175"),
  SESSION_TTL_HOURS: z.coerce.number().positive().max(24 * 30).default(12),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is missing; copy .env.example to .env"),
  /** Folder for product photos uploaded from the dashboard. Defaults to the storefront's public/uploads. */
  UPLOAD_DIR: z.string().default(fileURLToPath(new URL("../../public/uploads", import.meta.url))),
  /** Public path the storefront uses for that folder. */
  UPLOAD_URL_PREFIX: z.string().regex(/^\/[a-z0-9/_-]*$/i).default("/uploads"),
  /** How long a customer stays signed in on a device. */
  CUSTOMER_SESSION_DAYS: z.coerce.number().positive().max(365).default(30),
  /** Storefront address used in emails (links back to the store). */
  STORE_URL: z.string().url().default("http://localhost:5175"),

  // Outgoing email (welcome message after registration). Any SMTP provider works: Amazon SES, SendGrid,
  // Mailgun, Zoho, Google Workspace... "smtp" sends for real, "log" writes each message to MAIL_LOG_DIR for
  // local testing, "off" keeps messages queued until a transport is configured. Default: smtp when SMTP_HOST
  // is set, otherwise off.
  MAIL_TRANSPORT: z.enum(["smtp", "log", "off"]).optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  /** true for port 465 (TLS from the start); false uses STARTTLS on 587. */
  SMTP_SECURE: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  /** Sender shown to customers, e.g. "Al-Saif Store <no-reply@example.com>". */
  MAIL_FROM: z.string().optional(),
  MAIL_LOG_DIR: z.string().default(fileURLToPath(new URL("../mail-log", import.meta.url))),
});

const parsed = Env.safeParse(process.env);
if (!parsed.success) {
  // List the problem keys only; never print their values.
  const keys = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
  throw new Error(`Invalid server environment: ${keys}`);
}

export const config = {
  ...parsed.data,
  mailTransport: parsed.data.MAIL_TRANSPORT ?? (parsed.data.SMTP_HOST ? "smtp" : "off"),
  isProduction: parsed.data.NODE_ENV === "production",
  corsOrigins: parsed.data.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
