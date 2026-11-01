import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, api } from "@/lib/api";

// The signed-in store customer. The session itself is an httpOnly cookie set by the API; the browser only
// keeps the profile in memory and asks the server again on every visit.

export type WelcomeEmail = { status: "PENDING" | "SENDING" | "SENT" | "FAILED"; sentAt: string | null } | null;
export type Customer = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  /** Preset avatar id (src/lib/avatars.tsx), or null for the default icon. */
  avatar: string | null;
  createdAt: string;
  welcomeEmail: WelcomeEmail;
};
export type Registration = { firstName: string; lastName: string; phone: string; email: string; password: string; locale: "ar" | "en" };

type CustomerApi = {
  customer: Customer | null;
  /** False until the first "who am I" answer, so pages don't flash the signed-out state. */
  ready: boolean;
  /** `login` is the mobile number or the email address. */
  login: (login: string, password: string) => Promise<Customer>;
  register: (input: Registration) => Promise<Customer>;
  logout: () => Promise<void>;
  setCustomer: (customer: Customer) => void;
};

const CustomerContext = createContext<CustomerApi | null>(null);

/** The API's error code, or NETWORK when the server could not be reached. */
export function errorCode(error: unknown) {
  return error instanceof ApiError ? error.code : "NETWORK";
}

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    api<{ customer: Customer }>("/account/me", { signal: controller.signal })
      .then((result) => setCustomer(result.customer))
      .catch(() => setCustomer(null))
      .finally(() => {
        if (!controller.signal.aborted) setReady(true);
      });
    return () => controller.abort();
  }, []);

  const login = useCallback(async (login: string, password: string) => {
    const value = login.trim();
    const result = await api<{ customer: Customer }>("/account/login", { body: { login: value.includes("@") ? value : value.replace(/[\s-]/g, ""), password } });
    setCustomer(result.customer);
    return result.customer;
  }, []);

  const register = useCallback(async (input: Registration) => {
    const result = await api<{ customer: Customer }>("/account/register", {
      body: { ...input, phone: input.phone.replace(/[\s-]/g, ""), firstName: input.firstName.trim(), lastName: input.lastName.trim(), email: input.email.trim() },
    });
    setCustomer(result.customer);
    return result.customer;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/account/logout", { body: {} });
    } catch {
      // Already signed out or unreachable: the browser forgets the customer either way.
    }
    setCustomer(null);
  }, []);

  const value = useMemo<CustomerApi>(() => ({ customer, ready, login, register, logout, setCustomer }), [customer, ready, login, register, logout]);
  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}

export function useCustomer() {
  const value = useContext(CustomerContext);
  if (!value) throw new Error("useCustomer must be used inside CustomerProvider");
  return value;
}
