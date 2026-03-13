"use client";

import { useActionState } from "react";
import {
  updateEventStartTime,
  type UpdateEventStartTimeResult,
} from "@/lib/actions/activity-state";
import MutationTimeoutBanner from "@/components/shared/MutationTimeoutBanner";
import Spinner from "@/components/shared/Spinner";

interface EventSettingsPanelProps {
  currentEventStartTime: string | null;
  canEdit: boolean;
}

/**
 * A9: Staff panel to view/edit the event start (check-in open) time.
 */
export default function EventSettingsPanel({
  currentEventStartTime,
  canEdit,
}: EventSettingsPanelProps) {
  const [state, formAction, isPending] = useActionState<
    UpdateEventStartTimeResult | null,
    FormData
  >(updateEventStartTime, null);

  // Format for datetime-local input (local time)
  const defaultValue = currentEventStartTime
    ? toLocalDatetimeString(currentEventStartTime)
    : "";

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-warm-800">活動設定</h3>

      <div className="rounded-xl border border-warm-200 bg-surface-raised p-4 shadow-xs">
        <label className="mb-2 block text-sm font-medium text-warm-700">
          開放報到時間
        </label>

        {state?.error && (
          <div
            className="mb-3 rounded-xl bg-danger-50 p-3 text-sm text-danger-600"
            role="alert"
          >
            {state.error}
          </div>
        )}

        {state?.success && (
          <div
            className="mb-3 rounded-xl bg-success-50 p-3 text-sm text-success-600"
            role="status"
          >
            開放時間已更新
          </div>
        )}

        <form action={formAction} className="flex gap-2">
          <input
            type="datetime-local"
            name="event_start_at"
            defaultValue={defaultValue}
            disabled={!canEdit || isPending}
            className="min-h-[44px] flex-1 rounded-xl border border-warm-200 px-3 py-2 text-base shadow-xs focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-warm-50 disabled:text-warm-400"
          />
          <button
            type="submit"
            disabled={!canEdit || isPending}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:bg-warm-300 disabled:cursor-not-allowed"
          >
            {isPending && <Spinner className="h-4 w-4" />}
            {isPending ? "儲存中…" : "儲存"}
          </button>
        </form>

        {!canEdit && (
          <p className="mt-2 text-xs text-warm-400">僅限上哲 / Lily / Asa 修改</p>
        )}

        <MutationTimeoutBanner isPending={isPending} />
      </div>
    </div>
  );
}

function toLocalDatetimeString(isoString: string): string {
  try {
    const d = new Date(isoString);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}
