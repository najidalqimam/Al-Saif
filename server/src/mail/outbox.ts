import { prisma } from "../db.js";
import { config } from "../config.js";
import { MailNotConfigured, sendMessage } from "./transport.js";
import { welcomeMessage } from "./welcome.js";

// Delivers queued emails. A row is claimed with a conditional update (PENDING -> SENDING), so two workers or
// a retry racing the background loop can never send the same email twice. Failures are retried with growing
// pauses; after MAX_ATTEMPTS the row is marked FAILED and can be queued again from the account page.

const MAX_ATTEMPTS = 6;
const RETRY_MINUTES = [1, 5, 15, 60, 180];
const STALE_SENDING_MS = 10 * 60 * 1000;

/** Short failure text for the log column: the error message only, never transport settings. */
function reason(error: unknown) {
  const text = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  return text.replace(/\s+/g, " ").slice(0, 480);
}

export async function deliver(id: string) {
  const claimed = await prisma.emailOutbox.updateMany({
    where: { id, status: "PENDING", nextAttemptAt: { lte: new Date() } },
    data: { status: "SENDING", attempts: { increment: 1 } },
  });
  if (claimed.count === 0) return "skipped" as const;
  const row = await prisma.emailOutbox.findUniqueOrThrow({ where: { id }, include: { customer: { select: { firstName: true } } } });
  try {
    if (row.kind !== "WELCOME") throw new Error(`Unknown email kind ${row.kind}`);
    await sendMessage(welcomeMessage(row.toAddress, row.customer?.firstName ?? "", row.locale));
    await prisma.emailOutbox.update({ where: { id }, data: { status: "SENT", sentAt: new Date(), lastError: null } });
    return "sent" as const;
  } catch (error) {
    if (error instanceof MailNotConfigured) {
      // Not a delivery attempt: keep it queued, without using up its retries, until email is configured.
      await prisma.emailOutbox.update({ where: { id }, data: { status: "PENDING", attempts: { decrement: 1 }, lastError: reason(error), nextAttemptAt: new Date(Date.now() + 60 * 60 * 1000) } });
      return "not-configured" as const;
    }
    const finished = row.attempts >= MAX_ATTEMPTS;
    const pause = RETRY_MINUTES[Math.min(row.attempts - 1, RETRY_MINUTES.length - 1)] * 60 * 1000;
    await prisma.emailOutbox.update({
      where: { id },
      data: { status: finished ? "FAILED" : "PENDING", lastError: reason(error), nextAttemptAt: new Date(Date.now() + pause) },
    });
    console.error(`Email ${id} (${row.kind}) failed, attempt ${row.attempts}: ${reason(error)}`);
    return finished ? ("failed" as const) : ("retry" as const);
  }
}

/** One pass: frees rows stuck in SENDING (a crash mid-send) and sends everything that is due. */
export async function processOutbox() {
  await prisma.emailOutbox.updateMany({
    where: { status: "SENDING", updatedAt: { lt: new Date(Date.now() - STALE_SENDING_MS) } },
    data: { status: "PENDING" },
  });
  if (config.mailTransport === "off") return;
  const due = await prisma.emailOutbox.findMany({ where: { status: "PENDING", nextAttemptAt: { lte: new Date() } }, select: { id: true }, take: 20, orderBy: { nextAttemptAt: "asc" } });
  for (const row of due) await deliver(row.id);
}

/** Puts a welcome email back in the queue (the customer asked for it again); a sent one is left alone. */
export async function requeueWelcome(customerId: string) {
  const updated = await prisma.emailOutbox.updateMany({
    where: { customerId, kind: "WELCOME", status: { in: ["PENDING", "FAILED"] } },
    data: { status: "PENDING", attempts: 0, nextAttemptAt: new Date() },
  });
  return updated.count > 0;
}

export function startOutboxWorker(intervalMs = 60_000) {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await processOutbox();
    } catch (error) {
      console.error(`Email outbox pass failed: ${reason(error)}`);
    } finally {
      running = false;
    }
  };
  const timer = setInterval(tick, intervalMs);
  timer.unref();
  void tick();
  return () => clearInterval(timer);
}
