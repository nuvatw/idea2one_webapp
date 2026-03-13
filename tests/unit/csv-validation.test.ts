import { describe, it, expect } from "vitest";
import {
  parseCsv,
  type ParticipantRow,
  type StaffRow,
  type AgendaRow,
  type AssignmentRow,
} from "@/lib/csv/parser";

// --- Participant CSV ---

describe("CSV parser: participants", () => {
  it("parses valid participant CSV", () => {
    const csv = `participant_code,name,email,diet_type
001,Alice,alice@example.com,葷
002,Bob,bob@example.com,素`;

    const result = parseCsv<ParticipantRow>(csv, "participants");
    expect(result.valid).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].participant_code).toBe("001");
    expect(result.data[0].name).toBe("Alice");
    expect(result.data[0].email).toBe("alice@example.com");
    expect(result.data[0].diet_type).toBe("葷");
    expect(result.data[1].diet_type).toBe("素");
  });

  it("lowercases email", () => {
    const csv = `participant_code,name,email,diet_type
001,Alice,ALICE@Example.COM,葷`;

    const result = parseCsv<ParticipantRow>(csv, "participants");
    expect(result.valid).toBe(true);
    expect(result.data[0].email).toBe("alice@example.com");
  });

  it("trims whitespace in fields", () => {
    const csv = `participant_code,name,email,diet_type
 001 , Alice , alice@example.com , 葷`;

    const result = parseCsv<ParticipantRow>(csv, "participants");
    expect(result.valid).toBe(true);
    expect(result.data[0].participant_code).toBe("001");
    expect(result.data[0].name).toBe("Alice");
  });

  it("rejects empty participant_code", () => {
    const csv = `participant_code,name,email,diet_type
,Alice,alice@example.com,葷`;

    const result = parseCsv<ParticipantRow>(csv, "participants");
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe("participant_code");
    expect(result.errors[0].message).toContain("不可為空");
  });

  it("rejects non-3-digit participant_code", () => {
    const csv = `participant_code,name,email,diet_type
01,Alice,alice@example.com,葷`;

    const result = parseCsv<ParticipantRow>(csv, "participants");
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe("participant_code");
    expect(result.errors[0].message).toContain("3 碼數字");
  });

  it("rejects empty name", () => {
    const csv = `participant_code,name,email,diet_type
001,,alice@example.com,葷`;

    const result = parseCsv<ParticipantRow>(csv, "participants");
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe("name");
  });

  it("rejects empty email", () => {
    const csv = `participant_code,name,email,diet_type
001,Alice,,葷`;

    const result = parseCsv<ParticipantRow>(csv, "participants");
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe("email");
  });

  it("rejects invalid email format", () => {
    const csv = `participant_code,name,email,diet_type
001,Alice,notanemail,葷`;

    const result = parseCsv<ParticipantRow>(csv, "participants");
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe("email");
    expect(result.errors[0].message).toContain("格式");
  });

  it("rejects invalid diet_type", () => {
    const csv = `participant_code,name,email,diet_type
001,Alice,alice@example.com,meat`;

    const result = parseCsv<ParticipantRow>(csv, "participants");
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe("diet_type");
  });

  it("rejects empty diet_type", () => {
    const csv = `participant_code,name,email,diet_type
001,Alice,alice@example.com,`;

    const result = parseCsv<ParticipantRow>(csv, "participants");
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe("diet_type");
  });

  it("detects duplicate participant_code", () => {
    const csv = `participant_code,name,email,diet_type
001,Alice,alice@example.com,葷
001,Bob,bob@example.com,素`;

    const result = parseCsv<ParticipantRow>(csv, "participants");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("重複"))).toBe(true);
  });

  it("reports correct row numbers (1-indexed + header)", () => {
    const csv = `participant_code,name,email,diet_type
001,Alice,alice@example.com,葷
,Bob,bob@example.com,素`;

    const result = parseCsv<ParticipantRow>(csv, "participants");
    expect(result.valid).toBe(false);
    // Second data row = index 1 → row 1 + 2 = 3
    expect(result.errors[0].row).toBe(3);
  });

  it("collects multiple errors from one row", () => {
    const csv = `participant_code,name,email,diet_type
,,invalid,bad`;

    const result = parseCsv<ParticipantRow>(csv, "participants");
    expect(result.valid).toBe(false);
    // Should have errors for code, name, email format, diet_type
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it("returns empty data on validation failure", () => {
    const csv = `participant_code,name,email,diet_type
,,invalid,bad`;

    const result = parseCsv<ParticipantRow>(csv, "participants");
    expect(result.data).toEqual([]);
  });

  it("skips empty lines", () => {
    const csv = `participant_code,name,email,diet_type
001,Alice,alice@example.com,葷

002,Bob,bob@example.com,素`;

    const result = parseCsv<ParticipantRow>(csv, "participants");
    expect(result.valid).toBe(true);
    expect(result.data).toHaveLength(2);
  });
});

