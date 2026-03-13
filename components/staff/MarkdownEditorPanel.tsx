"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useActionState,
} from "react";
import MarkdownRenderer from "@/lib/markdown/renderer";
import MutationTimeoutBanner from "@/components/shared/MutationTimeoutBanner";
import Spinner from "@/components/shared/Spinner";

type EditorMode = "agenda" | "knowledge";

interface SaveMeta {
  updatedAt: string | null;
  updatedByName: string | null;
}

interface MarkdownEditorPanelProps {
  mode: EditorMode;
  initialValue: string;
  meta: SaveMeta;
  saveAction: (
    prevState: SaveActionResult | null,
    formData: FormData
  ) => Promise<SaveActionResult>;
  /** For agenda mode: hidden fields to include in the form */
  hiddenFields?: Record<string, string>;
  /** Field name for the markdown content in form submission */
  fieldName?: string;
  /** Second textarea for agenda notice (agenda mode only) */
  secondaryFieldName?: string;
  secondaryInitialValue?: string;
  secondaryLabel?: string;
}

interface SaveActionResult {
  success: boolean;
  error?: string;
  updatedAt?: string;
  updatedByName?: string;
}

/**
 * Shared Markdown editor panel for agenda content and knowledge base.
 * textarea + preview mode (no WYSIWYG).
 * Supports dirty state detection and unsaved changes confirmation.
 */
export default function MarkdownEditorPanel({
  mode,
  initialValue,
  meta,
  saveAction,
  hiddenFields,
  fieldName = "content_markdown",
  secondaryFieldName,
  secondaryInitialValue = "",
  secondaryLabel,
}: MarkdownEditorPanelProps) {
  const [value, setValue] = useState(initialValue);
  const [secondaryValue, setSecondaryValue] = useState(secondaryInitialValue);
  const [showPreview, setShowPreview] = useState(false);
  const [saveMeta, setSaveMeta] = useState<SaveMeta>(meta);
  const formRef = useRef<HTMLFormElement>(null);

  // Track "saved" snapshot for dirty detection via state (not ref — refs can't be read during render in React 19)
  const [savedValue, setSavedValue] = useState(initialValue);
  const [savedSecondaryValue, setSavedSecondaryValue] = useState(secondaryInitialValue);

  // Update when props change (e.g. switching agenda items)
  useEffect(() => {
    setValue(initialValue);
    setSavedValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    setSecondaryValue(secondaryInitialValue);
    setSavedSecondaryValue(secondaryInitialValue);
  }, [secondaryInitialValue]);

  useEffect(() => {
    setSaveMeta(meta);
  }, [meta]);

  const isDirty =
    value !== savedValue ||
    (secondaryFieldName ? secondaryValue !== savedSecondaryValue : false);

  // Dirty state: warn on page leave
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const [state, formAction, isPending] = useActionState(
    async (prevState: SaveActionResult | null, formData: FormData) => {
      const result = await saveAction(prevState, formData);
      if (result.success) {
        setSaveMeta({
          updatedAt: result.updatedAt ?? null,
          updatedByName: result.updatedByName ?? null,
        });
        // Reset dirty tracking by updating saved snapshots
        setSavedValue(formData.get(fieldName) as string ?? "");
        if (secondaryFieldName) {
          setSavedSecondaryValue(formData.get(secondaryFieldName) as string ?? "");
        }
      }
      return result;
    },
    null
  );

  const label = mode === "knowledge" ? "活動知識庫" : "Agenda 內容";

  const formatTime = useCallback((iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString("zh-TW", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }, []);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-warm-700">{label}</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="rounded-lg border border-warm-200 px-2.5 py-1 text-xs text-warm-600 shadow-xs transition-colors hover:bg-warm-50"
          >
            {showPreview ? "編輯" : "預覽"}
          </button>
        </div>
      </div>

      {/* Editor / Preview */}
      {showPreview ? (
        <div className="min-h-[200px] rounded-xl border border-warm-200 bg-surface-raised p-4 shadow-xs">
          {secondaryFieldName && secondaryValue && (
            <div className="mb-4">
              <p className="mb-1 text-xs font-medium text-warm-500">
                {secondaryLabel ?? "注意事項"}
              </p>
              <MarkdownRenderer content={secondaryValue} />
            </div>
          )}
          <MarkdownRenderer content={value || "（尚無內容）"} />
        </div>
      ) : (
        <form ref={formRef} action={formAction} className="space-y-3">
          {/* Hidden fields */}
          {hiddenFields &&
            Object.entries(hiddenFields).map(([key, val]) => (
              <input key={key} type="hidden" name={key} value={val} />
            ))}

          <textarea
            name={fieldName}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-xl border border-warm-200 p-3 font-mono text-sm text-warm-800 shadow-xs focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
            style={{ minHeight: "200px", fontSize: "16px" }}
            placeholder={`輸入 ${label} 內容（Markdown 格式）`}
          />

          {/* Secondary textarea (agenda notice) */}
          {secondaryFieldName && (
            <>
              <label className="block text-xs font-medium text-warm-500">
                {secondaryLabel ?? "注意事項"}
              </label>
              <textarea
                name={secondaryFieldName}
                value={secondaryValue}
                onChange={(e) => setSecondaryValue(e.target.value)}
                className="w-full rounded-xl border border-warm-200 p-3 font-mono text-sm text-warm-800 shadow-xs focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
                style={{ minHeight: "100px", fontSize: "16px" }}
                placeholder="輸入注意事項（Markdown 格式）"
              />
            </>
          )}

          {/* Action bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isPending || !isDirty}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending && <Spinner className="h-4 w-4" />}
                {isPending ? "儲存中…" : "儲存"}
              </button>
              {isDirty && (
                <span className="text-xs text-accent-600">未儲存的變更</span>
              )}
            </div>

            {/* Last saved info */}
            {saveMeta.updatedAt && (
              <p className="text-xs text-warm-400">
                {saveMeta.updatedByName
                  ? `${saveMeta.updatedByName} `
                  : ""}
                已儲存於 {formatTime(saveMeta.updatedAt)}
              </p>
            )}
          </div>

          {/* Status messages */}
          {state?.success && !isDirty && (
            <p className="text-xs text-success-600">已儲存</p>
          )}
          {state?.error && (
            <p className="text-xs text-danger-600" role="alert">{state.error}</p>
          )}
          <MutationTimeoutBanner isPending={isPending} />
        </form>
      )}
    </div>
  );
}
