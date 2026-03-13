/**
 * StatusBadge — displays status with text + icon, NOT color-only.
 * Per Spec: pending/answered, claimed/not_claimed must include icon + text.
 */

type BadgeVariant =
  | "pending"
  | "answered"
  | "claimed"
  | "not_claimed"
  | "checked_in"
  | "not_checked_in"
  | "current";

interface StatusBadgeProps {
  variant: BadgeVariant;
  className?: string;
}

const CONFIG: Record<
  BadgeVariant,
  { label: string; bgClass: string; icon: string }
> = {
  pending: {
    label: "待回答",
    bgClass: "bg-accent-100 text-accent-600",
    icon: "⏳",
  },
  answered: {
    label: "已回答",
    bgClass: "bg-success-100 text-success-700",
    icon: "✓",
  },
  claimed: {
    label: "已領取",
    bgClass: "bg-success-100 text-success-700",
    icon: "✓",
  },
  not_claimed: {
    label: "未領取",
    bgClass: "bg-warm-100 text-warm-600",
    icon: "—",
  },
  checked_in: {
    label: "已報到",
    bgClass: "bg-success-100 text-success-700",
    icon: "✓",
  },
  not_checked_in: {
    label: "未報到",
    bgClass: "bg-warm-100 text-warm-600",
    icon: "—",
  },
  current: {
    label: "進行中",
    bgClass: "bg-primary-500 text-white",
    icon: "▶",
  },
};

export default function StatusBadge({ variant, className = "" }: StatusBadgeProps) {
  const config = CONFIG[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.bgClass} ${className}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      {config.label}
    </span>
  );
}
