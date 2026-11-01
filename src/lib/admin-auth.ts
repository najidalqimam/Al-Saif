import { ApiError, api } from "@/lib/api";

// Dashboard sign-in through the backend API. The server checks the password and keeps the session in an
// httpOnly cookie, so nothing secret is stored in the browser or built into the site.

export type AdminRole = "OWNER" | "MANAGER" | "EDITOR" | "SUPPORT";
export type AdminUser = { email: string; fullName: string; role: AdminRole };

export const ROLE_LABELS: Record<AdminRole, string> = {
  OWNER: "مالك المتجر",
  MANAGER: "مدير المتجر",
  EDITOR: "محرر المنتجات",
  SUPPORT: "خدمة العملاء",
};

/** The signed-in admin, or null when there is no valid session. Network problems are thrown. */
export async function currentAdmin(signal?: AbortSignal) {
  try {
    return (await api<{ admin: AdminUser }>("/admin/auth/me", { signal })).admin;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export async function loginAdmin(email: string, password: string) {
  return (await api<{ admin: AdminUser }>("/admin/auth/login", { body: { email: email.trim(), password } })).admin;
}

export async function logoutAdmin() {
  try {
    await api("/admin/auth/logout", { body: {} });
  } catch {
    // Already signed out or the server is unreachable; the dashboard leaves either way.
  }
}
