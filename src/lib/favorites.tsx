import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { GUEST, scopedKey, useStorageScope } from "@/lib/storage-scope";

const STORAGE_KEY = "alsaif-favorites";

type FavoritesApi = {
  ids: string[];
  count: number;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
};

const FavoritesContext = createContext<FavoritesApi | null>(null);

function read(scope: string): string[] {
  try {
    const raw = localStorage.getItem(scopedKey(STORAGE_KEY, scope));
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((id): id is string => typeof id === "string"))];
  } catch {
    return [];
  }
}

function write(scope: string, ids: string[]) {
  try {
    localStorage.setItem(scopedKey(STORAGE_KEY, scope), JSON.stringify(ids));
  } catch {
    // Storage can be unavailable (private mode); favorites then last for the session only.
  }
}

/** The account's own favourites plus whatever was saved while signed out, which moves into the account when someone signs in. */
function load(scope: string): string[] {
  const own = read(scope);
  if (scope === GUEST) return own;
  const guest = read(GUEST);
  if (!guest.length) return own;
  const merged = [...new Set([...own, ...guest])];
  write(scope, merged);
  write(GUEST, []);
  return merged;
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const scope = useStorageScope();
  const [loadedScope, setLoadedScope] = useState(scope);
  const [ids, setIds] = useState<string[]>(() => load(scope));

  // Signing in or out swaps the list for the one that belongs to the new owner.
  if (loadedScope !== scope) {
    setLoadedScope(scope);
    setIds(load(scope));
  }

  useEffect(() => {
    if (loadedScope === scope) write(scope, ids);
  }, [ids, scope, loadedScope]);

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