// --- Staff CSV ---

describe("CSV parser: staff", () => {
  it("parses valid staff CSV", () => {
    const csv = `name,default_role,default_location,default_note_markdown
Amy,報到組,大門,注意事項`;

    const result = parseCsv<StaffRow>(csv, "staff");
    expect(result.valid).toBe(true);
    expect(result.data[0].name).toBe("Amy");
    expect(result.data[0].default_role).toBe("報到組");
  });

  it("rejects empty staff name", () => {
    const csv = `name,default_role,default_location,default_note_markdown
,報到組,大門,`;

    const result = parseCsv<StaffRow>(csv, "staff");
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe("name");
  });

  it("allows optional fields to be empty", () => {
    const csv = `name,default_role,default_location,default_note_markdown
Amy,,,`;

    const result = parseCsv<StaffRow>(csv, "staff");
    expect(result.valid).toBe(true);
    expect(result.data[0].default_role).toBe("");
    expect(result.data[0].default_location).toBe("");
  });

  it("detects duplicate staff names", () => {
    const csv = `name,default_role,default_location,default_note_markdown
Amy,報到組,大門,
Amy,午餐組,餐廳,`;

    const result = parseCsv<StaffRow>(csv, "staff");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("重複"))).toBe(true);
  });
});

// --- Agenda CSV ---

describe("CSV parser: agenda", () => {
  it("parses valid agenda CSV", () => {
    const csv = `sort_order,time_label,stage_name,task,description_markdown,notice_markdown
1,09:30,報到,簽到,請出示證件,`;

    const result = parseCsv<AgendaRow>(csv, "agenda");
    expect(result.valid).toBe(true);
    expect(result.data[0].sort_order).toBe(1);
    expect(result.data[0].time_label).toBe("09:30");
    expect(result.data[0].stage_name).toBe("報到");
    expect(result.data[0].task).toBe("簽到");
  });

  it("rejects non-numeric sort_order", () => {
    const csv = `sort_order,time_label,stage_name,task,description_markdown,notice_markdown
abc,09:30,報到,簽到,,`;

    const result = parseCsv<AgendaRow>(csv, "agenda");
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe("sort_order");
  });

  it("rejects empty required fields", () => {
    const csv = `sort_order,time_label,stage_name,task,description_markdown,notice_markdown
1,,,,,`;

    const result = parseCsv<AgendaRow>(csv, "agenda");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it("detects duplicate sort_order", () => {
    const csv = `sort_order,time_label,stage_name,task,description_markdown,notice_markdown
1,09:30,報到,簽到,,
1,10:00,開幕,致詞,,`;

    const result = parseCsv<AgendaRow>(csv, "agenda");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("重複"))).toBe(true);
  });

  it("allows empty optional fields", () => {
    const csv = `sort_order,time_label,stage_name,task,description_markdown,notice_markdown
1,09:30,報到,簽到,,`;

    const result = parseCsv<AgendaRow>(csv, "agenda");
    expect(result.valid).toBe(true);
    expect(result.data[0].description_markdown).toBe("");
    expect(result.data[0].notice_markdown).toBe("");
  });
});

// --- Assignment CSV ---

describe("CSV parser: assignments", () => {
  it("parses valid assignment CSV", () => {
    const csv = `agenda_sort_order,staff_name,duty_label,location,incident_note_markdown
1,Amy,報到引導,大門,`;

    const result = parseCsv<AssignmentRow>(csv, "assignments");
    expect(result.valid).toBe(true);
    expect(result.data[0].agenda_sort_order).toBe(1);
    expect(result.data[0].staff_name).toBe("Amy");
  });

  it("rejects non-numeric agenda_sort_order", () => {
    const csv = `agenda_sort_order,staff_name,duty_label,location,incident_note_markdown
abc,Amy,,,`;

    const result = parseCsv<AssignmentRow>(csv, "assignments");
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe("agenda_sort_order");
  });

  it("rejects empty staff_name", () => {
    const csv = `agenda_sort_order,staff_name,duty_label,location,incident_note_markdown
1,,,,`;

    const result = parseCsv<AssignmentRow>(csv, "assignments");
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe("staff_name");
  });

  it("allows optional fields to be empty", () => {
    const csv = `agenda_sort_order,staff_name,duty_label,location,incident_note_markdown
1,Amy,,,`;

    const result = parseCsv<AssignmentRow>(csv, "assignments");
    expect(result.valid).toBe(true);
    expect(result.data[0].duty_label).toBe("");
    expect(result.data[0].location).toBe("");
  });
});
