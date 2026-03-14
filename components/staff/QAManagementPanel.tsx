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
  deleteAnswer,
  type CreateAnswerResult,
  type UpdateAnswerResult,
} from "@/lib/actions/answers";
import { deleteQuestion } from "@/lib/actions/questions";
import StatusBadge from "@/components/shared/StatusBadge";
import AIChatMarkdown from "@/components/participant/AIChatMarkdown";
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
 * Mobile-first: full-width question list, tap to open detail modal.
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
  const [modalOpen, setModalOpen] = useState(!!initialThreadDetail);
  const [threadLoading, setThreadLoading] = useState(false);
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const [deletingAnswerId, setDeletingAnswerId] = useState<string | null>(null);

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

  // Load question thread detail & open modal
  const handleSelectQuestion = useCallback(
    async (questionCode: string) => {
      setModalOpen(true);
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

  // Refresh thread without closing modal
  const refreshThread = useCallback(
    async (questionCode: string) => {
      try {
        const { getQuestionDetail } = await import("@/lib/dal/questions");
        const detail = await getQuestionDetail(questionCode);
        setSelectedThread(detail);
      } catch {
        // keep current state
      }
    },
    []
  );

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingAnswerId(null);
  }, []);

  // Delete a question
  const handleDeleteQuestion = useCallback(async (questionId: string) => {
    if (!confirm("確定要刪除此問題及所有回覆嗎？")) return;
    setDeletingQuestionId(questionId);
    try {
      const result = await deleteQuestion(questionId);
      if (result.success) {
        setSelectedThread(null);
        setModalOpen(false);
      }
    } finally {
      setDeletingQuestionId(null);
    }
  }, []);

  // Delete an answer
  const handleDeleteAnswer = useCallback(
    async (answerId: string) => {
      if (!confirm("確定要刪除此回覆嗎？")) return;
      setDeletingAnswerId(answerId);
      try {
        const result = await deleteAnswer(answerId);
        if (result.success && selectedThread) {
          refreshThread(selectedThread.question_code);
        }
      } finally {
        setDeletingAnswerId(null);
      }
    },
    [selectedThread, refreshThread]
  );

  // Pre-select if selectedQuestionCode is provided
  useEffect(() => {
    if (selectedQuestionCode && !initialThreadDetail) {
      handleSelectQuestion(selectedQuestionCode);
    }
  }, [selectedQuestionCode, initialThreadDetail, handleSelectQuestion]);

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
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

      {/* Question cards — full width */}
      <div className="space-y-2">
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
              className="min-h-[44px] w-full rounded-xl border border-warm-200 bg-surface-raised p-3 text-left transition-all hover:border-primary-100 hover:shadow-xs active:bg-primary-50"
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

      {/* Detail Modal */}
      <StaffQuestionModal
        thread={selectedThread}
        open={modalOpen}
        loading={threadLoading}
        onClose={handleCloseModal}
        editingAnswerId={editingAnswerId}
        onEditAnswer={setEditingAnswerId}
        onCancelEdit={() => setEditingAnswerId(null)}
        onAnswerEdited={() => {
          setEditingAnswerId(null);
          if (selectedThread) refreshThread(selectedThread.question_code);
        }}
        onAnswerCreated={() => {
          if (selectedThread) refreshThread(selectedThread.question_code);
        }}
        onDeleteQuestion={handleDeleteQuestion}
        deletingQuestionId={deletingQuestionId}
        onDeleteAnswer={handleDeleteAnswer}
        deletingAnswerId={deletingAnswerId}
      />
    </div>
  );
}

// --- Staff Question Detail Modal ---

interface StaffQuestionModalProps {
  thread: QuestionDetail | null;
  open: boolean;
  loading: boolean;
  onClose: () => void;
  editingAnswerId: string | null;
  onEditAnswer: (id: string) => void;
  onCancelEdit: () => void;
  onAnswerEdited: () => void;
  onAnswerCreated: () => void;
  onDeleteQuestion: (id: string) => void;
  deletingQuestionId: string | null;
  onDeleteAnswer: (id: string) => void;
  deletingAnswerId: string | null;
}

