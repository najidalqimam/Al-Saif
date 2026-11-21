import { useEffect, useSyncExternalStore } from "react";
import { PREVIEW, api } from "@/lib/api";
import { announceChange, useLiveRefresh } from "@/lib/live-sync";

// One copy of the dashboard's notifications, shared by the bell and the sidebar counters. The API answers with the
// caller's own messages (staff, or one shop), so the same code serves both dashboards.

export type NotificationItem = { id: string; kind: string; title: string; body: string; link: string; read: boolean; createdAt: string };
type State = { items: NotificationItem[]; unread: number; unreadOrders: number; /** Order numbers whose "new order" message nobody has opened yet. */ newOrderIds: ReadonlySet<string> };

let state: State = { items: [], unread: 0, unreadOrders: 0, newOrderIds: new Set() };
let lastLoad = 0;
const listeners = new Set<() => void>();
const publish = (next: State) => {
  state = next;
  listeners.forEach((listener) => listener());
};

export function loadNotifications(force = false) {
  if (PREVIEW) return;
  // Several parts of the page ask for a refresh at the same moment: one request is enough.
  if (!force && Date.now() - lastLoad < 3000) return;
  lastLoad = Date.now();
  api<{ unread: number; unreadOrders?: number; unreadOrderLinks?: string[]; items: NotificationItem[] }>("/admin/notifications")
    .then((result) => publish({ items: result.items, unread: result.unread, unreadOrders: result.unreadOrders ?? 0, newOrderIds: new Set((result.unreadOrderLinks ?? []).map((link) => link.replace("orders/order-", ""))) }))
    .catch(() => undefined);
}

/** Marks messages as read (by id, all, or the ones that point at one dashboard page) and refreshes every counter. */
export async function markNotificationsRead(body: { ids?: string[]; all?: boolean; link?: string }) {
  await api("/admin/notifications/read", { body }).catch(() => undefined);
  announceChange("notifications");
  loadNotifications(true);
}

export function useNotifications() {
  useEffect(() => loadNotifications(true), []);
  useLiveRefresh("notifications", () => loadNotifications());
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
  );
}
