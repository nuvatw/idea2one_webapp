"use client";

import { useEffect, useCallback } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "default" | "danger";
}

/**
 * Shared confirmation dialog with overlay.
 * Closes on Escape key.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "確認",
  cancelLabel = "取消",
  onConfirm,
  onCancel,
  variant = "default",
}: ConfirmDialogProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    },
    [onCancel]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-warm-900/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className="relative w-full max-w-sm rounded-2xl bg-surface-raised p-6 shadow-xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <h2
          id="confirm-dialog-title"
          className="mb-2 text-lg font-bold text-warm-800"
        >
          {title}
        </h2>
        <p
          id="confirm-dialog-message"
          className="mb-6 text-sm leading-relaxed text-warm-600"
        >
          {message}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] flex-1 rounded-xl border border-warm-200 bg-surface-raised px-4 py-2.5 text-sm font-medium text-warm-700 transition-colors hover:bg-warm-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-[44px] flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors ${
              variant === "danger"
                ? "bg-danger-500 hover:bg-danger-600"
                : "bg-primary-500 hover:bg-primary-600"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
