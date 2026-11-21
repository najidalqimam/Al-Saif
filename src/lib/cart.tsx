import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { GUEST, scopedKey, useStorageScope } from "@/lib/storage-scope";

const STORAGE_KEY = "alsaif-cart";

export type CartLine = {
  id: string;
  qty: number;
};

type CartApi = {
  lines: CartLine[];
  count: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (id: string, amount?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartApi | null>(null);

function read(scope: string): CartLine[] {
  try {
    const raw = localStorage.getItem(scopedKey(STORAGE_KEY, scope));
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((line) => {
      if (!line || typeof line.id !== "string") return [];
      const qty = Math.floor(Number(line.qty));
      if (!Number.isFinite(qty) || qty < 1) return [];
      return [{ id: line.id, qty: Math.min(99, qty) }];
    });
  } catch {
    return [];
  }
}

function write(scope: string, lines: CartLine[]) {
  try {
    localStorage.setItem(scopedKey(STORAGE_KEY, scope), JSON.stringify(lines));
  } catch {
    // Storage can be unavailable (private mode); the cart then lasts for the session only.
  }
}

/** The account's own cart plus whatever was added while signed out, which moves into the account when someone signs in. */
function load(scope: string): CartLine[] {
  const own = read(scope);
  if (scope === GUEST) return own;
  const guest = read(GUEST);
  if (!guest.length) return own;
  const merged = guest.reduce<CartLine[]>((all, line) => {
    const found = all.find((item) => item.id === line.id);
    return found ? all.map((item) => (item === found ? { ...item, qty: Math.min(99, item.qty + line.qty) } : item)) : [...all, line];
  }, own);
  write(scope, merged);
  write(GUEST, []);
  return merged;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const scope = useStorageScope();
  const [loadedScope, setLoadedScope] = useState(scope);
  const [lines, setLines] = useState<CartLine[]>(() => load(scope));
  const [open, setOpen] = useState(false);

  // Signing in or out swaps the cart for the one that belongs to the new owner.
  if (loadedScope !== scope) {
    setLoadedScope(scope);
    setLines(load(scope));
  }

  useEffect(() => {
    if (loadedScope === scope) write(scope, lines);
  }, [lines, scope, loadedScope]);

  const api = useMemo<CartApi>(() => {
    const count = lines.reduce((sum, line) => sum + line.qty, 0);
    return {
      lines,
      count,
      open,
      setOpen,
      add(id, amount = 1) {
        const next = Math.min(99, Math.max(1, Math.floor(amount)));
        setLines((current) => {
          const found = current.find((line) => line.id === id);
          if (!found) return [...current, { id, qty: next }];
          return current.map((line) =>
            line.id === id ? { ...line, qty: Math.min(99, line.qty + next) } : line,
          );
        });
      },
      setQty(id, qty) {
        const next = Math.floor(qty);
        setLines((current) =>
          next < 1
            ? current.filter((line) => line.id !== id)
            : current.map((line) => (line.id === id ? { ...line, qty: Math.min(99, next) } : line)),
        );
      },
      remove(id) {
        setLines((current) => current.filter((line) => line.id !== id));
      },
      clear() {
        setLines([]);
      },
    };
  }, [lines, open]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("CartProvider is missing");
  return value;
}
