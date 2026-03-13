"use client";

import { useActionState, useRef, useEffect } from "react";
import { createQuestion, type CreateQuestionResult } from "@/lib/actions/questions";
import type { QuestionSource } from "@/types/domain";
import MutationTimeoutBanner from "@/components/shared/MutationTimeoutBanner";
import Spinner from "@/components/shared/Spinner";

interface FormalQuestionComposerProps {
  prefill?: string;
  source?: QuestionSource;
  onQuestionCreated?: (questionCode: string) => void;
}

/**
 * Formal question submission form.
 * Creates a new public question with auto-generated question code.
 * Supports AI handoff prefill via `prefill` and `source` props.
 */
export default function FormalQuestionComposer({
  prefill,
  source,
  onQuestionCreated,
}: FormalQuestionComposerProps) {
  const [state, formAction, isPending] = useActionState<
    CreateQuestionResult | null,
    FormData
  >(createQuestion, null);

  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update textarea value when prefill changes (AI handoff)
  useEffect(() => {
    if (prefill && textareaRef.current) {
      textareaRef.current.value = prefill;
    }
  }, [prefill]);

  // Clear form and notify parent on success
  useEffect(() => {
    if (state?.success && state.question_code) {
      formRef.current?.reset();
      onQuestionCreated?.(state.question_code);
    }
  }, [state, onQuestionCreated]);

  // Focus textarea on error
  useEffect(() => {
    if (state?.error) {
      textareaRef.current?.focus();
    }
  }, [state?.error]);

  const isHandoff = source === "ai_handoff";

  return (
    <div
      className={`rounded-xl border p-4 shadow-xs ${isHandoff ? "border-primary-200 bg-primary-50" : "border-warm-200 bg-surface-raised"}`}
    >
      <h3 className="mb-3 text-sm font-semibold text-warm-800">
        我想問問題
        {isHandoff && (
          <span className="ml-2 rounded-md bg-primary-100 px-1.5 py-0.5 text-[10px] font-medium text-primary-700">
            AI 轉問
          </span>
        )}
      </h3>

      <form ref={formRef} action={formAction}>
        <textarea
          ref={textareaRef}
          name="content"
          defaultValue={prefill ?? ""}
          placeholder="輸入你的問題..."
          rows={3}
          maxLength={2000}
          aria-describedby={state?.error ? "question-error" : undefined}
          aria-invalid={!!state?.error}
          className="w-full resize-none rounded-xl border border-warm-200 px-3 py-2 text-base placeholder:text-warm-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />

        <input type="hidden" name="source" value={source ?? "manual"} />
        <input type="hidden" name="idempotency_key" value={crypto.randomUUID()} />

        <div className="mt-2 flex items-center justify-between">
          <div className="text-xs">
            {state?.error && (
              <span id="question-error" className="text-danger-600" role="alert">
                {state.error}
              </span>
            )}
            {state?.success && state.question_code && (
              <span className="text-success-600">
                已送出問題 {state.question_code}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending && <Spinner className="h-4 w-4" />}
            {isPending ? "送出中..." : "送出提問"}
          </button>
        </div>

        <MutationTimeoutBanner isPending={isPending} />
      </form>
    </div>
  );
}
