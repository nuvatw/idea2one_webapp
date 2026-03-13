import type { Metadata } from "next";
import { Suspense } from "react";
import { requireStaffIdentity } from "@/lib/dal/auth-check";

export const metadata: Metadata = {
  title: "努努後台 — nuva",
};
import { getAgendaWithCurrentStage, getCurrentParticipantAgendaItemId } from "@/lib/dal/agenda";
import { getStaffAgendaAssignments } from "@/lib/dal/staff-agenda";
import { getQuestionsList, getQuestionDetail } from "@/lib/dal/questions";
import { getDashboardStats } from "@/lib/dal/dashboard";
import { getKnowledgeBase } from "@/lib/dal/knowledge";
import { getAllParticipantsWithStatus } from "@/lib/dal/attendance";
import { getAllParticipantsWithLunchStatus } from "@/lib/dal/lunch";
import { getActivityStartTime } from "@/lib/dal/activity-state";
import { createServerSupabaseClient } from "@/lib/utils/supabase";
import { STAGE_SWITCH_ALLOWED_STAFF } from "@/lib/constants";
import StaffTopBar from "@/components/staff/StaffTopBar";
import StaffTabShell, { type StaffTab } from "@/components/staff/StaffTabShell";
import AgendaSettingsPanel from "@/components/staff/AgendaSettingsPanel";
import StaffAgendaPanel from "@/components/staff/StaffAgendaPanel";
import QAManagementPanel from "@/components/staff/QAManagementPanel";
import CsvImportPanel from "@/components/staff/CsvImportPanel";
import StaffDashboardStatGrid from "@/components/staff/StaffDashboardStatGrid";
import CheckInPanel from "@/components/staff/CheckInPanel";
import LunchManagementPanel from "@/components/staff/LunchManagementPanel";
import ContentManagementPanel from "@/components/staff/ContentManagementPanel";
import EventSettingsPanel from "@/components/staff/EventSettingsPanel";

/**
 * /staff — 努努後台主操作頁
 * Requires staff auth + identity selected.
 * Tabs: dashboard | agenda | qna | attendance | lunch | content | import
 */
export default async function StaffDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireStaffIdentity();
  const params = await searchParams;

  // Parse question param for Q&A tab deep link
  const selectedQuestionCode =
    typeof params.question === "string" ? params.question : undefined;

  const supabase = createServerSupabaseClient();

  const [
    { items: agendaItems, currentAgendaItemId },
    { items: participantAgendaItems, currentAgendaItemId: participantCurrentFromQuery },
    currentParticipantAgendaId,
    staffAssignments,
    allQuestions,
    questionDetail,
    dashboardStats,
    knowledgeBase,
    staffListResult,
    allParticipantsWithStatus,
    allParticipantsWithLunchStatus,
    eventStartTime,
  ] = await Promise.all([
    getAgendaWithCurrentStage(),
    getAgendaWithCurrentStage({ participantOnly: true }),
    getCurrentParticipantAgendaItemId(),
    getStaffAgendaAssignments(session.selectedStaffId),
    getQuestionsList(),
    selectedQuestionCode
      ? getQuestionDetail(selectedQuestionCode)
      : Promise.resolve(null),
    getDashboardStats(),
    getKnowledgeBase(),
    supabase.from("staff_members").select("id, name"),
    getAllParticipantsWithStatus(),
    getAllParticipantsWithLunchStatus(),
    getActivityStartTime(),
  ]);

  // Build staff ID → name map for content management panel
  const staffNameMap: Record<string, string> = {};
  if (staffListResult.data) {
    for (const s of staffListResult.data) {
      staffNameMap[s.id] = s.name;
    }
  }

  const canSwitchAgenda = STAGE_SWITCH_ALLOWED_STAFF.includes(
    session.selectedStaffName
  );

  // Filter out participant-only summary items (sort_order > 100) from staff views
  const staffAgendaItems = agendaItems.filter((item) => item.sort_order <= 100);

  const tabContent: Record<StaffTab, React.ReactNode> = {
    dashboard: <StaffDashboardStatGrid stats={dashboardStats} />,
    agenda: (
      <StaffAgendaPanel assignments={staffAssignments} />
    ),
    qna: (
      <QAManagementPanel
        questions={allQuestions}
        initialThreadDetail={questionDetail}
        selectedQuestionCode={selectedQuestionCode}
      />
    ),
    attendance: (
      <CheckInPanel participants={allParticipantsWithStatus} />
    ),
    lunch: (
      <LunchManagementPanel participants={allParticipantsWithLunchStatus} />
    ),
    content: (
      <ContentManagementPanel
        knowledgeBase={knowledgeBase}
        agendaItems={staffAgendaItems}
        staffNameMap={staffNameMap}
      />
    ),
    import: (
      <Suspense fallback={<div className="p-4 text-warm-400">載入中…</div>}>
        <CsvImportPanel />
      </Suspense>
    ),
    settings: canSwitchAgenda ? (
      <div className="space-y-6">
        <AgendaSettingsPanel
          staffItems={staffAgendaItems}
          participantItems={participantAgendaItems}
          currentStaffAgendaId={currentAgendaItemId}
          currentParticipantAgendaId={currentParticipantAgendaId}
        />
        <EventSettingsPanel
          currentEventStartTime={eventStartTime}
          canEdit
        />
      </div>
    ) : (
      <div className="rounded-xl border border-warm-200 bg-warm-50 p-6 text-center">
        <p className="text-sm text-warm-500">僅限上哲 / Lily / Asa 使用設定功能</p>
      </div>
    ),
  };

  return (
    <div className="min-h-screen bg-surface">
      <StaffTopBar staffName={session.selectedStaffName} />
      <StaffTabShell staffName={session.selectedStaffName}>{tabContent}</StaffTabShell>
    </div>
  );
}
