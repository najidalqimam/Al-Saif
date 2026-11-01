import { createApp } from "./app.js";
import { config } from "./config.js";
import { prisma } from "./db.js";
import { startOutboxWorker } from "./mail/outbox.js";

const server = createApp().listen(config.PORT, config.HOST, () => {
  console.log(`Al-Saif API listening on http://${config.HOST}:${config.PORT} (email: ${config.mailTransport})`);
});
// Sends queued emails (welcome messages) and retries failed ones every minute.
const stopOutbox = startOutboxWorker();

async function shutdown() {
  stopOutbox();
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
