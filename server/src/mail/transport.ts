import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import nodemailer, { type Transporter } from "nodemailer";
import { config } from "../config.js";

// Sends one message through the configured transport. SMTP credentials come from server environment variables
// only; they are never logged or sent to the browser.

export type Message = { to: string; subject: string; text: string; html: string };

export class MailNotConfigured extends Error {}

let smtp: Transporter | null = null;

function smtpTransport() {
  if (!config.SMTP_HOST || !config.MAIL_FROM) throw new MailNotConfigured("SMTP_HOST and MAIL_FROM are required for MAIL_TRANSPORT=smtp");
  smtp ??= nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASSWORD ?? "" } : undefined,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  });
  return smtp;
}

export async function sendMessage(message: Message) {
  if (config.mailTransport === "off") throw new MailNotConfigured("Email sending is not configured (MAIL_TRANSPORT=off)");
  if (config.mailTransport === "log") {
    // Local testing: the message is written to a file instead of being sent.
    await mkdir(config.MAIL_LOG_DIR, { recursive: true });
    const name = `${new Date().toISOString().replace(/[:.]/g, "-")}-${message.to.replace(/[^a-z0-9@._-]/gi, "_")}.eml`;
    const from = config.MAIL_FROM ?? "Al-Saif Store <no-reply@localhost>";
    const raw = [`From: ${from}`, `To: ${message.to}`, `Subject: ${message.subject}`, "", message.text, "", "----- HTML -----", message.html].join("\n");
    await writeFile(path.join(config.MAIL_LOG_DIR, name), raw, { flag: "wx" });
    return;
  }
  await smtpTransport().sendMail({ from: config.MAIL_FROM, to: message.to, subject: message.subject, text: message.text, html: message.html });
}
