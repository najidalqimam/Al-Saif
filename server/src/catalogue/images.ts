import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";

// Product photos uploaded from the dashboard arrive as data URLs (the dashboard already shrinks them to at
// most 600px). They are written as new files and only their path goes into the database. A file is never
// overwritten: every upload gets a new name, and writing fails rather than replace an existing file.

const TYPES = {
  "image/webp": { ext: "webp", check: (b: Buffer) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP" },
  "image/png": { ext: "png", check: (b: Buffer) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/jpeg": { ext: "jpg", check: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
} as const;

export const MAX_IMAGE_BYTES = 1024 * 1024;
export const DATA_URL = /^data:(image\/(?:webp|png|jpeg));base64,([A-Za-z0-9+/]+={0,2})$/;

export class ImageError extends Error {}

/** Decodes and checks an uploaded image without writing anything. */
export function decodeImage(dataUrl: string) {
  const match = DATA_URL.exec(dataUrl);
  if (!match) throw new ImageError("Send a PNG, JPEG or WebP image as a base64 data URL.");
  const type = TYPES[match[1] as keyof typeof TYPES];
  const bytes = Buffer.from(match[2]!, "base64");
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new ImageError("The image must be smaller than 1 MB.");
  // The declared type must match the file's own signature, so a renamed file of another kind is refused.
  if (!type.check(bytes)) throw new ImageError("The image content does not match its type.");
  return { bytes, ext: type.ext };
}

/** Saves an uploaded image under UPLOAD_DIR/products and returns the public path stored in the database. */
export async function saveProductImage(dataUrl: string, productKey: string) {
  const { bytes, ext } = decodeImage(dataUrl);
  const dir = path.join(config.UPLOAD_DIR, "products");
  await mkdir(dir, { recursive: true });
  const name = `${productKey.replace(/[^a-z0-9-]/gi, "").slice(0, 60) || "product"}-${randomBytes(4).toString("hex")}.${ext}`;
  // "wx" fails if the file exists, so nothing already on disk can be replaced.
  await writeFile(path.join(dir, name), bytes, { flag: "wx" });
  return `${config.UPLOAD_URL_PREFIX.replace(/\/$/, "")}/products/${name}`;
}
