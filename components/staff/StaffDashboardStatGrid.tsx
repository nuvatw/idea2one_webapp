"use client";

import { useRouter, usePathname } from "next/navigation";
import type { DashboardStats } from "@/types/dto";

interface StaffDashboardStatGridProps {
  stats: DashboardStats;
}

interface StatCardProps {
  label: string;
  value: number;
  color: "green" | "red" | "blue" | "amber";
  onClick: () => void;
}

function StatCard({ label, value, color, onClick }: StatCardProps) {
  const colorMap = {
    green: "border-success-100 bg-success-50 text-success-600 hover:border-success-300",
    red: "border-danger-100 bg-danger-50 text-danger-500 hover:border-danger-300",
    blue: "border-primary-100 bg-primary-50 text-primary-600 hover:border-primary-300",
    amber: "border-accent-100 bg-accent-50 text-accent-500 hover:border-accent-300",
  };

  const valueColorMap = {
    green: "text-success-700",
    red: "text-danger-600",
    blue: "text-primary-700",
    amber: "text-accent-600",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 shadow-xs text-left transition-all active:scale-[0.97] ${colorMap[color]}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide opacity-75">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${valueColorMap[color]}`}>
        {value}
      </p>
    </button>
  );
}

/**
 * StaffDashboardStatGrid — 顯示六項指標（可點擊跳轉對應 tab）
 * Per spec: 已報到/未報到/已領午餐/未領午餐/問題總數/待回答數
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <StatCard label="已報到" value={stats.checked_in_count} color="green" onClick={() => goToTab("attendance")} />
      <StatCard label="未報到" value={stats.not_checked_in_count} color="red" onClick={() => goToTab("attendance")} />
      <StatCard label="已領午餐" value={stats.lunch_picked_up_count} color="green" onClick={() => goToTab("lunch")} />
      <StatCard label="未領午餐" value={stats.lunch_not_picked_up_count} color="amber" onClick={() => goToTab("lunch")} />
      <StatCard label="問題總數" value={stats.total_questions} color="blue" onClick={() => goToTab("qna")} />
      <StatCard label="待回答" value={stats.pending_questions} color="red" onClick={() => goToTab("qna")} />
    </div>
  );
}
