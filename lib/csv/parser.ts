import Papa from "papaparse";

// --- Types ---

export type CsvKind = "participants" | "staff" | "agenda" | "assignments";

export interface CsvRowError {
  row: number;
  field: string;
  message: string;
}

export interface CsvParseResult<T> {
  valid: boolean;
  data: T[];
  errors: CsvRowError[];
}

// --- Row Types ---

export interface ParticipantRow {
  participant_code: string;
  name: string;
  email: string;
  diet_type: "葷" | "素";
}

export interface StaffRow {
  name: string;
  default_role: string;
  default_location: string;
  default_note_markdown: string;
}

export interface AgendaRow {
  sort_order: number;
  time_label: string;
  stage_name: string;
  task: string;
  description_markdown: string;
  notice_markdown: string;
}

export interface AssignmentRow {
  agenda_sort_order: number;
  staff_name: string;
  duty_label: string;
  location: string;
  incident_note_markdown: string;
}

// --- Validators ---

function validateParticipantRow(
  row: Record<string, string>,
  index: number
): { data: ParticipantRow | null; errors: CsvRowError[] } {
  const errors: CsvRowError[] = [];
  const rowNum = index + 2; // 1-indexed + header row

  const code = (row["participant_code"] || "").trim();
  if (!code) {
    errors.push({ row: rowNum, field: "participant_code", message: "學員編號不可為空" });
  } else if (!/^\d{3}$/.test(code)) {
    errors.push({ row: rowNum, field: "participant_code", message: "學員編號須為 3 碼數字" });
  }

  const name = (row["name"] || "").trim();
  if (!name) {
    errors.push({ row: rowNum, field: "name", message: "姓名不可為空" });
  }

  const email = (row["email"] || "").trim().toLowerCase();
  if (!email) {
    errors.push({ row: rowNum, field: "email", message: "信箱不可為空" });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ row: rowNum, field: "email", message: "信箱格式不正確" });
  }

  const diet = (row["diet_type"] || "").trim();
  if (!diet) {
    errors.push({ row: rowNum, field: "diet_type", message: "飲食別不可為空" });
  } else if (diet !== "葷" && diet !== "素") {
    errors.push({ row: rowNum, field: "diet_type", message: "飲食別須為「葷」或「素」" });
  }

  if (errors.length > 0) return { data: null, errors };

  return {
    data: {
      participant_code: code,
      name,
      email,
      diet_type: diet as "葷" | "素",
    },
    errors: [],
  };
}

function validateStaffRow(
  row: Record<string, string>,
  index: number
): { data: StaffRow | null; errors: CsvRowError[] } {
  const errors: CsvRowError[] = [];
  const rowNum = index + 2;

  const name = (row["name"] || "").trim();
  if (!name) {
    errors.push({ row: rowNum, field: "name", message: "姓名不可為空" });
  }

  if (errors.length > 0) return { data: null, errors };

  return {
    data: {
      name,
      default_role: (row["default_role"] || "").trim(),
      default_location: (row["default_location"] || "").trim(),
      default_note_markdown: (row["default_note_markdown"] || "").trim(),
    },
    errors: [],
  };
}

function validateAgendaRow(
  row: Record<string, string>,
  index: number
): { data: AgendaRow | null; errors: CsvRowError[] } {
  const errors: CsvRowError[] = [];
  const rowNum = index + 2;

  const sortOrder = parseInt(row["sort_order"] || "", 10);
  if (isNaN(sortOrder)) {
    errors.push({ row: rowNum, field: "sort_order", message: "排序須為數字" });
  }

  const timeLabel = (row["time_label"] || "").trim();
  if (!timeLabel) {
    errors.push({ row: rowNum, field: "time_label", message: "時間不可為空" });
  }

  const stageName = (row["stage_name"] || "").trim();
  if (!stageName) {
    errors.push({ row: rowNum, field: "stage_name", message: "階段名稱不可為空" });
  }

  const task = (row["task"] || "").trim();
  if (!task) {
    errors.push({ row: rowNum, field: "task", message: "任務不可為空" });
  }

  if (errors.length > 0) return { data: null, errors };

  return {
    data: {
      sort_order: sortOrder,
      time_label: timeLabel,
      stage_name: stageName,
      task,
      description_markdown: (row["description_markdown"] || "").trim(),
      notice_markdown: (row["notice_markdown"] || "").trim(),
    },
    errors: [],
  };
}

