"use client";

import { useState, useCallback } from "react";
import type { AgendaItemSummary } from "@/types/dto";
import type { KnowledgeBaseDocument } from "@/types/domain";
import MarkdownEditorPanel from "./MarkdownEditorPanel";
import { saveKnowledgeBase } from "@/lib/actions/knowledge";
import { saveAgendaContent } from "@/lib/actions/agenda-content";

type ContentSubTab = "knowledge" | "agenda";

interface ContentManagementPanelProps {
  knowledgeBase: KnowledgeBaseDocument | null;
  agendaItems: AgendaItemSummary[];
  staffNameMap: Record<string, string>;
}

/**
 * Content management panel with sub-tabs for Knowledge Base and Agenda editing.
 * Provides dirty state awareness when switching sub-tabs.
 */
export default function ContentManagementPanel({
  knowledgeBase,
  agendaItems,
  staffNameMap,
}: ContentManagementPanelProps) {
  const [subTab, setSubTab] = useState<ContentSubTab>("knowledge");
  const [selectedAgendaId, setSelectedAgendaId] = useState<string>(
    agendaItems[0]?.id ?? ""
  );

  const selectedAgenda = agendaItems.find((a) => a.id === selectedAgendaId);

  const resolveStaffName = useCallback(
    (staffId: string | null) => {
      if (!staffId) return null;
      return staffNameMap[staffId] ?? null;
    },
    [staffNameMap]
  );

  return (
    <div className="space-y-4">
      {/* Sub-tab navigation */}
      <div className="flex gap-2 border-b border-warm-200 pb-2">
        <button
          type="button"
          onClick={() => setSubTab("knowledge")}
          className={`rounded-t px-3 py-1.5 text-sm font-medium ${
            subTab === "knowledge"
              ? "border-b-2 border-primary-500 text-primary-600"
              : "text-warm-500 hover:text-warm-700"
          }`}
        >
          活動知識庫
        </button>
        <button
          type="button"
          onClick={() => setSubTab("agenda")}
          className={`rounded-t px-3 py-1.5 text-sm font-medium ${
            subTab === "agenda"
              ? "border-b-2 border-primary-500 text-primary-600"
              : "text-warm-500 hover:text-warm-700"
          }`}
        >
          Agenda 內容
        </button>
      </div>

      {/* Knowledge Base Editor */}
      {subTab === "knowledge" && (
        <MarkdownEditorPanel
          mode="knowledge"
          initialValue={knowledgeBase?.content_markdown ?? ""}
          meta={{
            updatedAt: knowledgeBase?.updated_at ?? null,
            updatedByName: resolveStaffName(
              knowledgeBase?.updated_by_staff_id ?? null
            ),
          }}
          saveAction={saveKnowledgeBase}
        />
      )}

      {/* Agenda Content Editor */}
      {subTab === "agenda" && (
        <div className="space-y-4">
          {/* Agenda item selector */}
          <div>
            <label className="mb-1 block text-xs font-medium text-warm-500">
              選擇要編輯的 Agenda 階段
            </label>
            <select
              value={selectedAgendaId}
              onChange={(e) => setSelectedAgendaId(e.target.value)}
              className="w-full rounded-xl border border-warm-200 px-3 py-2 text-sm text-warm-700 shadow-xs"
              style={{ fontSize: "16px" }}
            >
              {agendaItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.time_label} — {item.stage_name}
                </option>
              ))}
            </select>
          </div>

          {/* Agenda markdown editor */}
          {selectedAgenda && (
            <MarkdownEditorPanel
              key={selectedAgenda.id}
              mode="agenda"
              initialValue={selectedAgenda.description_markdown ?? ""}
              meta={{
                updatedAt: null, // agenda_items doesn't track updater name in summary DTO
                updatedByName: null,
              }}
              saveAction={saveAgendaContent}
              hiddenFields={{ agenda_item_id: selectedAgenda.id }}
              fieldName="description_markdown"
              secondaryFieldName="notice_markdown"
              secondaryInitialValue={selectedAgenda.notice_markdown ?? ""}
              secondaryLabel="注意事項"
            />
          )}
        </div>
      )}
    </div>
  );
}
