"use client";

import { useActionState, useRef, useEffect } from "react";
import { participantLogin, type ParticipantLoginResult } from "@/lib/actions/participant-auth";
import Spinner from "@/components/shared/Spinner";

export default function ParticipantLoginForm() {
  const [state, formAction, isPending] = useActionState<ParticipantLoginResult | null, FormData>(
    participantLogin,
    null
  );

  const codeRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const isEmailMismatch = state?.error?.type === "email_mismatch";

  // Focus first error field after submission
  useEffect(() => {
    if (!state?.error) return;
    if (state.error.fieldErrors?.participantCode) {
      codeRef.current?.focus();
    } else if (state.error.fieldErrors?.email) {
      emailRef.current?.focus();
    }
  }, [state]);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {/* 學員編號 */}
      <div>
        <label htmlFor="participantCode" className="block text-sm font-medium text-warm-700">
          學員編號
        </label>
        <input
          ref={codeRef}
          id="participantCode"
          name="participantCode"
          type="text"
          inputMode="numeric"
          pattern="\d{3}"
          maxLength={3}
          placeholder="例：001"
          required
          autoComplete="off"
          aria-describedby={state?.error?.fieldErrors?.participantCode ? "code-error" : undefined}
          aria-invalid={!!state?.error?.fieldErrors?.participantCode}
          className="mt-1 block w-full rounded-xl border border-warm-200 bg-surface-raised px-3 py-2.5 text-base shadow-xs transition-colors placeholder:text-warm-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        {state?.error?.fieldErrors?.participantCode && (
          <p id="code-error" className="mt-1 text-sm text-danger-600" role="alert">
            {state.error.fieldErrors.participantCode}
          </p>
        )}
      </div>

      {/* 信箱 */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-warm-700">
          信箱
        </label>
        <input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          placeholder="your@email.com"
          required
          autoComplete="email"
          aria-describedby={state?.error?.fieldErrors?.email ? "email-error" : undefined}
          aria-invalid={!!state?.error?.fieldErrors?.email}
          className="mt-1 block w-full rounded-xl border border-warm-200 bg-surface-raised px-3 py-2.5 text-base shadow-xs transition-colors placeholder:text-warm-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        {state?.error?.fieldErrors?.email && (
          <p id="email-error" className="mt-1 text-sm text-danger-600" role="alert">
            {state.error.fieldErrors.email}
          </p>
        )}
      </div>

      {/* 錯誤訊息（非欄位級） */}
      {state?.error && state.error.type !== "validation" && (
        <div className="rounded-xl bg-danger-50 p-3" role="alert">
          <p className="text-sm text-danger-600">{state.error.message}</p>
        </div>
      )}

      {/* Gmail 按鈕 — 僅 email mismatch 時顯示 */}
      {isEmailMismatch && (
        <a
          href="https://mail.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-xl border border-warm-200 bg-surface-raised py-2.5 text-center text-sm font-medium text-warm-700 shadow-xs transition-colors hover:bg-warm-50"
        >
          開啟 Gmail 確認信箱
        </a>
      )}

      {/* 送出 */}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending && <Spinner className="h-4 w-4" />}
        {isPending ? "登入中…" : "登入"}
      </button>

      {/* 現場協助提示 */}
      <p className="text-center text-xs text-warm-400">
        如需協助，請洽現場努努
      </p>
    </form>
  );
}