function validateAssignmentRow(
  row: Record<string, string>,
  index: number
): { data: AssignmentRow | null; errors: CsvRowError[] } {
  const errors: CsvRowError[] = [];
  const rowNum = index + 2;

  const sortOrder = parseInt(row["agenda_sort_order"] || "", 10);
  if (isNaN(sortOrder)) {
    errors.push({ row: rowNum, field: "agenda_sort_order", message: "議程排序須為數字" });
  }

  const staffName = (row["staff_name"] || "").trim();
  if (!staffName) {
    errors.push({ row: rowNum, field: "staff_name", message: "努努姓名不可為空" });
  }

  if (errors.length > 0) return { data: null, errors };

  return {
    data: {
      agenda_sort_order: sortOrder,
      staff_name: staffName,
      duty_label: (row["duty_label"] || "").trim(),
      location: (row["location"] || "").trim(),
      incident_note_markdown: (row["incident_note_markdown"] || "").trim(),
    },
    errors: [],
  };
}

// --- Main Parser ---

export function parseCsv<T>(
  csvText: string,
  kind: CsvKind
): CsvParseResult<T> {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  });

  if (parsed.errors.length > 0) {
    return {
      valid: false,
      data: [],
      errors: parsed.errors.map((e, i) => ({
        row: e.row !== undefined ? e.row + 2 : i + 2,
        field: "csv",
        message: e.message,
      })),
    };
  }

  const allData: T[] = [];
  const allErrors: CsvRowError[] = [];

  const validators: Record<CsvKind, (row: Record<string, string>, i: number) => { data: unknown; errors: CsvRowError[] }> = {
    participants: validateParticipantRow,
    staff: validateStaffRow,
    agenda: validateAgendaRow,
    assignments: validateAssignmentRow,
  };

  const validator = validators[kind];

  for (let i = 0; i < parsed.data.length; i++) {
    const result = validator(parsed.data[i], i);
    if (result.errors.length > 0) {
      allErrors.push(...result.errors);
    } else if (result.data) {
      allData.push(result.data as T);
    }
  }

  // Duplicate check for participants
  if (kind === "participants") {
    const codes = new Set<string>();
    for (let i = 0; i < allData.length; i++) {
      const row = allData[i] as unknown as ParticipantRow;
      if (codes.has(row.participant_code)) {
        allErrors.push({
          row: i + 2,
          field: "participant_code",
          message: `重複的學員編號：${row.participant_code}`,
        });
      }
      codes.add(row.participant_code);
    }
  }

  // Duplicate check for staff names
  if (kind === "staff") {
    const names = new Set<string>();
    for (let i = 0; i < allData.length; i++) {
      const row = allData[i] as unknown as StaffRow;
      if (names.has(row.name)) {
        allErrors.push({
          row: i + 2,
          field: "name",
          message: `重複的努努姓名：${row.name}`,
        });
      }
      names.add(row.name);
    }
  }

  // Duplicate check for agenda sort_order
  if (kind === "agenda") {
    const orders = new Set<number>();
    for (let i = 0; i < allData.length; i++) {
      const row = allData[i] as unknown as AgendaRow;
      if (orders.has(row.sort_order)) {
        allErrors.push({
          row: i + 2,
          field: "sort_order",
          message: `重複的排序編號：${row.sort_order}`,
        });
      }
      orders.add(row.sort_order);
    }
  }

  return {
    valid: allErrors.length === 0,
    data: allErrors.length === 0 ? allData : [],
    errors: allErrors,
  };
}
