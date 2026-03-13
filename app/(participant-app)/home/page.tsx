import type { Metadata } from "next";
import { requireParticipantSession } from "@/lib/dal/auth-check";
import { getAgendaWithCurrentStage } from "@/lib/dal/agenda";
import { getQuestionsList } from "@/lib/dal/questions";
import CurrentAgendaAutoRefresh from "@/components/participant/CurrentAgendaAutoRefresh";
import StaleBanner from "@/components/shared/StaleBanner";
import GreetingHeader from "@/components/participant/GreetingHeader";
import QuestionsStatusCard from "@/components/participant/QuestionsStatusCard";
import MarkdownRenderer from "@/lib/markdown/renderer";

export const metadata: Metadata = {
  title: "首頁 — nuva",
};

/**
 * /home — Participant home page
 * Shows greeting, current/next agenda section, question status.
 */
export default async function ParticipantHomePage() {
  const session = await requireParticipantSession();
  const lastSyncedAt = new Date().toISOString();

  const [{ items: agendaItems, currentAgendaItemId }, questions] =
    await Promise.all([
      getAgendaWithCurrentStage({ participantOnly: true }),
      getQuestionsList(),
    ]);

  const currentAgenda =
    agendaItems.find((item) => item.id === currentAgendaItemId) ?? null;

  const currentIndex = currentAgenda
    ? agendaItems.findIndex((item) => item.id === currentAgendaItemId)
    : -1;
  const nextAgenda =
    currentIndex >= 0 && currentIndex < agendaItems.length - 1
      ? agendaItems[currentIndex + 1]
      : null;

  return (
    <>
      <CurrentAgendaAutoRefresh />
      <StaleBanner lastSyncedAt={lastSyncedAt} />

      <main className="mx-auto max-w-screen-md px-5 pt-6">
        <h1 className="sr-only">活動首頁</h1>

        <GreetingHeader name={session.name} />

        {/* Current Stage */}
        {currentAgenda ? (
          <div className="mb-4 rounded-2xl border-2 border-primary-300 bg-primary-50 p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary-500 animate-live" />
              <span className="rounded-full bg-primary-500 px-2.5 py-0.5 text-[11px] font-bold text-white">
                進行中
              </span>
            </div>
            <p className="mb-1 text-xs font-medium text-primary-500">
              {currentAgenda.time_label}
            </p>
            <h2 className="mb-1 text-xl font-extrabold text-primary-800">
              {currentAgenda.stage_name}
            </h2>
            <p className="text-sm font-medium text-primary-600">
              {currentAgenda.task}
            </p>
            {currentAgenda.description_markdown && (
              <div className="mt-3 rounded-xl bg-white/60 p-3 text-sm text-warm-600">
                <MarkdownRenderer
                  content={currentAgenda.description_markdown}
                />
              </div>
            )}
            {currentAgenda.notice_markdown && (
              <div className="mt-2 rounded-xl border-l-4 border-accent-400 bg-accent-50 p-3 text-sm text-accent-600">
                <MarkdownRenderer content={currentAgenda.notice_markdown} />
              </div>
            )}
          </div>
        ) : (
          <div className="mb-4 rounded-2xl border border-accent-200 bg-accent-50 p-5">
            <p className="text-sm text-accent-600">
              目前階段尚未設定，請以現場公告為準
            </p>
          </div>
        )}

        {/* Next Stage */}
        {nextAgenda && (
          <div className="mb-4 rounded-2xl border border-warm-100 bg-surface-raised p-4 shadow-xs">
            <div className="mb-1 flex items-center gap-2">
              <svg
                className="h-4 w-4 text-warm-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span className="text-xs font-semibold text-warm-400">
                接下來
              </span>
            </div>
            <div className="ml-6">
              <p className="text-xs text-warm-400">{nextAgenda.time_label}</p>
              <h3 className="text-base font-bold text-warm-700">
                {nextAgenda.stage_name}
              </h3>
              <p className="text-sm text-warm-500">{nextAgenda.task}</p>
            </div>
          </div>
        )}

        {/* Questions Status */}
        <QuestionsStatusCard
          questions={questions}
          participantCode={session.participantCode}
        />
      </main>
    </>
  );
}
