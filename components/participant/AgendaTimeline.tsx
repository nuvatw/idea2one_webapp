"use client";

import { useState, useRef, useEffect } from "react";
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
    <div className="relative pl-[30px]">
      {/* Continuous vertical line behind everything */}
      <div
        className="absolute left-[11px] top-0 bottom-0 w-[2px] bg-warm-200"
        aria-hidden
      />
      {/* Filled portion of line up to and including current item */}
      {currentIndex >= 0 && (
        <div
          className="absolute left-[11px] top-0 w-[2px] bg-primary-400 transition-all duration-500"
          style={{
            /* rough: each item ~72px, current dot is at center */
            height: `calc(${currentIndex} * 72px + 12px)`,
          }}
          aria-hidden
        />
      )}

      {items.map((item, index) => {
        const isCurrent = item.id === currentAgendaId;
        const isPast = currentIndex >= 0 && index < currentIndex;
        const isExpanded = expandedId === item.id;
        const isLast = index === items.length - 1;

        return (
          <div
            key={item.id}
            className={`relative ${isLast ? "" : "mb-3"}`}
          >
            {/* Timeline dot — positioned on the vertical line */}
            <div
              className="absolute z-10"
              style={{ left: "-30px", top: "50%", transform: "translateY(-50%)" }}
              aria-hidden
            >
              {isCurrent ? (
                /* Double-ring active dot */
                <span className="relative flex h-6 w-6 items-center justify-center">
                  <span className="absolute inset-0 rounded-full border-[2.5px] border-primary-500 bg-transparent" />
                  <span className="h-2.5 w-2.5 rounded-full bg-primary-500" />
                  <span className="absolute inset-0 rounded-full border-2 border-primary-400 opacity-40 animate-live" />
                </span>
              ) : isPast ? (
                /* Filled dot for past items */
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-400">
                  <svg
                    className="h-2.5 w-2.5 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              ) : (
                /* Hollow ring for future items */
                <span className="flex h-5 w-5 items-center justify-center rounded-full border-[2.5px] border-warm-300 bg-surface" />
              )}
            </div>

            {/* Content card */}
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
              className={`
                w-full rounded-2xl p-4 text-left
                transition-all duration-300 ease-out
                ${
                  isCurrent
                    ? "bg-primary-500 shadow-lg shadow-primary-500/20 scale-[1.02] origin-left"
                    : isPast
                      ? "bg-surface-raised/70 hover:bg-surface-raised"
                      : "bg-surface-raised hover:shadow-sm"
                }
              `}
            >
              {/* Title row: title left, time right */}
              <div className="flex items-center justify-between gap-3">
                <h3
                  className={`text-base font-bold leading-snug ${
                    isCurrent
                      ? "text-white"
                      : isPast
                        ? "text-warm-400"
                        : "text-warm-800"
                  }`}
                >
                  {item.stage_name}
                </h3>
                <span
                  className={`flex-shrink-0 text-xs font-semibold tabular-nums ${
                    isCurrent
                      ? "text-white/80"
                      : isPast
                        ? "text-warm-300"
                        : "text-warm-400"
                  }`}
                >
                  {item.time_label}
                </span>
              </div>

              {/* "進行中" pill for current item */}
              {isCurrent && (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-live" />
                  進行中
                </span>
              )}

              {/* Expandable description */}
              <ExpandableContent
                expanded={isExpanded}
                isCurrent={isCurrent}
                description={item.description_markdown}
                notice={item.notice_markdown}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ── Animated expandable section ── */
function ExpandableContent({
  expanded,
  isCurrent,
  description,
  notice,
}: {
  expanded: boolean;
  isCurrent: boolean;
  description?: string | null;
  notice?: string | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      setHeight(expanded ? ref.current.scrollHeight : 0);
    }
  }, [expanded, description, notice]);

  if (!description && !notice) return null;

  return (
    <div
      className="overflow-hidden transition-[max-height,opacity] duration-300 ease-out"
      style={{
        maxHeight: expanded ? `${height}px` : "0px",
        opacity: expanded ? 1 : 0,
      }}
    >
      <div ref={ref} className="pt-3">
        <div
          className={`border-t pt-3 ${
            isCurrent ? "border-white/20" : "border-warm-100"
          }`}
        >
          {description && (
            <div
              className={`text-sm ${
                isCurrent ? "text-white/90" : "text-warm-600"
              }`}
            >
              <MarkdownRenderer content={description} />
            </div>
          )}
          {notice && (
            <div
              className={`mt-2 rounded-xl p-3 text-sm ${
                isCurrent
                  ? "border-l-4 border-white/40 bg-white/10 text-white/90"
                  : "border-l-4 border-accent-400 bg-accent-50 text-accent-600"
              }`}
            >
              <MarkdownRenderer content={notice} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
