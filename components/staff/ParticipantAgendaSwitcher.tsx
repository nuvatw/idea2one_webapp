"use client";

import { useState, useActionState, useCallback, useTransition } from "react";
import {
  setCurrentParticipantAgenda,
  type SetCurrentAgendaResult,
} from "@/lib/actions/agenda";
import type { AgendaItemSummary } from "@/types/dto";
import StatusBadge from "@/components/shared/StatusBadge";
import MutationTimeoutBanner from "@/components/shared/MutationTimeoutBanner";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Spinner from "@/components/shared/Spinner";

interface ParticipantAgendaSwitcherProps {
  items: AgendaItemSummary[];
  currentAgendaId: string | null;
}

/**
 * Staff component to switch the current active participant (FaFa) agenda stage.
 * Independent from the staff agenda switcher.
 */
export default function ParticipantAgendaSwitcher({
  items,
  currentAgendaId,
}: ParticipantAgendaSwitcherProps) {
  const [state, formAction, isPending] = useActionState<
    SetCurrentAgendaResult | null,
    FormData
  >(setCurrentParticipantAgenda, null);

  const [confirmTarget, setConfirmTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleSwitchClick = useCallback(
    (item: AgendaItemSummary) => {
      if (item.id === currentAgendaId) return;
      setConfirmTarget({ id: item.id, name: item.stage_name });
    },
    [currentAgendaId]
  );

  const [, startTransition] = useTransition();

  const handleConfirm = useCallback(() => {
    if (!confirmTarget) return;
    const formData = new FormData();
    formData.set("agendaItemId", confirmTarget.id);
    startTransition(() => {
      formAction(formData);
    });
    setConfirmTarget(null);
  }, [confirmTarget, formAction, startTransition]);

  const handleCancel = useCallback(() => {
    setConfirmTarget(null);
  }, []);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-warm-200 bg-warm-50 p-4 shadow-xs">
        <p className="text-sm text-warm-500">尚無法法 Agenda 資料</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-warm-800">
        切換法法目前階段
      </h3>

      {state?.error && (
        <div
          className="rounded-xl bg-danger-50 p-3 text-sm text-danger-600"
          role="alert"
        >
          {state.error}
        </div>
      )}

      {state?.success && (
        <div
          className="rounded-xl bg-success-50 p-3 text-sm text-success-600"
          role="status"
        >
          法法階段已切換
        </div>
      )}

      <MutationTimeoutBanner isPending={isPending} />

      <div className="space-y-1">
        {items.map((item) => {
          const isCurrent = item.id === currentAgendaId;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSwitchClick(item)}
              disabled={isPending || isCurrent}
              className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                isCurrent
                  ? "border-primary-200 bg-primary-50 shadow-xs"
                  : "border-warm-200 bg-surface-raised hover:bg-warm-50"
              } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isPending ? (
                <Spinner className="h-3 w-3 shrink-0 text-warm-400" />
              ) : (
                <div
                  className={`h-3 w-3 shrink-0 rounded-full border-2 ${
                    isCurrent
                      ? "border-primary-500 bg-primary-500 animate-live"
                      : "border-warm-300"
                  }`}
                  aria-hidden="true"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-warm-500">
                    {item.time_label}
                  </span>
                  {isCurrent && <StatusBadge variant="current" />}
                </div>
                <p
                  className={`text-sm font-medium ${
                    isCurrent ? "text-primary-700" : "text-warm-800"
                  }`}
                >
                  {item.stage_name}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!confirmTarget}
        title="切換法法階段"
        message={`確定要將法法切換到「${confirmTarget?.name ?? ""}」嗎？`}
        confirmLabel="確認切換"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}
