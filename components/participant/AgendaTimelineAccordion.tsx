"use client";

import { useState, useRef, useEffect } from "react";
import type { AgendaItemSummary } from "@/types/dto";
import MarkdownRenderer from "@/lib/markdown/renderer";

interface AgendaTimelineAccordionProps {
  items: AgendaItemSummary[];
  currentAgendaId?: string;
}

/**
 * Full agenda timeline with expand/collapse per item.
 * B3: Current stage auto-scrolls into view, auto-expanded, and visually emphasized.
 */
export default function AgendaTimelineAccordion({
  items,
  currentAgendaId,
}: AgendaTimelineAccordionProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (currentAgendaId) {
      initial.add(currentAgendaId);
    }
    return initial;
  });

  const currentRef = useRef<HTMLDivElement>(null);

  // B3: Auto-scroll to current item on mount
  useEffect(() => {
    if (currentRef.current) {
      setTimeout(() => {
        currentRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 300);
    }
  }, []);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-warm-200 bg-warm-50 p-4 shadow-xs">
        <p className="text-sm text-warm-500">活動資訊尚未準備完成</p>
      </div>
    );
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const isExpanded = expandedIds.has(item.id);
        const isCurrent = item.id === currentAgendaId;

        return (
          <div
            key={item.id}
            ref={isCurrent ? currentRef : undefined}
            className={`rounded-xl border shadow-xs transition-all duration-300 ${
              isCurrent
                ? "scale-[1.02] border-primary-300 bg-primary-50 ring-2 ring-primary-300/50"
                : "border-warm-200 bg-surface-raised"
            }`}
          >
            <button
              type="button"
              onClick={() => toggleExpand(item.id)}
              className="flex w-full items-center justify-between p-3 text-left"
            >
              <div className="flex items-center gap-2">
                {isCurrent && (
                  <span className="inline-block h-2 w-2 rounded-full bg-primary-500 animate-live" />
                )}
                <span className="text-xs text-warm-500">
                  {item.time_label}
                </span>
                <span
                  className={`text-sm font-medium ${
                    isCurrent ? "text-primary-700" : "text-warm-800"
                  }`}
                >
                  {item.stage_name}
                </span>
              </div>
              <svg
                className={`h-4 w-4 text-warm-400 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isExpanded && (
              <div className="border-t border-warm-100 px-3 pb-3 pt-2">
                <p className="mb-1 text-sm font-medium text-warm-700">
                  {item.task}
                </p>
                {item.description_markdown && (
                  <div className="mb-1 text-sm text-warm-600">
                    <MarkdownRenderer content={item.description_markdown} />
                  </div>
                )}
                {item.notice_markdown && (
                  <div className="mt-2 rounded-lg border-l-4 border-accent-400 bg-accent-50 p-2 text-sm text-accent-600">
                    <span className="font-medium">注意事項：</span>
                    <MarkdownRenderer content={item.notice_markdown} />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
