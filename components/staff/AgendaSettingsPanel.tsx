"use client";

import { useState } from "react";
import type { AgendaItemSummary } from "@/types/dto";
import CurrentAgendaSwitcher from "./CurrentAgendaSwitcher";
import ParticipantAgendaSwitcher from "./ParticipantAgendaSwitcher";
import AgendaItemEditCard from "./AgendaItemEditCard";

type AgendaView = "staff" | "participant";

interface AgendaSettingsPanelProps {
  staffItems: AgendaItemSummary[];
  participantItems: AgendaItemSummary[];
  currentStaffAgendaId: string | null;
  currentParticipantAgendaId: string | null;
}

export default function AgendaSettingsPanel({
  staffItems,
  participantItems,
  currentStaffAgendaId,
  currentParticipantAgendaId,
}: AgendaSettingsPanelProps) {
  const [view, setView] = useState<AgendaView>("staff");

  const items = view === "staff" ? staffItems : participantItems;
  const currentId =
    view === "staff" ? currentStaffAgendaId : currentParticipantAgendaId;

  return (
    <div className="space-y-5">
      {/* Toggle switch */}
      <div className="flex items-center gap-1 rounded-xl bg-warm-100 p-1">
        <button
          type="button"
          onClick={() => setView("staff")}
          className={`flex-1 min-h-[40px] rounded-lg px-3 py-2 text-sm font-medium transition-all ${
            view === "staff"
              ? "bg-surface-raised text-primary-600 shadow-xs"
              : "text-warm-500 hover:text-warm-700"
          }`}
        >
          努努 Agenda
        </button>
        <button
          type="button"
          onClick={() => setView("participant")}
          className={`flex-1 min-h-[40px] rounded-lg px-3 py-2 text-sm font-medium transition-all ${
            view === "participant"
              ? "bg-surface-raised text-primary-600 shadow-xs"
              : "text-warm-500 hover:text-warm-700"
          }`}
        >
          法法 Agenda
        </button>
      </div>

      {/* Stage switcher */}
      {view === "staff" ? (
        <CurrentAgendaSwitcher
          items={staffItems}
          currentAgendaId={currentStaffAgendaId}
          canSwitch
        />
      ) : (
        <ParticipantAgendaSwitcher
          items={participantItems}
          currentAgendaId={currentParticipantAgendaId}
        />
      )}

      {/* Agenda item editors */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-warm-800">
          編輯{view === "staff" ? "努努" : "法法"}行程
        </h3>
        {items.length === 0 ? (
          <p className="text-sm text-warm-500">尚無行程資料</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <AgendaItemEditCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
