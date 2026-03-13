"use client";

import { useActionState, useRef, useEffect } from "react";
import { staffLogin, type StaffLoginResult } from "@/lib/actions/staff-auth";
import Spinner from "@/components/shared/Spinner";

export default function StaffLoginForm() {
  const [state, formAction, isPending] = useActionState<StaffLoginResult | null, FormData>(
    staffLogin,
    null
  );

  const passwordRef = useRef<HTMLInputElement>(null);

  // Focus password field on error
  useEffect(() => {
    if (state?.error) {
      passwordRef.current?.focus();
    }
  }, [state]);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-warm-700">
          後台密碼
        </label>
        <input
          ref={passwordRef}
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          aria-describedby={state?.error ? "password-error" : undefined}
          aria-invalid={!!state?.error}
          className="mt-1 block w-full rounded-xl border border-warm-200 bg-surface-raised px-3 py-2.5 text-base shadow-xs transition-colors placeholder:text-warm-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {state?.error && (
        <div id="password-error" className="rounded-xl bg-danger-50 p-3" role="alert">
          <p className="text-sm text-danger-600">{state.error.message}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-warm-700 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-warm-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending && <Spinner className="h-4 w-4" />}
        {isPending ? "登入中…" : "登入"}
      </button>
    </form>
  );
}
