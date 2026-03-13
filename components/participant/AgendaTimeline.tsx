"use client";

import { useState } from "react";
import type { AgendaItemSummary } from "@/types/dto";
import MarkdownRenderer from "@/lib/markdown/renderer";

interface AgendaTimelineProps {
  items: AgendaItemSummary[];
  currentAgendaId?: string;
}

export default function AgendaTimeline({
  items,
  currentAgendaId,
}: AgendaTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    currentAgendaId ?? null,
  );

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-warm-200 bg-warm-50 p-6 text-center">
        <p className="text-sm text-warm-500">活動資訊尚未準備完成</p>
      </div>
    );
  }

  const currentIndex = items.findIndex((item) => item.id === currentAgendaId);

  return (
    <div className="relative">
      {items.map((item, index) => {
        const isCurrent = item.id === currentAgendaId;
        const isPast = currentIndex >= 0 && index < currentIndex;
        const isExpanded = expandedId === item.id;
        const isLast = index === items.length - 1;

        return (
          <div key={item.id} className="relative flex gap-4">
            {/* Timeline column */}
            <div className="flex flex-col items-center">
              {/* Dot */}
              <div
                className={`relative z-10 flex items-center justify-center rounded-full transition-all ${
                  isCurrent
                    ? "h-6 w-6 bg-primary-500 shadow-md shadow-primary-500/30"
                    : isPast
                      ? "h-4 w-4 bg-primary-400"
                      : "h-4 w-4 border-2 border-warm-300 bg-surface-raised"
                }`}
              >
                {isCurrent && (
                  <span className="absolute inset-0 rounded-full bg-primary-500 opacity-30 animate-live" />
                )}
                {isPast && (
                  <svg
                    className="h-2.5 w-2.5 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              {/* Connecting line */}
              {!isLast && (
                <div
                  className={`w-0.5 flex-1 ${
                    isPast || isCurrent ? "bg-primary-200" : "bg-warm-200"
                  }`}
                />
              )}
            </div>

            {/* Content card */}
            <div className={`flex-1 ${isLast ? "" : "pb-4"}`}>
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className={`w-full rounded-2xl border p-4 text-left transition-all ${
                  isCurrent
                    ? "border-primary-200 bg-primary-50 shadow-sm"
                    : isPast
                      ? "border-warm-100 bg-surface-raised opacity-70"
                      : "border-warm-100 bg-surface-raised hover:border-warm-200 hover:shadow-xs"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p
                      className={`text-xs font-medium ${
                        isCurrent ? "text-primary-600" : "text-warm-400"
                      }`}
                    >
                      {item.time_label}
                    </p>
                    <h3
                      className={`mt-0.5 text-base font-bold ${
                        isCurrent
                          ? "text-primary-700"
                          : isPast
                            ? "text-warm-500"
                            : "text-warm-800"
                      }`}
                    >
                      {item.stage_name}
                    </h3>
                  </div>
                  {isCurrent && (
                    <span className="flex-shrink-0 rounded-full bg-primary-500 px-2.5 py-1 text-[10px] font-bold text-white">
                      進行中
                    </span>
                  )}
                </div>

                {isExpanded &&
                  (item.description_markdown || item.notice_markdown) && (
                    <div className="mt-3 border-t border-warm-100 pt-3">
                      {item.description_markdown && (
                        <div className="text-sm text-warm-600">
                          <MarkdownRenderer
                            content={item.description_markdown}
                          />
                        </div>
                      )}
                      {item.notice_markdown && (
                        <div className="mt-2 rounded-xl border-l-4 border-accent-400 bg-accent-50 p-3 text-sm text-accent-600">
                          <MarkdownRenderer content={item.notice_markdown} />
                        </div>
                      )}
                    </div>
                  )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
