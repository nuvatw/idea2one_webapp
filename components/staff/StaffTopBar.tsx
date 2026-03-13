import { staffLogout } from "@/lib/actions/staff-auth";

interface StaffTopBarProps {
  staffName: string;
}

/**
 * Staff top bar showing identity, switch/logout, last sync time.
 */
export default function StaffTopBar({ staffName }: StaffTopBarProps) {
  return (
    <div className="sticky top-0 z-10 border-b border-warm-200 bg-surface-raised/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-screen-lg items-center justify-between px-4 py-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-warm-800">努努後台</h1>
          <p className="text-xs text-warm-500">{staffName}</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/home"
            className="inline-flex items-center justify-center min-h-[44px] rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-600 shadow-xs transition-colors hover:bg-primary-100 hover:text-primary-700"
          >
            查看法法模式
          </a>
          <a
            href="/staff/select"
            className="inline-flex items-center justify-center min-h-[44px] rounded-xl border border-warm-200 bg-surface-raised px-3 py-2 text-sm text-warm-600 shadow-xs transition-colors hover:bg-warm-50 hover:text-warm-800"
          >
            切換身份
          </a>
          <form action={staffLogout}>
            <button
              type="submit"
              className="min-h-[44px] rounded-xl border border-warm-200 bg-surface-raised px-3 py-2 text-sm text-warm-600 shadow-xs transition-colors hover:bg-warm-50 hover:text-warm-800"
            >
              登出
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

