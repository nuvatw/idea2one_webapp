"use client";

import type { QuestionSummary } from "@/types/dto";
import StatusBadge from "@/components/shared/StatusBadge";

interface QuestionListProps {
  items: QuestionSummary[];
  onOpenQuestion: (questionCode: string) => void;
  emptyMessage?: string;
}

/**
 * Card list of questions for Q&A page.
 * Each card shows question code, content preview, status, answer count.
 */
export default function QuestionList({
  items,
  onOpenQuestion,
  emptyMessage,
}: QuestionListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-warm-200 bg-warm-50 p-8 text-center shadow-xs">
        <p className="text-sm text-warm-500">
          {emptyMessage ?? "目前還沒有公開問題"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((q) => (
        <button
          key={q.id}
          type="button"
          onClick={() => onOpenQuestion(q.question_code)}
          className="min-h-[44px] w-full rounded-xl border border-warm-200 bg-surface-raised p-4 text-left shadow-xs transition-all hover:border-primary-200 hover:shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {/* Header: code + source badge */}
              <div className="mb-1.5 flex items-center gap-2">
                <span className="text-sm font-semibold text-primary-600">
                  {q.question_code}
                </span>
                {q.source === "ai_handoff" && (
                  <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                    AI 轉問
                  </span>
                )}
              </div>

              {/* Content preview */}
              <p className="line-clamp-2 text-sm text-warm-700">
                {q.content}
              </p>

              {/* Footer: participant + time */}
              <div className="mt-2 flex items-center gap-3 text-xs text-warm-400">
                <span>#{q.participant_code}</span>
                <span>{formatTime(q.created_at)}</span>
                {q.answer_count > 0 && (
                  <span>{q.answer_count} 則回覆</span>
                )}
              </div>
            </div>

            {/* Status badge with icon */}
            <StatusBadge
              variant={q.status === "answered" ? "answered" : "pending"}
              className="mt-0.5 flex-shrink-0"
            />
          </div>
        </button>
      ))}
    </div>
  );
}

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}
