import { Prisma, PrismaClient } from "@prisma/client";

// One Prisma client per process. It reads DATABASE_URL from the environment (server/.env in development);
// that value must never reach the frontend bundle or the browser.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Runs a whole transaction again when the database aborted it because of a deadlock or write conflict
 * (Prisma P2034), plus any extra errors `retryOn` accepts. Safe because an aborted transaction has been
 * rolled back completely. Errors thrown on purpose (OrderError, ...) are never retried.
 */
export async function withTransactionRetry<T>(run: () => Promise<T>, retryOn: (error: Prisma.PrismaClientKnownRequestError) => boolean = () => false, attempts = 3): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await run();
    } catch (error) {
      const retryable = error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2034" || retryOn(error));
      if (!retryable || attempt >= attempts) throw error;
      // Short random pause so the competing transactions don't collide again straight away.
      await new Promise((resolve) => setTimeout(resolve, 20 * attempt + Math.random() * 30));
    }
  }
}
