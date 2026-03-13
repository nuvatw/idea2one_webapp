"use client";

import {
  useState,
  useCallback,
  useMemo,
  useActionState,
  useRef,
  useEffect,
} from "react";
import type { QuestionSummary, QuestionDetail } from "@/types/dto";
import {
  createAnswer,
  updateAnswer,
  type CreateAnswerResult,
  type UpdateAnswerResult,
} from "@/lib/actions/answers";
import StatusBadge from "@/components/shared/StatusBadge";
import MutationTimeoutBanner from "@/components/shared/MutationTimeoutBanner";
import Spinner from "@/components/shared/Spinner";

interface QAManagementPanelProps {
  questions: QuestionSummary[];
  initialThreadDetail: QuestionDetail | null;
  selectedQuestionCode?: string;
}

type StaffQAFilter = "all" | "pending";

/**
 * Staff Q&A management panel.
 * Shows question list with filter, and allows replying/editing answers.
 */
export default function QAManagementPanel({
  questions,
  initialThreadDetail,
  selectedQuestionCode,
}: QAManagementPanelProps) {
  const [filter, setFilter] = useState<StaffQAFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedThread, setSelectedThread] =
    useState<QuestionDetail | null>(initialThreadDetail);
  const [threadLoading, setThreadLoading] = useState(false);
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);

  // Filter & search
  const filteredQuestions = useMemo(() => {
    let result = questions;

    if (filter === "pending") {
      result = result.filter((q) => q.status === "pending");
    }

    if (searchQuery.trim()) {
      const search = searchQuery.trim().toLowerCase();
      result = result.filter(
        (q) =>
          q.question_code.toLowerCase().includes(search) ||
          q.content.toLowerCase().includes(search)
      );
    }

    // Sort: pending first (FIFO for pending), then by created_at desc
    if (filter === "pending") {
      result = [...result].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }

    return result;
  }, [questions, filter, searchQuery]);

  // Load question thread detail
  const handleSelectQuestion = useCallback(
    async (questionCode: string) => {
      setThreadLoading(true);
      setEditingAnswerId(null);
      try {
        const { getQuestionDetail } = await import("@/lib/dal/questions");
        const detail = await getQuestionDetail(questionCode);
        setSelectedThread(detail);
      } catch {
        setSelectedThread(null);
      } finally {
        setThreadLoading(false);
      }
    },
    []
  );

  // Pre-select if selectedQuestionCode is provided
  useEffect(() => {
    if (selectedQuestionCode && !initialThreadDetail) {
      handleSelectQuestion(selectedQuestionCode);
    }
  }, [selectedQuestionCode, initialThreadDetail, handleSelectQuestion]);

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* Left: Question list */}
      <div className="w-full lg:w-1/2">
        {/* Filter bar */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-warm-200 bg-warm-50 p-0.5">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`min-h-[44px] rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                filter === "all"
                  ? "bg-surface-raised text-warm-800 shadow-xs"
                  : "text-warm-500 hover:text-warm-700"
              }`}
            >
              全部（{questions.length}）
            </button>
            <button
              type="button"
              onClick={() => setFilter("pending")}
              className={`min-h-[44px] rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                filter === "pending"
                  ? "bg-surface-raised text-accent-600 shadow-xs"
                  : "text-warm-500 hover:text-warm-700"
              }`}
            >
              待回答（{questions.filter((q) => q.status === "pending").length}）
            </button>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋..."
            className="min-h-[44px] flex-1 rounded-xl border border-warm-200 px-3 py-2 text-base shadow-xs placeholder:text-warm-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Question cards */}
        <div className="max-h-[60vh] space-y-2 overflow-y-auto">
          {filteredQuestions.length === 0 ? (
            <p className="py-4 text-center text-sm text-warm-500">
              {questions.length === 0 ? "目前沒有問題" : "找不到符合條件的問題"}
            </p>
          ) : (
            filteredQuestions.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => handleSelectQuestion(q.question_code)}
                className={`min-h-[44px] w-full rounded-xl border p-3 text-left transition-all ${
                  selectedThread?.question_code === q.question_code
                    ? "border-primary-200 bg-primary-50 shadow-xs"
                    : "border-warm-200 bg-surface-raised hover:border-primary-100 hover:shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary-600">
                    {q.question_code}
                  </span>
                  <StatusBadge
                    variant={q.status === "answered" ? "answered" : "pending"}
                  />
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-warm-600">
                  {q.content}
                </p>
                <div className="mt-1 text-xs text-warm-400">
                  #{q.participant_code} · {formatTime(q.created_at)}
                  {q.answer_count > 0 && ` · ${q.answer_count} 則回覆`}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: Thread detail + reply */}
      <div className="w-full lg:w-1/2">
        {threadLoading && (
          <div className="rounded-xl border border-warm-200 bg-warm-50 p-8 shadow-xs">
            <div className="space-y-3">
              <div className="h-4 w-24 animate-pulse rounded-lg bg-warm-200" />
              <div className="h-4 w-full animate-pulse rounded-lg bg-warm-200" />
              <div className="h-4 w-3/4 animate-pulse rounded-lg bg-warm-200" />
            </div>
          </div>
        )}

        {!threadLoading && !selectedThread && (
          <div className="rounded-xl border border-warm-200 bg-warm-50 p-8 text-center shadow-xs">
            <p className="text-sm text-warm-500">選擇一個問題以查看詳情</p>
          </div>
        )}

        {!threadLoading && selectedThread && (
          <div className="rounded-xl border border-warm-200 bg-surface-raised shadow-xs">
            {/* Thread header */}
            <div className="border-b border-warm-200 p-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-primary-600">
                  {selectedThread.question_code}
                </span>
                <StatusBadge
                  variant={selectedThread.status === "answered" ? "answered" : "pending"}
                />
                {selectedThread.source === "ai_handoff" && (
                  <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                    AI 轉問
                  </span>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-warm-700">
                {selectedThread.content}
              </p>
              <div className="mt-2 text-xs text-warm-400">
                #{selectedThread.participant_code} ·{" "}
                {formatDateTime(selectedThread.created_at)}
              </div>
            </div>

            {/* Answers */}
            <div className="max-h-[30vh] overflow-y-auto p-4">
              {selectedThread.answers.length === 0 ? (
                <p className="text-sm text-warm-500">尚未有回覆</p>
              ) : (
                <div className="space-y-3">
                  {selectedThread.answers.map((answer) => (
                    <div
                      key={answer.id}
                      className="rounded-xl border border-warm-100 bg-warm-50 p-3"
                    >
                      {editingAnswerId === answer.id ? (
                        <EditAnswerForm
                          answerId={answer.id}
                          initialBody={answer.body}
                          onDone={() => {
                            setEditingAnswerId(null);
                            handleSelectQuestion(
                              selectedThread.question_code
                            );
                          }}
                          onCancel={() => setEditingAnswerId(null)}
                        />
                      ) : (
                        <>
                          <p className="whitespace-pre-wrap text-sm text-warm-700">
                            {answer.body}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="text-xs text-warm-400">
                              <span className="font-medium text-warm-500">
                                {answer.created_by_staff_name}
                              </span>
                              <span> · {formatDateTime(answer.created_at)}</span>
                              {answer.updated_at !== answer.created_at && (
                                <span>
                                  {" "}
                                  · 已編輯 by {answer.updated_by_staff_name}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditingAnswerId(answer.id)}
                              className="min-h-[44px] min-w-[44px] text-xs text-primary-600 hover:text-primary-700"
                            >
                              編輯
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* New answer form */}
            <div className="border-t border-warm-200 p-4">
              <NewAnswerForm
                questionId={selectedThread.id}
                onAnswerCreated={() =>
                  handleSelectQuestion(selectedThread.question_code)
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Sub-components ---

function NewAnswerForm({
  questionId,
  onAnswerCreated,
}: {
  questionId: string;
  onAnswerCreated: () => void;
}) {
  const [state, formAction, isPending] = useActionState<
    CreateAnswerResult | null,
    FormData
  >(createAnswer, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      onAnswerCreated();
    }
  }, [state, onAnswerCreated]);

  return (
    <form ref={formRef} action={formAction}>
      <input type="hidden" name="questionId" value={questionId} />
      <textarea
        name="body"
        placeholder="輸入回覆..."
        rows={2}
        className="w-full resize-none rounded-xl border border-warm-200 px-3 py-2 text-base placeholder:text-warm-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-danger-600" role="alert">{state?.error ?? ""}</span>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending && <Spinner className="h-4 w-4" />}
          {isPending ? "送出中..." : "送出回覆"}
        </button>
      </div>
      <MutationTimeoutBanner isPending={isPending} />
    </form>
  );
}

function EditAnswerForm({
  answerId,
  initialBody,
  onDone,
  onCancel,
}: {
  answerId: string;
  initialBody: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [state, formAction, isPending] = useActionState<
    UpdateAnswerResult | null,
    FormData
  >(updateAnswer, null);

  useEffect(() => {
    if (state?.success) {
      onDone();
    }
  }, [state, onDone]);

  return (
    <form action={formAction}>
      <input type="hidden" name="answerId" value={answerId} />
      <textarea
        name="body"
        defaultValue={initialBody}
        rows={3}
        className="w-full resize-none rounded-xl border border-warm-200 px-3 py-2 text-base placeholder:text-warm-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-danger-600" role="alert">{state?.error ?? ""}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] rounded-xl border border-warm-200 bg-surface-raised px-3 py-1.5 text-sm text-warm-700 transition-colors hover:bg-warm-50"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending && <Spinner className="h-4 w-4" />}
            {isPending ? "儲存中..." : "儲存"}
          </button>
        </div>
      </div>
      <MutationTimeoutBanner isPending={isPending} />
    </form>
  );
}

function formatTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function formatDateTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleString("zh-TW", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}
