"use client";

import { useState, useActionState, useCallback, useTransition } from "react";
import {
  updateAgendaItem,
  type UpdateAgendaItemResult,
} from "@/lib/actions/agenda";
import type { AgendaItemSummary } from "@/types/dto";
import Spinner from "@/components/shared/Spinner";

interface AgendaItemEditCardProps {
  item: AgendaItemSummary;
}

/** Parse time_label like "09:30–09:50" into { start, end }. */
function parseTimeLabel(label: string): { start: string; end: string } {
  // Handle en-dash, em-dash, hyphen
  const parts = label.split(/[–—-]/);
  return {
    start: parts[0]?.trim() ?? "",
    end: parts[1]?.trim() ?? "",
  };
}

export default function AgendaItemEditCard({ item }: AgendaItemEditCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { start, end } = parseTimeLabel(item.time_label);

  const [state, formAction, isPending] = useActionState<
    UpdateAgendaItemResult | null,
    FormData
  >(updateAgendaItem, null);

  const [, startTransition] = useTransition();

  const handleSubmit = useCallback(
    (formData: FormData) => {
      startTransition(() => {
        formAction(formData);
      });
    },
    [formAction, startTransition]
  );

  return (
    <div className="rounded-xl border border-warm-200 bg-surface-raised shadow-xs">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex min-h-[44px] w-full items-center justify-between gap-2 p-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <span className="text-xs text-warm-500">{item.time_label}</span>
          <p className="text-sm font-medium text-warm-800">
            {item.stage_name}
          </p>
        </div>
        <svg
          className={`h-4 w-4 shrink-0 text-warm-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Edit form — collapsible */}
      {isOpen && (
        <form action={handleSubmit} className="border-t border-warm-100 p-3">
          <input type="hidden" name="agendaItemId" value={item.id} />

          {state?.error && (
            <div
              className="mb-3 rounded-xl bg-danger-50 p-2.5 text-sm text-danger-600"
              role="alert"
            >
              {state.error}
            </div>
          )}
          {state?.success && (
            <div
              className="mb-3 rounded-xl bg-success-50 p-2.5 text-sm text-success-600"
              role="status"
            >
              已儲存
            </div>
          )}

          {/* Time row */}
          <div className="mb-3 flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-warm-600">
                開始時間
              </label>
              <input
                type="text"
                name="start_time"
                defaultValue={start}
                placeholder="09:30"
                disabled={isPending}
                className="min-h-[40px] w-full rounded-lg border border-warm-200 px-2.5 py-1.5 text-sm shadow-xs focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-warm-50 disabled:text-warm-400"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-warm-600">
                結束時間
              </label>
              <input
                type="text"
                name="end_time"
                defaultValue={end}
                placeholder="10:00"
                disabled={isPending}
                className="min-h-[40px] w-full rounded-lg border border-warm-200 px-2.5 py-1.5 text-sm shadow-xs focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-warm-50 disabled:text-warm-400"
              />
            </div>
          </div>

          {/* Stage name */}
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-warm-600">
              主旨
            </label>
            <input
              type="text"
              name="stage_name"
              defaultValue={item.stage_name}
              disabled={isPending}
              className="min-h-[40px] w-full rounded-lg border border-warm-200 px-2.5 py-1.5 text-sm shadow-xs focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-warm-50 disabled:text-warm-400"
            />
          </div>

          {/* Description */}
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-warm-600">
              內文（支援 Markdown）
            </label>
            <textarea
              name="description_markdown"
              defaultValue={item.description_markdown ?? ""}
              rows={3}
              disabled={isPending}
              className="w-full rounded-lg border border-warm-200 px-2.5 py-1.5 text-sm shadow-xs focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-warm-50 disabled:text-warm-400"
            />
          </div>

          {/* Save button */}
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:bg-warm-300 disabled:cursor-not-allowed"
          >
            {isPending && <Spinner className="h-4 w-4" />}
            {isPending ? "儲存中…" : "儲存"}
          </button>
        </form>
      )}
    </div>
  );
}
