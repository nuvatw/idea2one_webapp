"use client";

import { useRef, useEffect } from "react";
import type { StaffAgendaItemDTO } from "@/types/dto";

interface StaffAgendaPanelProps {
  assignments: StaffAgendaItemDTO[];
}

/**
 * Displays personalized work agenda in a left-right list layout.
 * Left: time/stage info. Right: duty details.
 * Current task is highlighted and auto-scrolled into view.
 */
export default function StaffAgendaPanel({ assignments }: StaffAgendaPanelProps) {
  const currentRef = useRef<HTMLDivElement>(null);

  // Scroll current task into view on mount
  useEffect(() => {
    if (currentRef.current) {
      currentRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  if (assignments.length === 0) {
    return (
      <div className="rounded-xl border border-warm-200 bg-warm-50 p-4 shadow-xs">
        <p className="text-sm text-warm-500">目前沒有指派的工作任務</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-warm-800">我的工作任務</h3>

      <div className="space-y-2">
        {assignments.map((a) => (
          <div
            key={a.id}
            ref={a.is_current ? currentRef : undefined}
            className={`flex gap-3 rounded-xl border p-3 transition-all ${
              a.is_current
                ? "border-primary-200 bg-primary-50 shadow-sm"
                : "border-warm-200 bg-surface-raised"
            }`}
          >
            {/* Left: time + stage */}
            <div className="w-36 shrink-0 border-r border-warm-100 pr-3">
              <div className="flex items-center gap-1.5">
                {a.is_current && (
                  <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-primary-500 animate-live" />
                )}
                <span
                  className={`text-sm font-medium whitespace-nowrap ${
                    a.is_current ? "text-primary-600" : "text-warm-500"
                  }`}
                >
                  {a.time_label}
                </span>
              </div>
              <p
                className={`mt-1 text-xs ${
                  a.is_current ? "text-primary-500" : "text-warm-400"
                }`}
              >
                {a.stage_name}
              </p>
            </div>

            {/* Right: task + duty */}
            <div className="min-w-0 flex-1 space-y-1">
              {a.duty_label && (
                <p
                  className={`text-sm whitespace-pre-line ${
                    a.is_current ? "text-primary-700 font-medium" : "text-warm-700"
                  }`}
                >
                  {a.duty_label}
                </p>
              )}
              {a.location && (
                <p className="text-xs text-warm-500">
                  <span className="font-medium">位置：</span>
                  {a.location}
                </p>
              )}
              {a.incident_note_markdown && (
                <p className="rounded-lg border-l-4 border-accent-400 bg-accent-50 p-2 text-xs text-accent-600">
                  {a.incident_note_markdown}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
