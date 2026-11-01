import { randomBytes, scrypt as scryptCallback, timingSafeEqual, type ScryptOptions } from "node:crypto";

// Password hashing with scrypt from Node's standard library (memory-hard, on OWASP's recommended list).
// argon2 was the first choice but has no prebuilt binary for Intel Macs and failed to compile here, so this
// avoids a native dependency. The parameters are stored in each hash, so they can be raised later and old
// hashes still verify.
//
// Format: scrypt$<N>$<r>$<p>$<salt base64>$<hash base64>

const PARAMS = { N: 2 ** 17, r: 8, p: 1 };
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

function scrypt(password: string, salt: Buffer, keyLength: number, options: ScryptOptions) {
  return new Promise<Buffer>((resolve, reject) => {
    // maxmem must exceed 128 * N * r bytes (128 MiB for the defaults above).
    scryptCallback(password, salt, keyLength, { ...options, maxmem: 256 * 1024 * 1024 }, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(SALT_BYTES);
  const key = await scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, PARAMS);
  return ["scrypt", PARAMS.N, PARAMS.r, PARAMS.p, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, n, r, p, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const key = await scrypt(password.normalize("NFKC"), Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** Used when the email is unknown, so a failed login takes as long as a wrong password. */
let dummyHash: Promise<string> | null = null;
export function dummyPasswordHash() {
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
  return dummyHash;
}

/** Minimum rules for admin passwords: long enough to resist guessing; length beats complexity rules. */
export function passwordProblem(password: string) {
  if (password.length < 12) return "Password must be at least 12 characters.";
  if (password.length > 256) return "Password must be at most 256 characters.";
  return null;
}