function StaffQuestionModal({
  thread,
  open,
  loading,
  onClose,
  editingAnswerId,
  onEditAnswer,
  onCancelEdit,
  onAnswerEdited,
  onAnswerCreated,
  onDeleteQuestion,
  deletingQuestionId,
  onDeleteAnswer,
  deletingAnswerId,
}: StaffQuestionModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      closeButtonRef.current?.focus();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={thread ? `問題 ${thread.question_code} 管理` : "問題詳情"}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-warm-900/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal: mobile full-screen, desktop centered */}
      <div className="relative z-10 flex h-full w-full flex-col bg-surface-raised sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-2xl sm:rounded-2xl sm:shadow-xl">
        {/* Header */}
        <div className="flex min-h-[44px] items-center justify-between border-b border-warm-200 px-4 py-3">
          <div className="flex items-center gap-2">
            {thread && (
              <>
                <span className="text-sm font-semibold text-primary-600">
                  {thread.question_code}
                </span>
                <StatusBadge
                  variant={thread.status === "answered" ? "answered" : "pending"}
                />
                {thread.source === "ai_handoff" && (
                  <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                    AI 轉問
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            {thread && (
              <button
                type="button"
                onClick={() => onDeleteQuestion(thread.id)}
                disabled={deletingQuestionId === thread.id}
                className="min-h-[44px] px-2 text-xs text-danger-600 hover:text-danger-700 disabled:opacity-50"
              >
                {deletingQuestionId === thread.id ? "刪除中..." : "刪除問題"}
              </button>
            )}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-warm-400 transition-colors hover:bg-warm-100 hover:text-warm-600"
              aria-label="關閉"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading && (
            <div className="space-y-3 py-4">
              <div className="h-4 w-32 animate-pulse rounded-lg bg-warm-200" />
              <div className="h-4 w-full animate-pulse rounded-lg bg-warm-200" />
              <div className="h-4 w-3/4 animate-pulse rounded-lg bg-warm-200" />
            </div>
          )}

          {!loading && !thread && (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-warm-500">找不到此問題</p>
            </div>
          )}

          {!loading && thread && (
            <div className="space-y-4">
              {/* Question content */}
              <div>
                <div className="text-sm leading-relaxed text-warm-800">
                  <AIChatMarkdown content={thread.content} />
                </div>
                <div className="mt-2 text-xs text-warm-400">
                  #{thread.participant_code} · {formatDateTime(thread.created_at)}
                </div>
              </div>

              <hr className="border-warm-100" />

              {/* Answers */}
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-warm-500">
                  回覆（{thread.answers.length}）
                </h4>

                {thread.answers.length === 0 ? (
                  <p className="text-sm text-warm-500">尚未有回覆</p>
                ) : (
                  <div className="space-y-3">
                    {thread.answers.map((answer) => (
                      <div
                        key={answer.id}
                        className="rounded-xl border border-warm-100 bg-warm-50 p-3"
                      >
                        {editingAnswerId === answer.id ? (
                          <EditAnswerForm
                            answerId={answer.id}
                            initialBody={answer.body}
                            onDone={onAnswerEdited}
                            onCancel={onCancelEdit}
                          />
                        ) : (
                          <>
                            <div className="text-sm leading-relaxed text-warm-700">
                              <AIChatMarkdown content={answer.body} />
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <div className="text-xs text-warm-400">
                                {answer.created_by_staff_name ? (
                                  <span className="font-medium text-warm-500">
                                    {answer.created_by_staff_name}
                                  </span>
                                ) : (
                                  <span className="font-medium text-primary-600">
                                    #{answer.created_by_participant_code}
                                  </span>
                                )}
                                <span> · {formatDateTime(answer.created_at)}</span>
                                {answer.created_by_staff_name && answer.updated_at !== answer.created_at && answer.updated_by_staff_name && (
                                  <span>
                                    {" "}· 已編輯 by {answer.updated_by_staff_name}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => onEditAnswer(answer.id)}
                                  className="min-h-[44px] min-w-[44px] text-xs text-primary-600 hover:text-primary-700"
                                >
                                  編輯
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteAnswer(answer.id)}
                                  disabled={deletingAnswerId === answer.id}
                                  className="min-h-[44px] min-w-[44px] text-xs text-danger-600 hover:text-danger-700 disabled:opacity-50"
                                >
                                  {deletingAnswerId === answer.id ? "刪除中..." : "刪除"}
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* New answer form — sticky at bottom */}
        {!loading && thread && (
          <div className="border-t border-warm-200 px-4 py-3">
            <NewAnswerForm
              questionId={thread.id}
              onAnswerCreated={onAnswerCreated}
            />
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
