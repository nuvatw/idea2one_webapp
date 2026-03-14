"use client";

import { useEffect, useCallback, useRef, useState, useActionState } from "react";
import type { QuestionDetail } from "@/types/dto";
import StatusBadge from "@/components/shared/StatusBadge";
import AIChatMarkdown from "@/components/participant/AIChatMarkdown";
import { createParticipantComment, type CreateAnswerResult } from "@/lib/actions/answers";

interface QuestionDetailModalProps {
  thread: QuestionDetail | null;
  open: boolean;
  onClose: () => void;
  loading?: boolean;
  participantCode?: string;
  onCommentCreated?: () => void;
}

/**
 * Full-screen (mobile) / centered modal (desktop) for question detail view.
 * Shows question thread with all answers.
 * Per Spec: mobile fullscreen, desktop max-w 768px centered.
 */
export default function QuestionDetailModal({
  thread,
  open,
  onClose,
  loading,
  participantCode,
  onCommentCreated,
}: QuestionDetailModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [commentText, setCommentText] = useState("");

  const [formState, formAction, isPending] = useActionState<CreateAnswerResult | null, FormData>(
    createParticipantComment,
    null
  );

  // Reset form on success
  useEffect(() => {
    if (formState?.success) {
      setCommentText("");
      formRef.current?.reset();
      onCommentCreated?.();
    }
  }, [formState, onCommentCreated]);

  // Reset comment text when modal closes or thread changes
  useEffect(() => {
    if (!open) {
      setCommentText("");
    }
  }, [open]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      // Focus close button on open for a11y
      closeButtonRef.current?.focus();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={thread ? `問題 ${thread.question_code} 詳情` : "問題詳情"}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-warm-900/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal: mobile full-screen, desktop centered max-w-3xl */}
      <div className="relative z-10 flex h-full w-full flex-col bg-surface-raised sm:h-auto sm:max-h-[85vh] sm:w-full sm:max-w-3xl sm:rounded-2xl sm:shadow-xl">
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
              </>
            )}
          </div>
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
                <div className="mb-1 text-xs text-warm-400">
                  #{thread.participant_code} · {formatDateTime(thread.created_at)}
                  {thread.source === "ai_handoff" && (
                    <span className="ml-2 rounded-full bg-primary-100 px-2 py-0.5 font-medium text-primary-700">
                      AI 轉問
                    </span>
                  )}
                </div>
                <div className="text-sm leading-relaxed text-warm-800">
                  <AIChatMarkdown content={thread.content} />
                </div>
              </div>

              {/* Divider */}
              <hr className="border-warm-100" />

              {/* Answers / Comments */}
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-warm-500">
                  回覆（{thread.answers.length}）
                </h4>

                {thread.answers.length === 0 ? (
                  <p className="text-sm text-warm-500">尚未收到回覆</p>
                ) : (
                  <div className="space-y-3">
                    {thread.answers.map((answer) => {
                      const isStaffAnswer = !!answer.created_by_staff_name;
                      return (
                        <div
                          key={answer.id}
                          className={`rounded-xl border p-3 ${
                            isStaffAnswer
                              ? "border-warm-100 bg-warm-50"
                              : "border-primary-100 bg-primary-50/30"
                          }`}
                        >
                          <div className="text-sm leading-relaxed text-warm-700">
                            <AIChatMarkdown content={answer.body} />
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-xs text-warm-400">
                            {isStaffAnswer ? (
                              <span className="font-medium text-warm-500">
                                {answer.created_by_staff_name}
                              </span>
                            ) : (
                              <span className="font-medium text-primary-600">
                                #{answer.created_by_participant_code}
                              </span>
                            )}
                            <span>·</span>
                            <span>{formatDateTime(answer.created_at)}</span>
                            {isStaffAnswer && answer.updated_at !== answer.created_at && answer.updated_by_staff_name && (
                              <>
                                <span>·</span>
                                <span>
                                  已編輯 by {answer.updated_by_staff_name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Comment form for participants */}
        {!loading && thread && participantCode && (
          <div className="border-t border-warm-200 px-4 py-3">
            {formState && !formState.success && formState.error && (
              <p className="mb-2 text-xs text-red-500">{formState.error}</p>
            )}
            <form ref={formRef} action={formAction} className="flex items-end gap-2">
              <input type="hidden" name="questionId" value={thread.id} />
              <textarea
                name="body"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="留言..."
                maxLength={2000}
                rows={1}
                className="flex-1 resize-none rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm text-warm-800 placeholder:text-warm-400 focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-300"
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 120) + "px";
                }}
              />
              <button
                type="submit"
                disabled={isPending || !commentText.trim()}
                className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-primary-500 text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="送出留言"
              >
                {isPending ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${month}/${day} ${hours}:${minutes}`;
  } catch {
    return "";
  }
}
