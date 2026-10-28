import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "alsaif-favorites";

type FavoritesApi = {
  ids: string[];
  count: number;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
};

const FavoritesContext = createContext<FavoritesApi | null>(null);

function load(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((id): id is string => typeof id === "string"))];
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // Storage can be unavailable (private mode); favorites then last for the session only.
    }
  }, [ids]);

  const api = useMemo<FavoritesApi>(
    () => ({
      ids,
      count: ids.length,
      has: (id) => ids.includes(id),
      toggle(id) {
        setIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
      },
    }),
    [ids],
  );

  return <FavoritesContext.Provider value={api}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const api = useContext(FavoritesContext);
  if (!api) throw new Error("useFavorites must be used inside FavoritesProvider");
  return api;
}
