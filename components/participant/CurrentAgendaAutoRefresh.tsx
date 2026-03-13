"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AGENDA_REFRESH_INTERVAL_MS } from "@/lib/constants";

/**
 * Client leaf that auto-refreshes the page data:
 * - Every 30 seconds when page is visible
 * - On window focus regain
 * Pauses polling when page is hidden to avoid wasting requests.
 */
export default function CurrentAgendaAutoRefresh() {
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    // Start polling
    function startPolling() {
      stopPolling();
      intervalRef.current = setInterval(refresh, AGENDA_REFRESH_INTERVAL_MS);
    }

    function stopPolling() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Handle visibility change — pause when hidden, resume when visible
    function handleVisibilityChange() {
      if (document.hidden) {
        stopPolling();
      } else {
        refresh(); // Refresh immediately when becoming visible
        startPolling();
      }
    }

    // Handle focus regain
    function handleFocus() {
      refresh();
    }

    // Initial start
    startPolling();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refresh]);

  // This component renders nothing — it's a behavior-only leaf
  return null;
}
