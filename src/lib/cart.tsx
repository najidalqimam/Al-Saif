import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

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
};

const CartContext = createContext<CartApi | null>(null);

function load(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(load);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

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
    };
  }, [lines, open]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("CartProvider is missing");
  return value;
}
