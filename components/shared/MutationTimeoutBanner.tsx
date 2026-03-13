"use client";

import { useEffect, useState } from "react";

interface MutationTimeoutBannerProps {
  /** Whether a mutation is currently in progress */
  isPending: boolean;
  /** Timeout threshold in ms. Default 10000 (10s). */
  timeoutMs?: number;
  /** Called when user clicks retry */
  onRetry?: () => void;
}

/**
 * Shows a timeout warning when a mutation takes longer than 10 seconds.
 * Per Spec: 顯示「連線較慢，請先確認是否已生效」+ 重試按鈕
 */
export default function MutationTimeoutBanner({
  isPending,
  timeoutMs = 10_000,
  onRetry,
}: MutationTimeoutBannerProps) {
  // Use key reset trick: only render the inner timer when isPending
  if (!isPending) return null;

  return (
    <TimeoutDisplay timeoutMs={timeoutMs} onRetry={onRetry} />
  );
}

function TimeoutDisplay({
  timeoutMs,
  onRetry,
}: {
  timeoutMs: number;
  onRetry?: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [timeoutMs]);

  if (!visible) return null;

  return (
    <div
      className="mt-3 rounded-xl border border-accent-200 bg-accent-50 p-3 text-center"
      role="alert"
    >
      <p className="text-sm text-accent-600">
        連線較慢，請先確認是否已生效
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 rounded-lg bg-accent-500 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-600"
        >
          重試
        </button>
      )}
    </div>
  );
}
