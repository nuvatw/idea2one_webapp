"use client";

import { useEffect, useState } from "react";

interface StaleBannerProps {
  /** How long (ms) before data is considered stale. Default 60000 (60s). */
  staleAfterMs?: number;
  /** The lastSyncedAt ISO timestamp from SSR or latest refresh. */
  lastSyncedAt: string;
}

/**
 * Displays a sticky banner when data is stale:
 * 「資料可能不是最新，請重新整理」
 * Per Spec: shown when front-end detects prolonged time without sync.
 *
 * Uses key-based reset: parent passes lastSyncedAt; when it changes,
 * React remounts via key in StaleChecker, resetting isStale to false.
 */
export default function StaleBanner({
  staleAfterMs = 60_000,
  lastSyncedAt,
}: StaleBannerProps) {
  // key reset: when lastSyncedAt changes, StaleChecker remounts with fresh state
  return (
    <StaleChecker
      key={lastSyncedAt}
      staleAfterMs={staleAfterMs}
      lastSyncedAt={lastSyncedAt}
    />
  );
}

function StaleChecker({
  staleAfterMs,
  lastSyncedAt,
}: {
  staleAfterMs: number;
  lastSyncedAt: string;
}) {
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    const syncTime = new Date(lastSyncedAt).getTime();

    const checkStale = () => {
      const now = performance.timeOrigin + performance.now();
      if (now - syncTime > staleAfterMs) {
        setIsStale(true);
      }
    };

    const id = setInterval(checkStale, 10_000);
    return () => clearInterval(id);
  }, [lastSyncedAt, staleAfterMs]);

  if (!isStale) return null;

  return (
    <div
      className="sticky top-0 z-20 border-b border-accent-200 bg-accent-50 px-4 py-2 text-center"
      role="status"
      aria-live="polite"
    >
      <span className="text-sm text-accent-600">
        資料可能不是最新，請重新整理
      </span>
      <button
        onClick={() => window.location.reload()}
        className="ml-3 rounded-lg bg-accent-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-accent-600"
      >
        重新整理
      </button>
    </div>
  );
}
