"use client";

import { useRouter, usePathname } from "next/navigation";
import type { DashboardStats } from "@/types/dto";

interface StaffDashboardStatGridProps {
  stats: DashboardStats;
}

interface StatCardProps {
  label: string;
  value: number;
  variant: "filled" | "outlined";
  onClick: () => void;
}

function StatCard({ label, value, variant, onClick }: StatCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl p-5 text-left transition-all active:scale-[0.97] ${
        variant === "filled"
          ? "bg-primary-600 text-white shadow-md hover:bg-primary-700"
          : "border border-warm-200 bg-surface-raised text-warm-800 shadow-xs hover:border-warm-300 hover:shadow-sm"
      }`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-wider ${
          variant === "filled" ? "text-primary-100" : "text-warm-400"
        }`}
      >
        {label}
      </p>
      <p className="mt-1.5 text-3xl font-extrabold tracking-tight">{value}</p>
    </button>
  );
}

/**
 * StaffDashboardStatGrid — 分成三個 section：報到、便當、問題
 */
export default function StaffDashboardStatGrid({
  stats,
}: StaffDashboardStatGridProps) {
  const router = useRouter();
  const pathname = usePathname();

  const goToTab = (tab: string) => {
    router.push(`${pathname}?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      {/* 報到 */}
      <section>
        <h3 className="mb-3 text-lg font-bold tracking-tight text-warm-800">
          報到
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="已報到"
            value={stats.checked_in_count}
            variant="filled"
            onClick={() => goToTab("attendance")}
          />
          <StatCard
            label="未報到"
            value={stats.not_checked_in_count}
            variant="outlined"
            onClick={() => goToTab("attendance")}
          />
        </div>
      </section>

      {/* 便當 */}
      <section>
        <h3 className="mb-3 text-lg font-bold tracking-tight text-warm-800">
          便當
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="已領午餐"
            value={stats.lunch_picked_up_count}
            variant="filled"
            onClick={() => goToTab("lunch")}
          />
          <StatCard
            label="未領午餐"
            value={stats.lunch_not_picked_up_count}
            variant="outlined"
            onClick={() => goToTab("lunch")}
          />
        </div>
      </section>

      {/* 問題 */}
      <section>
        <h3 className="mb-3 text-lg font-bold tracking-tight text-warm-800">
          問題
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="問題總數"
            value={stats.total_questions}
            variant="filled"
            onClick={() => goToTab("qna")}
          />
          <StatCard
            label="待回答"
            value={stats.pending_questions}
            variant="outlined"
            onClick={() => goToTab("qna")}
          />
        </div>
      </section>
    </div>
  );
}
