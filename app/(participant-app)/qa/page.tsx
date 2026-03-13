import type { Metadata } from "next";
import { requireParticipantSession } from "@/lib/dal/auth-check";
import { getQuestionsList, getQuestionDetail } from "@/lib/dal/questions";
import QAPageClient from "@/components/qa/QAPageClient";
import type { QAFilterState } from "@/components/qa/QAFilterBar";

export const metadata: Metadata = {
  title: "常見問題 — nuva",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * /qa — FAQ / Q&A page
 * SSR: fetch all questions once, then client-side filter/search.
 */
export default async function ParticipantQAPage({ searchParams }: PageProps) {
  const session = await requireParticipantSession();
  const params = await searchParams;

  const q = typeof params.q === "string" ? params.q : "";
  const scope =
    typeof params.scope === "string" && params.scope === "mine"
      ? "mine"
      : "all";
  const status =
    typeof params.status === "string" && params.status === "answered"
      ? "answered"
      : "all";
  const questionCode =
    typeof params.question === "string" ? params.question : null;
  const prefill = typeof params.prefill === "string" ? params.prefill : null;
  const source = typeof params.source === "string" ? params.source : null;

  const initialFilters: QAFilterState = { q, scope, status };

  const [questions, questionDetail] = await Promise.all([
    getQuestionsList(),
    questionCode ? getQuestionDetail(questionCode) : Promise.resolve(null),
  ]);

  return (
    <main className="mx-auto max-w-screen-md px-5 pt-6">
      <div className="mb-4">
        <h1 className="text-xl font-extrabold text-warm-800">常見問題</h1>
        <p className="mt-1 text-sm text-warm-500">查看與提交問題</p>
      </div>
      <QAPageClient
        questions={questions}
        participantCode={session.participantCode}
        initialFilters={initialFilters}
        initialQuestionCode={questionCode}
        initialQuestionDetail={questionDetail}
        initialPrefill={prefill}
        initialSource={source === "ai_handoff" ? "ai_handoff" : undefined}
      />
    </main>
  );
}
