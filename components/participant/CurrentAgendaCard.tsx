import type { AgendaItemSummary } from "@/types/dto";
import MarkdownRenderer from "@/lib/markdown/renderer";
import StatusBadge from "@/components/shared/StatusBadge";

interface CurrentAgendaCardProps {
  agendaItem: AgendaItemSummary | null;
  lastSyncedAt: string;
}

/**
 * Displays the current active agenda stage.
 * Core "what should I do now?" component for participants.
 */
export default function CurrentAgendaCard({
  agendaItem,
  lastSyncedAt,
}: CurrentAgendaCardProps) {
  if (!agendaItem) {
    return (
      <div className="rounded-xl border border-accent-200 bg-accent-50 p-4 shadow-xs">
        <p className="text-sm text-accent-600">
          目前階段尚未設定，請以現場公告為準
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-primary-400 bg-primary-50 p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary-500 animate-live" />
          <StatusBadge variant="current" />
        </div>
        <span className="text-xs text-warm-400">
          同步於 {formatTime(lastSyncedAt)}
        </span>
      </div>
      <p className="mb-1 text-sm text-warm-500">{agendaItem.time_label}</p>
      <h2 className="mb-2 text-lg font-bold text-warm-800">
        {agendaItem.stage_name}
      </h2>
      <p className="mb-2 text-sm font-medium text-warm-700">
        {agendaItem.task}
      </p>
      {agendaItem.description_markdown && (
        <div className="mb-2 rounded-lg bg-surface-raised p-3 text-sm text-warm-600 shadow-xs">
          <MarkdownRenderer content={agendaItem.description_markdown} />
        </div>
      )}
      {agendaItem.notice_markdown && (
        <div className="rounded-lg border-l-4 border-accent-400 bg-accent-50 p-3 text-sm text-accent-600">
          <span className="font-medium">注意事項：</span>
          <MarkdownRenderer content={agendaItem.notice_markdown} />
        </div>
      )}
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
