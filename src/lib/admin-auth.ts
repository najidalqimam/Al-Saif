const SESSION_KEY = "alsaif-admin-session";

export const ADMIN_USER = "alsaif";
export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? "";

export function isAdmin() {
  return sessionStorage.getItem(SESSION_KEY) === "ok";
}

export function loginAdmin(username: string, password: string) {
  const ok = username.trim() === ADMIN_USER && password === ADMIN_PASSWORD;
  if (ok) sessionStorage.setItem(SESSION_KEY, "ok");
  return ok;
}

export function logoutAdmin() {
  sessionStorage.removeItem(SESSION_KEY);
}
