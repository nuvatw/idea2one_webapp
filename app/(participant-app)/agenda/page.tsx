import type { Metadata } from "next";
import { requireParticipantSession } from "@/lib/dal/auth-check";
import { getAgendaWithCurrentStage } from "@/lib/dal/agenda";
import AgendaTimeline from "@/components/participant/AgendaTimeline";
import CurrentAgendaAutoRefresh from "@/components/participant/CurrentAgendaAutoRefresh";

export const metadata: Metadata = {
  title: "活動議程 — nuva",
};

export default async function AgendaPage() {
  await requireParticipantSession();

  const { items: agendaItems, currentAgendaItemId } =
    await getAgendaWithCurrentStage({ participantOnly: true });

  return (
    <>
      <CurrentAgendaAutoRefresh />
      <main className="mx-auto max-w-screen-md px-5 pt-6">
        <div className="mb-5">
          <h1 className="text-xl font-extrabold text-warm-800">活動議程</h1>
          <p className="mt-1 text-sm text-warm-500">今日活動流程與進度</p>
        </div>
        <AgendaTimeline
          items={agendaItems}
          currentAgendaId={currentAgendaItemId ?? undefined}
        />
      </main>
    </>
  );
}
