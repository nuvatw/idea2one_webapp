"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  checkInParticipant,
  undoCheckIn,
} from "@/lib/actions/attendance";
import type { ParticipantWithAttendanceStatus } from "@/lib/dal/attendance";
import NumberPad from "@/components/shared/NumberPad";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

interface CheckInPanelProps {
  participants: ParticipantWithAttendanceStatus[];
}

type ViewTab = "not_checked_in" | "checked_in";

/**
 * CheckInPanel — full rewrite with dashboard, list, search, and number pad.
 * A5: dashboard stats + list + search + number pad + quick status update.
 */
export default function CheckInPanel({ participants }: CheckInPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<ViewTab>("not_checked_in");
  const [search, setSearch] = useState("");
  const [showNumberPad, setShowNumberPad] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [confirmTarget, setConfirmTarget] =
    useState<ParticipantWithAttendanceStatus | null>(null);

  const checkedIn = useMemo(
    () => participants.filter((p) => p.is_checked_in),
    [participants]
  );
  const notCheckedIn = useMemo(
    () => participants.filter((p) => !p.is_checked_in),
    [participants]
  );

  const currentList = tab === "checked_in" ? checkedIn : notCheckedIn;

  const filteredList = useMemo(() => {
    if (!search.trim()) return currentList;
    const s = search.trim().toLowerCase();
    return currentList.filter(
      (p) =>
        p.participant_code.toLowerCase().includes(s) ||
        p.name.toLowerCase().includes(s)
    );
  }, [currentList, search]);

  const handleCheckIn = useCallback(
    async (code: string) => {
      setActionMessage(null);
      const formData = new FormData();
      formData.set("code", code);
      formData.set("idempotency_key", crypto.randomUUID());
      const result = await checkInParticipant(null, formData);
      if (result.success) {
        setActionMessage({
          type: "success",
          text:
            result.outcome === "already"
              ? `${result.participant?.name ?? code} 已經報到過了`
              : `${result.participant?.name ?? code} 報到成功！`,
        });
        startTransition(() => router.refresh());
      } else {
        setActionMessage({ type: "error", text: result.error ?? "報到失敗" });
      }
    },
    [router]
  );

  const handleUndoCheckIn = useCallback(
    async (participantId: string, code: string) => {
      setActionMessage(null);
      const formData = new FormData();
      formData.set("participant_id", participantId);
      formData.set("code", code);
      formData.set("idempotency_key", crypto.randomUUID());
      const result = await undoCheckIn(null, formData);
      if (result.success) {
        setActionMessage({
          type: "success",
          text: `已撤回 ${result.participant?.name ?? code} 的報到`,
        });
        startTransition(() => router.refresh());
      } else {
        setActionMessage({
          type: "error",
          text: result.error ?? "撤回報到失敗",
        });
      }
    },
    [router]
  );

  const handleConfirm = useCallback(() => {
    if (!confirmTarget) return;
    if (confirmTarget.is_checked_in) {
      handleUndoCheckIn(confirmTarget.id, confirmTarget.participant_code);
    } else {
      handleCheckIn(confirmTarget.participant_code);
    }
    setConfirmTarget(null);
  }, [confirmTarget, handleCheckIn, handleUndoCheckIn]);

  return (
    <div className="space-y-4">
      {/* Dashboard stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-success-200 bg-success-50 p-4 text-center">
          <p className="text-3xl font-extrabold text-success-700">
            {checkedIn.length}
          </p>
          <p className="text-sm text-success-600">已報到</p>
        </div>
        <div className="rounded-xl border border-warm-200 bg-warm-50 p-4 text-center">
          <p className="text-3xl font-extrabold text-warm-700">
            {notCheckedIn.length}
          </p>
          <p className="text-sm text-warm-600">未報到</p>
        </div>
      </div>

      {/* Action message — fixed to bottom */}
      {actionMessage && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[env(safe-area-inset-bottom,16px)]">
          <div
            className={`rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
              actionMessage.type === "success"
                ? "bg-success-50 text-success-700"
                : "bg-danger-50 text-danger-700"
            }`}
            role="status"
          >
            {actionMessage.text}
          </div>
        </div>
      )}

      {/* Number pad toggle + number pad */}
      <div>
        <button
          type="button"
          onClick={() => setShowNumberPad(!showNumberPad)}
          className="mb-3 w-full min-h-[44px] rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600 active:scale-[0.98]"
        >
          {showNumberPad ? "收起數字鍵盤" : "使用數字鍵盤報到"}
        </button>
        {showNumberPad && (
          <NumberPad
            onSubmit={handleCheckIn}
            submitLabel="報到"
            disabled={isPending}
          />
        )}
      </div>

      {/* Tab toggle */}
      <div className="flex rounded-xl border border-warm-200 bg-warm-50 p-0.5">
        <button
          type="button"
          onClick={() => setTab("not_checked_in")}
          className={`min-h-[44px] flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            tab === "not_checked_in"
              ? "bg-surface-raised text-warm-800 shadow-xs"
              : "text-warm-500 hover:text-warm-700"
          }`}
        >
          尚未報到（{notCheckedIn.length}）
        </button>
        <button
          type="button"
          onClick={() => setTab("checked_in")}
          className={`min-h-[44px] flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            tab === "checked_in"
              ? "bg-surface-raised text-success-600 shadow-xs"
              : "text-warm-500 hover:text-warm-700"
          }`}
        >
          已報到（{checkedIn.length}）
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="搜尋編號或姓名..."
        className="w-full min-h-[44px] rounded-xl border border-warm-200 px-3 py-2 text-base shadow-xs placeholder:text-warm-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        inputMode="numeric"
      />

      {/* Participant list */}
      <div className="max-h-[50vh] space-y-1.5 overflow-y-auto">
        {filteredList.length === 0 ? (
          <p className="py-6 text-center text-sm text-warm-500">
            {search ? "找不到符合條件的學員" : "目前沒有學員"}
          </p>
        ) : (
          filteredList.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setConfirmTarget(p)}
              disabled={isPending}
              className={`flex min-h-[44px] w-full items-center justify-between rounded-xl border p-3 text-left transition-all disabled:opacity-50 ${
                p.is_checked_in
                  ? "border-success-100 bg-success-50 hover:bg-success-100"
                  : "border-warm-200 bg-surface-raised hover:bg-warm-50"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-warm-800">
                    {p.participant_code}
                  </span>
                  <span className="text-sm text-warm-600">{p.name}</span>
                </div>
                <span className="text-xs text-warm-400">{p.diet_type}</span>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  p.is_checked_in
                    ? "bg-success-100 text-success-700"
                    : "bg-warm-100 text-warm-500"
                }`}
              >
                {p.is_checked_in ? "已報到" : "未報到"}
              </span>
            </button>
          ))
        )}
      </div>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={!!confirmTarget}
        title={
          confirmTarget?.is_checked_in ? "撤回報到" : "確認報到"
        }
        message={
          confirmTarget?.is_checked_in
            ? `確定要撤回 ${confirmTarget?.name}（${confirmTarget?.participant_code}）的報到嗎？`
            : `確定要幫 ${confirmTarget?.name}（${confirmTarget?.participant_code}）報到嗎？`
        }
        confirmLabel={confirmTarget?.is_checked_in ? "撤回報到" : "確認報到"}
        variant={confirmTarget?.is_checked_in ? "danger" : "default"}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
