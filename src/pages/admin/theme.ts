import { useEffect, useState } from "react";

// The dashboard has its own light/dark choice, separate from the storefront theme, and starts light.
const STORAGE_KEY = "alsaif-admin-theme";

export type AdminTheme = "light" | "dark";

function read(): AdminTheme {
  try {
    return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

/** Sets data-admin-theme on <html> so drawers rendered in portals pick up the same tokens. */
export function useAdminTheme() {
  const [theme, setTheme] = useState<AdminTheme>(read);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.adminTheme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage can be blocked; the choice still holds for this visit.
    }
    return () => {
      delete root.dataset.adminTheme;
    };
  }, [theme]);

  return [theme, setTheme] as const;
}
