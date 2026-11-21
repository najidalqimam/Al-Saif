import { useEffect, useRef } from "react";

// Lets one open tab tell the others that something was saved, so the dashboard shows it without a reload.
const CHANNEL = "alsaif-live";

/** Call after a successful save. `topic` says what changed (for example "customers"). */
export function announceChange(topic: string) {
  try {
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage(topic);
    channel.close();
  } catch {
    // No BroadcastChannel: listeners still refresh when the tab regains focus and on their timer.
  }
}

/** Runs `refresh` when another tab announces `topic`, when this tab comes back into view, and every 20 s while visible. */
export function useLiveRefresh(topic: string, refresh: () => void) {
  const latest = useRef(refresh);
  latest.current = refresh;
  useEffect(() => {
    const run = () => latest.current();
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(CHANNEL);
      channel.onmessage = (event) => {
        if (event.data === topic) run();
      };
    } catch {
      // Falls back to focus and timer refreshes below.
    }
    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };
    const timer = window.setInterval(onVisible, 20_000);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", run);
    return () => {
      channel?.close();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", run);
    };
  }, [topic]);
}
