"use server";

import { createServerSupabaseClient } from "@/lib/utils/supabase";
import { verifyStaffSession } from "@/lib/auth/session";
import {
  parseCsv,
  type CsvKind,
  type CsvRowError,
  type ParticipantRow,
  type StaffRow,
  type AgendaRow,
  type AssignmentRow,
} from "@/lib/csv/parser";

export type CsvImportResult = {
  success: boolean;
  importedCount?: number;
  errors?: CsvRowError[];
  message?: string;
};

export async function importCsv(
  _prevState: CsvImportResult | null,
  formData: FormData
): Promise<CsvImportResult> {
  // Auth check
  const session = await verifyStaffSession();
  if (!session) {
    return { success: false, message: "未授權，請重新登入" };
  }

  const kind = formData.get("kind") as CsvKind;
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) {
    return { success: false, message: "請選擇 CSV 檔案" };
  }

  if (!["participants", "staff", "agenda", "assignments"].includes(kind)) {
    return { success: false, message: "無效的匯入類型" };
  }

  const csvText = await file.text();

  try {
    switch (kind) {
      case "participants":
        return await importParticipants(csvText);
      case "staff":
        return await importStaff(csvText);
      case "agenda":
        return await importAgenda(csvText);
      case "assignments":
        return await importAssignments(csvText);
      default:
        return { success: false, message: "無效的匯入類型" };
    }
  } catch {
    return { success: false, message: "匯入過程發生系統錯誤" };
  }
}

async function importParticipants(csvText: string): Promise<CsvImportResult> {
  const result = parseCsv<ParticipantRow>(csvText, "participants");
  if (!result.valid) {
    return { success: false, errors: result.errors, message: "資料驗證失敗，未匯入" };
  }

  const supabase = createServerSupabaseClient();

  // Clear existing then insert all (full replace for dev seed)
  await supabase.from("participants").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const rows = result.data.map((r) => ({
    participant_code: r.participant_code,
    name: r.name,
    email: r.email.toLowerCase(),
    diet_type: r.diet_type,
  }));

  const { error } = await supabase.from("participants").insert(rows);

  if (error) {
    return { success: false, message: `寫入失敗：${error.message}` };
  }

  return { success: true, importedCount: rows.length };
}

async function importStaff(csvText: string): Promise<CsvImportResult> {
  const result = parseCsv<StaffRow>(csvText, "staff");
  if (!result.valid) {
    return { success: false, errors: result.errors, message: "資料驗證失敗，未匯入" };
  }

  const supabase = createServerSupabaseClient();

  await supabase.from("staff_members").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const rows = result.data.map((r) => ({
    name: r.name,
    default_role: r.default_role || null,
    default_location: r.default_location || null,
    default_note_markdown: r.default_note_markdown || null,
  }));

  const { error } = await supabase.from("staff_members").insert(rows);

  if (error) {
    return { success: false, message: `寫入失敗：${error.message}` };
  }

  return { success: true, importedCount: rows.length };
}

async function importAgenda(csvText: string): Promise<CsvImportResult> {
  const result = parseCsv<AgendaRow>(csvText, "agenda");
  if (!result.valid) {
    return { success: false, errors: result.errors, message: "資料驗證失敗，未匯入" };
  }

  const supabase = createServerSupabaseClient();

  await supabase.from("agenda_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const rows = result.data.map((r) => ({
    sort_order: r.sort_order,
    time_label: r.time_label,
    stage_name: r.stage_name,
    task: r.task,
    description_markdown: r.description_markdown || null,
    notice_markdown: r.notice_markdown || null,
  }));

  const { error } = await supabase.from("agenda_items").insert(rows);

  if (error) {
    return { success: false, message: `寫入失敗：${error.message}` };
  }

  return { success: true, importedCount: rows.length };
}

async function importAssignments(csvText: string): Promise<CsvImportResult> {
  const result = parseCsv<AssignmentRow>(csvText, "assignments");
  if (!result.valid) {
    return { success: false, errors: result.errors, message: "資料驗證失敗，未匯入" };
  }

  const supabase = createServerSupabaseClient();

  // Lookup agenda items by sort_order
  const { data: agendaItems } = await supabase.from("agenda_items").select("id, sort_order");
  const agendaMap = new Map(agendaItems?.map((a) => [a.sort_order, a.id]) || []);

  // Lookup staff by name
  const { data: staffMembers } = await supabase.from("staff_members").select("id, name");
  const staffMap = new Map(staffMembers?.map((s) => [s.name, s.id]) || []);

  const errors: CsvImportResult["errors"] = [];
  const rows: Array<{
    agenda_item_id: string;
    staff_id: string;
    duty_label: string | null;
    location: string | null;
    incident_note_markdown: string | null;
  }> = [];

  for (let i = 0; i < result.data.length; i++) {
    const r = result.data[i];
    const agendaId = agendaMap.get(r.agenda_sort_order);
    const staffId = staffMap.get(r.staff_name);

    if (!agendaId) {
      errors!.push({
        row: i + 2,
        field: "agenda_sort_order",
        message: `找不到排序為 ${r.agenda_sort_order} 的議程`,
      });
      continue;
    }
    if (!staffId) {
      errors!.push({
        row: i + 2,
        field: "staff_name",
        message: `找不到名為「${r.staff_name}」的努努`,
      });
      continue;
    }

    rows.push({
      agenda_item_id: agendaId,
      staff_id: staffId,
      duty_label: r.duty_label || null,
      location: r.location || null,
      incident_note_markdown: r.incident_note_markdown || null,
    });
  }

  if (errors.length > 0) {
    return { success: false, errors, message: "部分資料對應失敗，未匯入" };
  }

  // Clear existing
  await supabase
    .from("staff_agenda_assignments")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  const { error } = await supabase.from("staff_agenda_assignments").insert(rows);

  if (error) {
    return { success: false, message: `寫入失敗：${error.message}` };
  }

  return { success: true, importedCount: rows.length };
}
