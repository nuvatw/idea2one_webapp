"use client";

import { useActionState, useState, useRef } from "react";
import { importCsv, type CsvImportResult } from "@/lib/actions/csv-import";
import type { CsvKind } from "@/lib/csv/parser";
import Spinner from "@/components/shared/Spinner";

const KIND_LABELS: Record<CsvKind, string> = {
  participants: "學員名單",
  staff: "努努名單",
  agenda: "議程",
  assignments: "努努議程任務分配",
};

const KIND_DESCRIPTIONS: Record<CsvKind, string> = {
  participants: "欄位：participant_code, name, email, diet_type",
  staff: "欄位：name, default_role, default_location, default_note_markdown",
  agenda: "欄位：sort_order, time_label, stage_name, task, description_markdown, notice_markdown",
  assignments: "欄位：agenda_sort_order, staff_name, duty_label, location, incident_note_markdown",
};

export default function CsvImportPanel() {
  const [selectedKind, setSelectedKind] = useState<CsvKind>("participants");
  const [state, formAction, isPending] = useActionState<CsvImportResult | null, FormData>(
    importCsv,
    null
  );
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-warm-800">CSV 匯入</h2>

      {/* Kind selector */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-2">匯入類型</label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(KIND_LABELS) as CsvKind[]).map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => {
                setSelectedKind(kind);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                selectedKind === kind
                  ? "border-primary-400 bg-primary-50 text-primary-700 shadow-xs"
                  : "border-warm-200 bg-surface-raised text-warm-700 hover:bg-warm-50"
              }`}
            >
              {KIND_LABELS[kind]}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-warm-500">{KIND_DESCRIPTIONS[selectedKind]}</p>
      </div>

      {/* File upload form */}
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="kind" value={selectedKind} />
        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">CSV 檔案</label>
          <input
            ref={fileRef}
            type="file"
            name="file"
            accept=".csv"
            required
            className="block w-full text-sm text-warm-500 file:mr-4 file:rounded-xl file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-100"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending && <Spinner className="h-4 w-4" />}
          {isPending ? "匯入中…" : `匯入${KIND_LABELS[selectedKind]}`}
        </button>
      </form>

      {/* Result display */}
      {state && (
        <div
          className={`rounded-xl p-4 ${
            state.success ? "bg-success-50" : "bg-danger-50"
          }`}
        >
          {state.success ? (
            <p className="text-sm text-success-600">
              匯入成功，共 {state.importedCount} 筆
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-danger-600">
                {state.message || "匯入失敗"}
              </p>
              {state.errors && state.errors.length > 0 && (
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-xs text-danger-600">
                    <thead>
                      <tr className="border-b border-danger-100">
                        <th className="pb-1 text-left">行</th>
                        <th className="pb-1 text-left">欄位</th>
                        <th className="pb-1 text-left">錯誤</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.errors.map((err, i) => (
                        <tr key={i} className="border-b border-danger-100/50">
                          <td className="py-1">{err.row}</td>
                          <td className="py-1">{err.field}</td>
                          <td className="py-1">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
