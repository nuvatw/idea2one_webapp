"use client";

import { useCallback } from "react";

export interface QAFilterState {
  q: string;
  scope: "all" | "mine";
  status: "all" | "answered";
}

interface QAFilterBarProps {
  filters: QAFilterState;
  onChange: (filters: QAFilterState) => void;
}

/**
 * Search + filter bar for Q&A page.
 * Handles keyword search, scope toggle (all/mine), and status toggle (all/pending).
 * Per Spec: input 16px min, hit area 44x44 min.
 */
export default function QAFilterBar({ filters, onChange }: QAFilterBarProps) {
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...filters, q: e.target.value });
    },
    [filters, onChange]
  );

  const handleScopeChange = useCallback(
    (scope: "all" | "mine") => {
      onChange({ ...filters, scope });
    },
    [filters, onChange]
  );

  const handleStatusChange = useCallback(
    (status: "all" | "answered") => {
      onChange({ ...filters, status });
    },
    [filters, onChange]
  );

  return (
    <div className="space-y-3">
      {/* Search input — 16px font to avoid iOS zoom */}
      <div className="relative">
        <input
          type="text"
          value={filters.q}
          onChange={handleSearchChange}
          placeholder="搜尋問題編號或關鍵字..."
          className="w-full rounded-xl border border-warm-200 bg-surface-raised px-4 py-2.5 pr-10 text-base shadow-xs placeholder:text-warm-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <svg
          className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Filter toggles — min 44px hit area */}
      <div className="flex gap-2">
        {/* Scope toggles */}
        <div className="flex rounded-xl border border-warm-200 bg-warm-50 p-0.5">
          <button
            type="button"
            onClick={() => handleScopeChange("all")}
            className={`min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filters.scope === "all"
                ? "bg-surface-raised text-warm-800 shadow-xs"
                : "text-warm-500 hover:text-warm-700"
            }`}
          >
            全部問題
          </button>
          <button
            type="button"
            onClick={() => handleScopeChange("mine")}
            className={`min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filters.scope === "mine"
                ? "bg-surface-raised text-warm-800 shadow-xs"
                : "text-warm-500 hover:text-warm-700"
            }`}
          >
            我的問題
          </button>
        </div>

        {/* Status toggles */}
        <div className="flex rounded-xl border border-warm-200 bg-warm-50 p-0.5">
          <button
            type="button"
            onClick={() => handleStatusChange("all")}
            className={`min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filters.status === "all"
                ? "bg-surface-raised text-warm-800 shadow-xs"
                : "text-warm-500 hover:text-warm-700"
            }`}
          >
            全部狀態
          </button>
          <button
            type="button"
            onClick={() => handleStatusChange("answered")}
            className={`min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filters.status === "answered"
                ? "bg-surface-raised text-success-600 shadow-xs"
                : "text-warm-500 hover:text-warm-700"
            }`}
          >
            已回答
          </button>
        </div>
      </div>
    </div>
  );
}
