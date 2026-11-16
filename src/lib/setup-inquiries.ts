/**
 * "Ask us to prepare your order" requests.
 *
 * There is no server endpoint for these yet: the storefront form has always saved them in this browser under
 * `al-saif-setup-inquiries`, and the dashboard reads that same list. Requests are therefore visible only in the browser
 * that sent them. Rows written before the status workflow existed have no `id`, `status` or `adminNotes`; they are read
 * as "new" and are only rewritten when the admin changes that row.
 *
 * The list is never trimmed and nothing is ever deleted. Writes go through the raw stored array, so entries this code
 * does not recognise are kept as they are. If the browser cannot store (full or blocked), the write fails, the stored
 * list stays untouched and the caller is told so.
 */
export const INQUIRIES_KEY = "al-saif-setup-inquiries";

export type InquiryStatus = "new" | "contacting" | "done";

export type SetupInquiry = {
  name: string;
  phone: string;
  note: string;
  at: string;
  id?: string;
  status?: InquiryStatus;
  /** Internal admin notes. Never shown to the customer. */
  adminNotes?: string;
};

/** Stable id for a row, including legacy rows saved without one. */
export const inquiryId = (row: SetupInquiry) => row.id ?? `${row.at}|${row.phone}`;
export const statusOf = (row: SetupInquiry): InquiryStatus => (row.status === "contacting" || row.status === "done" ? row.status : "new");

const isInquiry = (row: unknown): row is SetupInquiry => {
  const value = row as Partial<SetupInquiry> | null;
  return typeof value?.name === "string" && typeof value?.phone === "string" && typeof value?.note === "string" && typeof value?.at === "string";
};

/** Everything stored under the key, untouched. Throws when the stored value is unreadable, so a bad read never turns into an overwrite. */
function readRaw(): unknown[] {
  const stored = localStorage.getItem(INQUIRIES_KEY);
  if (stored === null) return [];
  const parsed = JSON.parse(stored) as unknown;
  if (!Array.isArray(parsed)) throw new Error("unexpected inquiries format");
  return parsed;
}

export function loadInquiries(): SetupInquiry[] {
  try {
    return readRaw().filter(isInquiry);
  } catch {
    return [];
  }
}

function write(rows: unknown[]): boolean {
  try {
    localStorage.setItem(INQUIRIES_KEY, JSON.stringify(rows));
    return localStorage.getItem(INQUIRIES_KEY) !== null;
  } catch {
    return false;
  }
}

/** Saves a new request at the top of the list, keeping every existing one. Returns false when nothing could be saved. */
export function addInquiry(input: Pick<SetupInquiry, "name" | "phone" | "note">): boolean {
  try {
    const row: SetupInquiry = {
      ...input,
      at: new Date().toISOString(),
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: "new",
    };
    return write([row, ...readRaw()]);
  } catch {
    return false;
  }
}

/** Changes the status and/or internal notes of one request, leaving every other row and field as saved. */
export function updateInquiry(id: string, patch: Partial<Pick<SetupInquiry, "status" | "adminNotes">>): boolean {
  try {
    const rows = readRaw();
    if (!rows.some((row) => isInquiry(row) && inquiryId(row) === id)) return false;
    return write(rows.map((row) => (isInquiry(row) && inquiryId(row) === id ? { ...row, ...patch } : row)));
  } catch {
    return false;
  }
}

/** Western digits for phone checks: Arabic-Indic and Persian digits are accepted when typing. */
export function westernDigits(value: string) {
  return value.replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/[\u06f0-\u06f9]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}
