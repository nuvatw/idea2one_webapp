import { staffLogout } from "@/lib/actions/staff-auth";

interface StaffTopBarProps {
  staffName: string;
  lastSyncedAt: string;
}

/**
 * Staff top bar showing identity, switch/logout, last sync time.
 */
export default function StaffTopBar({ staffName, lastSyncedAt }: StaffTopBarProps) {
  return (
    <div className="sticky top-0 z-10 border-b border-warm-200 bg-surface-raised/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-screen-lg items-center justify-between px-4 py-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-warm-800">努努後台</h1>
          <p className="text-xs text-warm-500">
            {staffName} ・ 同步於{" "}
            {formatTime(lastSyncedAt)}
          </p>
        </div>
        <div className="flex gap-2">
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

function formatTime(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--:--";
  }
}
