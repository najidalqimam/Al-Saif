import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline";
import { AdminRole } from "@prisma/client";
import { z } from "zod";
import { hashPassword, passwordProblem } from "../auth/password.js";
import { prisma } from "../db.js";

// Creates one admin account from the terminal: pnpm admin:create
// The password is typed without being shown, hashed with scrypt, and only the hash is stored.
// For scripted setups the password can come from the ADMIN_PASSWORD environment variable instead of a prompt.

function ask(question: string, hidden = false) {
  return new Promise<string>((resolve) => {
    const rl = createInterface({ input: stdin, output: stdout, terminal: true });
    if (hidden) {
      // Print the question, then swallow the typed characters instead of echoing them.
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
  const existing = await prisma.adminUser.count();
  const email = z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email())
    .parse(process.env.ADMIN_EMAIL ?? (await ask("Email: ")));
  const fullName = z
    .string()
    .trim()
    .min(2)
    .parse(process.env.ADMIN_NAME ?? (await ask("Full name: ")));
  // The very first account is the owner; later ones default to editor unless chosen otherwise.
  const defaultRole: AdminRole = existing === 0 ? "OWNER" : "EDITOR";
  const roleInput = (process.env.ADMIN_ROLE ?? (await ask(`Role (${Object.keys(AdminRole).join("/")}) [${defaultRole}]: `))).trim().toUpperCase();
  const role = z.enum(AdminRole).parse(roleInput || defaultRole);

  let password = process.env.ADMIN_PASSWORD ?? "";
  if (!password) {
    password = await ask("Password (min 12 characters, hidden): ", true);
    const again = await ask("Repeat password: ", true);
    if (password !== again) throw new Error("Passwords do not match.");
  }
  const problem = passwordProblem(password);
  if (problem) throw new Error(problem);

  if (await prisma.adminUser.findUnique({ where: { email } })) throw new Error(`An admin with ${email} already exists.`);
  const admin = await prisma.adminUser.create({ data: { email, fullName, role, passwordHash: await hashPassword(password) } });
  console.log(`Created ${admin.role} ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error instanceof z.ZodError ? `Invalid input: ${error.issues.map((issue) => issue.message).join("; ")}` : error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
