import { ApiError, PREVIEW, api } from "@/lib/api";
import { ALL_PERMISSIONS, permissionsOf, type Permission } from "@/lib/permissions";

// Dashboard sign-in through the backend API. The server checks the password and keeps the session in an
// httpOnly cookie, so nothing secret is stored in the browser or built into the site.

export type AdminRole = "OWNER" | "MANAGER" | "EDITOR" | "SUPPORT" | "SHOP";
export type AdminUser = { email: string; fullName: string; role: AdminRole; shopId?: string | null; permissions?: string[] };

export const ROLE_LABELS: Record<AdminRole, string> = {
  OWNER: "مالك المتجر",
  MANAGER: "مدير المتجر",
  EDITOR: "محرر المنتجات",
  SUPPORT: "خدمة العملاء",
  SHOP: "حساب محل",
};

// Local preview (no API or database): there are no real accounts. The owner is signed in by default, and signing in
// with the email of a team member added in the dashboard shows the dashboard as that member sees it. The password is
// not checked, because the preview does not store passwords. The choice lives in this tab only.
const PREVIEW_OWNER: AdminUser = { email: "preview@localhost", fullName: "معاينة محلية", role: "OWNER", permissions: ALL_PERMISSIONS };
const PREVIEW_AS_KEY = "alsaif-preview-as";
const TEAM_KEY = "alsaif-admin-team";

type PreviewMember = { email: string; fullName: string; role: AdminRole; extraPermissions?: Permission[]; isActive: boolean };
function previewMembers(): PreviewMember[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(TEAM_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as PreviewMember[]) : [];
  } catch {
    return [];
  }
}
function previewAdmin(): AdminUser {
  try {
    const email = sessionStorage.getItem(PREVIEW_AS_KEY);
    const member = email ? previewMembers().find((row) => row.email === email && row.isActive) : undefined;
    if (member) return { email: member.email, fullName: member.fullName, role: member.role, permissions: permissionsOf(member.role, member.extraPermissions ?? []) };
  } catch {
    // Session storage blocked: the owner is shown.
  }
  return PREVIEW_OWNER;
}

/** The signed-in admin, or null when there is no valid session. Network problems are thrown. */
export async function currentAdmin(signal?: AbortSignal) {
  if (PREVIEW) return previewAdmin();
  try {
    return (await api<{ admin: AdminUser }>("/admin/auth/me", { signal })).admin;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export async function loginAdmin(email: string, password: string) {
  if (PREVIEW) {
    const wanted = email.trim().toLowerCase();
    const member = previewMembers().find((row) => row.email.toLowerCase() === wanted && row.isActive);
    if (!member && wanted !== PREVIEW_OWNER.email) throw new ApiError(401, "INVALID_CREDENTIALS");
    try {
      if (member) sessionStorage.setItem(PREVIEW_AS_KEY, member.email);
      else sessionStorage.removeItem(PREVIEW_AS_KEY);
    } catch {
      // Session storage blocked: the owner is shown.
    }
    return previewAdmin();
  }
  return (await api<{ admin: AdminUser }>("/admin/auth/login", { body: { email: email.trim(), password } })).admin;
}

export async function logoutAdmin() {
  if (PREVIEW) {
    try {
      sessionStorage.removeItem(PREVIEW_AS_KEY);
    } catch {
      // Nothing to clear.
    }
    return;
  }
  try {
    await api("/admin/auth/logout", { body: {} });
  } catch {
    // Already signed out or the server is unreachable; the dashboard leaves either way.
  }
}
