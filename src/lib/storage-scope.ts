import { useEffect } from "react";
import { useCustomer } from "@/lib/customer";

// The cart and the favourites belong to whoever is signed in: each account keeps its own list in this browser,
// and a signed-out visitor has a separate guest list. Signing out therefore shows an empty cart and favourites,
// and signing in again brings that account's lists back. The mobile number is the account key (it cannot be edited).
const LAST_SCOPE_KEY = "alsaif-last-scope";
export const GUEST = "guest";

export const scopedKey = (base: string, scope: string) => (scope === GUEST ? base : `${base}:${scope}`);

/** "guest" or the signed-in mobile number. Until the server says who is signed in, the last known owner is used so a refresh does not flash the wrong lists. */
export function useStorageScope(): string {
  const { customer, ready } = useCustomer();
  let last = GUEST;
  try {
    last = localStorage.getItem(LAST_SCOPE_KEY) || GUEST;
  } catch {
    // Storage unavailable: start as a guest.
  }
  const scope = ready ? (customer?.phone ?? GUEST) : last;
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(LAST_SCOPE_KEY, scope);
    } catch {
      // Ignore: the lists then follow the sign-in state only.
    }
  }, [ready, scope]);
  return scope;
}
