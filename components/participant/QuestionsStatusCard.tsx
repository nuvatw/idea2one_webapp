"use client";

import { useRouter } from "next/navigation";
import type { QuestionSummary } from "@/types/dto";

interface QuestionsStatusCardProps {
  questions: QuestionSummary[];
  participantCode: string;
}

export default function QuestionsStatusCard({
  questions,
  participantCode,
}: QuestionsStatusCardProps) {
  const router = useRouter();

  const myQuestions = questions.filter(
    (q) => q.participant_code === participantCode,
  );
  const pendingQuestions = myQuestions.filter((q) => q.status === "pending");
  const answeredQuestions = myQuestions.filter((q) => q.status === "answered");

  return (
    <div className="rounded-2xl border border-warm-100 bg-surface-raised p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-warm-800">我的提問</h3>
        <button
          onClick={() => router.push("/qa?scope=mine")}
          className="text-xs font-medium text-primary-600 transition-colors hover:text-primary-700"
        >
          查看全部
        </button>
      </div>

      {myQuestions.length === 0 ? (
        <p className="py-3 text-center text-sm text-warm-400">
          還沒有提過問題
        </p>
      ) : (
        <div className="space-y-3">
          {/* Stats row */}
          <div className="flex gap-3">
            <div className="flex-1 rounded-xl bg-accent-50 p-3 text-center">
              <p className="text-xl font-bold text-accent-600">
                {pendingQuestions.length}
              </p>
              <p className="text-[11px] font-medium text-accent-500">待回答</p>
            </div>
            <div className="flex-1 rounded-xl bg-success-50 p-3 text-center">
              <p className="text-xl font-bold text-success-600">
                {answeredQuestions.length}
              </p>
              <p className="text-[11px] font-medium text-success-600">
                已回答
              </p>
            </div>
          </div>

          {/* Latest questions preview (up to 2) */}
          {myQuestions.slice(0, 2).map((q) => (
            <button
              key={q.id}
              onClick={() => router.push(`/qa?question=${q.question_code}`)}
              className="flex w-full items-center gap-3 rounded-xl border border-warm-100 p-3 text-left transition-all hover:border-primary-200 hover:shadow-xs active:scale-[0.98]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-warm-700">{q.content}</p>
                <p className="mt-0.5 text-xs text-warm-400">
                  {q.question_code}
                </p>
              </div>
              <span
                className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  q.status === "answered"
                    ? "bg-success-100 text-success-700"
                    : "bg-accent-100 text-accent-600"
                }`}
              >
                {q.status === "answered" ? "已回答" : "待回答"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
