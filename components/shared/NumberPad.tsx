"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Spinner from "@/components/shared/Spinner";

interface NumberPadProps {
  onSubmit: (code: string) => void;
  submitLabel?: string;
  clearLabel?: string;
  maxLength?: number;
  disabled?: boolean;
}

/**
 * Shared number pad for check-in and lunch management.
 * Large touch-friendly buttons in a 3-column grid.
 * Auto-focuses submit button when max digits reached.
 */
export default function NumberPad({
  onSubmit,
  submitLabel = "報到",
  clearLabel = "清除",
  maxLength = 3,
  disabled = false,
}: NumberPadProps) {
  const [value, setValue] = useState("");
  const submitRef = useRef<HTMLButtonElement>(null);

  const handleDigit = useCallback(
    (digit: string) => {
      setValue((prev) => {
        if (prev.length >= maxLength) return prev;
        return prev + digit;
      });
    },
    [maxLength]
  );

  const handleClear = useCallback(() => {
    setValue("");
  }, []);

  const handleSubmit = useCallback(() => {
    if (value.length === maxLength) {
      onSubmit(value);
      setValue("");
    }
  }, [value, maxLength, onSubmit]);

  // Auto-focus submit when max length reached
  useEffect(() => {
    if (value.length === maxLength) {
      submitRef.current?.focus();
    }
  }, [value, maxLength]);

  return (
    <div className="space-y-3">
      {/* Display */}
      <div className="flex items-center justify-center rounded-xl border border-warm-200 bg-surface-raised px-4 py-3">
        <span className="text-3xl font-extrabold tabular-nums tracking-widest text-warm-800">
          {value || <span className="text-warm-300">---</span>}
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            disabled={disabled || value.length >= maxLength}
            className="min-h-[64px] rounded-xl border border-warm-200 bg-surface-raised text-xl font-bold text-warm-800 shadow-xs transition-all hover:bg-warm-50 active:scale-95 disabled:opacity-40"
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className="min-h-[64px] rounded-xl border border-warm-200 bg-warm-50 text-sm font-semibold text-warm-600 shadow-xs transition-all hover:bg-warm-100 active:scale-95 disabled:opacity-40"
        >
          {clearLabel}
        </button>
        <button
          type="button"
          onClick={() => handleDigit("0")}
          disabled={disabled || value.length >= maxLength}
          className="min-h-[64px] rounded-xl border border-warm-200 bg-surface-raised text-xl font-bold text-warm-800 shadow-xs transition-all hover:bg-warm-50 active:scale-95 disabled:opacity-40"
        >
          0
        </button>
        <button
          ref={submitRef}
          type="button"
          onClick={handleSubmit}
          disabled={disabled || value.length !== maxLength}
          className="inline-flex min-h-[64px] items-center justify-center gap-2 rounded-xl bg-primary-500 text-sm font-bold text-white shadow-xs transition-all hover:bg-primary-600 active:scale-95 disabled:bg-warm-300 disabled:text-warm-500"
        >
          {disabled && <Spinner className="h-4 w-4" />}
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
