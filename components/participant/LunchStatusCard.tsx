import type { LunchDisplayStatus } from "@/types/dto";
import StatusBadge from "@/components/shared/StatusBadge";

interface LunchStatusCardProps {
  status: LunchDisplayStatus;
}

/**
 * Displays the participant's lunch pickup status.
 * Per Spec: status not color-only — includes icon + text badge.
 */
export default function LunchStatusCard({ status }: LunchStatusCardProps) {
  if (status === "unknown") {
    return (
      <div className="rounded-xl border border-warm-200 bg-warm-50 p-3 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-sm text-warm-600">午餐狀態</span>
          <span className="text-sm text-warm-400">午餐狀態暫時無法取得</span>
        </div>
      </div>
    );
  }

  const isClaimed = status === "claimed";

  return (
    <div
      className={`rounded-xl border p-3 shadow-xs ${
        isClaimed
          ? "border-success-100 bg-success-50"
          : "border-warm-200 bg-surface-raised"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-warm-600">午餐狀態</span>
        <StatusBadge variant={isClaimed ? "claimed" : "not_claimed"} />
      </div>
    </div>
  );
}
