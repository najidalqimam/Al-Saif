import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { PREVIEW } from "@/lib/api";
import { loadNotifications, markNotificationsRead, useNotifications, type NotificationItem } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import { pushHash } from "./nav";
import { AR_DATE } from "./ui";

const when = (iso: string) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `قبل ${minutes} دقيقة`;
  if (minutes < 60 * 24) return `قبل ${Math.round(minutes / 60)} ساعة`;
  return new Date(iso).toLocaleDateString(AR_DATE, { day: "numeric", month: "short" });
};

/** The bell in the dashboard's top bar (admin and shop alike: the API answers with the caller's own messages). */
export function NotificationBell() {
  const { items, unread } = useNotifications();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (event: MouseEvent) => {
      if (box.current && !box.current.contains(event.target as Node)) setOpen(false);
    };
    const key = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  const markRead = markNotificationsRead;

  function openItem(item: NotificationItem) {
    setOpen(false);
    if (!item.read) void markRead({ ids: [item.id] });
    const [view, ...rest] = item.link.split("/");
    if (view) pushHash(view as Parameters<typeof pushHash>[0], rest.join("/") || undefined);
  }

  if (PREVIEW) return null;
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) loadNotifications(true);
        }}
        aria-label={unread ? `الإشعارات (${unread} جديد)` : "الإشعارات"}
        aria-expanded={open}
        className="relative grid size-10 place-items-center rounded-xl border border-(--a-line) bg-(--a-surface) text-(--a-muted) hover:text-(--a-text)"
      >
        <Bell className="size-4" />
        {unread > 0 ? <span className="absolute -end-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-(--a-danger) px-1 text-[11px] font-semibold text-white">{unread > 99 ? "99+" : unread}</span> : null}
      </button>
      {open ? (
        <div role="dialog" aria-label="الإشعارات" className="absolute end-0 top-12 z-50 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-(--a-line) bg-(--a-surface) shadow-[0_18px_48px_rgba(11,18,32,0.18)]">
          <div className="flex items-center justify-between border-b border-(--a-line) px-4 py-3">
            <p className="font-semibold">الإشعارات</p>
            {unread > 0 ? (
              <button type="button" onClick={() => void markRead({ all: true })} className="inline-flex cursor-pointer items-center gap-1 text-xs text-(--a-muted) hover:text-(--a-text)">
                <CheckCheck className="size-3.5" />
                تعليم الكل كمقروء
              </button>
            ) : null}
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-(--a-muted)">ما فيه إشعارات لسه.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-(--a-line) overflow-y-auto">
              {items.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => openItem(item)} className={cn("flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-start transition hover:bg-(--a-surface-2)", !item.read && "bg-[#2563eb]/8")}>
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", item.read ? "bg-transparent" : "bg-(--a-accent)")} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{item.title}</span>
                      {item.body ? <span className="mt-0.5 block text-xs leading-5 text-(--a-muted)">{item.body}</span> : null}
                      <span className="mt-1 block text-[11px] text-(--a-muted)">{when(item.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
