import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline";
import { hashPassword, passwordProblem } from "../auth/password.js";
import { prisma } from "../db.js";

// Sets a new password for an existing dashboard account: pnpm admin:reset-password
// The password is typed without being shown, hashed with scrypt, and only the hash is stored. Open sessions of that
// account are ended. The email can come from ADMIN_EMAIL; otherwise it is asked for (default: the only account).

function ask(question: string, hidden = false) {
  return new Promise<string>((resolve) => {
    const rl = createInterface({ input: stdin, output: stdout, terminal: true });
    if (hidden) {
      const write = (rl as unknown as { _writeToOutput: (text: string) => void })._writeToOutput;
      (rl as unknown as { _writeToOutput: (text: string) => void })._writeToOutput = (text: string) => {
        if (text.includes(question)) write.call(rl, text);
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) stdout.write("\n");
      resolve(answer);
    });
  });
}

async function main() {
  const admins = await prisma.adminUser.findMany({ select: { id: true, email: true, role: true }, orderBy: { createdAt: "asc" } });
  if (admins.length === 0) throw new Error("There is no dashboard account yet. Create one with: pnpm admin:create");
  let email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  if (!email) {
    const fallback = admins.length === 1 ? admins[0].email : "";
    console.log(`Accounts: ${admins.map((admin) => `${admin.email} (${admin.role})`).join(", ")}`);
    email = ((await ask(`Email${fallback ? ` [${fallback}]` : ""}: `)).trim().toLowerCase() || fallback);
  }
  const admin = admins.find((row) => row.email === email);
  if (!admin) throw new Error(`No dashboard account with ${email || "that email"}.`);

  const password = await ask("New password (min 12 characters, hidden): ", true);
  const again = await ask("Repeat password: ", true);
  if (password !== again) throw new Error("Passwords do not match.");
  const problem = passwordProblem(password);
  if (problem) throw new Error(problem);

  await prisma.$transaction([
    prisma.adminUser.update({ where: { id: admin.id }, data: { passwordHash: await hashPassword(password), isActive: true } }),
    prisma.adminSession.updateMany({ where: { adminUserId: admin.id, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
  console.log(`Password updated for ${admin.email}. You can sign in to the dashboard now.`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
