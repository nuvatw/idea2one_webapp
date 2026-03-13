import { createServerSupabaseClient } from "@/lib/utils/supabase";

/**
 * Retrieval context for AI prompt.
 * Collects agenda, knowledge base, and answered Q&A to inject into the system prompt.
 */

export interface RetrievalContext {
  currentAgenda: string | null;
  fullAgenda: string;
  knowledgeBase: string;
  answeredQA: string;
}

/**
 * Gather all retrieval context for AI prompt injection.
 * Truncates each section to stay within token budget.
 */
export async function gatherRetrievalContext(): Promise<RetrievalContext> {
  const supabase = createServerSupabaseClient();

  const [currentAgenda, fullAgenda, knowledgeBase, answeredQA] =
    await Promise.all([
      fetchCurrentAgenda(supabase),
      fetchFullAgenda(supabase),
      fetchKnowledgeBase(supabase),
      fetchAnsweredQA(supabase),
    ]);

  return {
    currentAgenda,
    fullAgenda: truncate(fullAgenda, 3000),
    knowledgeBase: truncate(knowledgeBase, 3000),
    answeredQA: truncate(answeredQA, 3000),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchCurrentAgenda(supabase: any): Promise<string | null> {
  const { data: state } = await supabase
    .from("activity_state")
    .select("current_agenda_item_id")
    .eq("singleton_key", "current")
    .single();

  if (!state?.current_agenda_item_id) return null;

  const { data: item } = await supabase
    .from("agenda_items")
    .select("time_label, stage_name, task, description_markdown, notice_markdown")
    .eq("id", state.current_agenda_item_id)
    .single();

  if (!item) return null;

  return [
    `時間：${item.time_label}`,
    `階段：${item.stage_name}`,
    `任務：${item.task}`,
    item.description_markdown ? `說明：${item.description_markdown}` : null,
    item.notice_markdown ? `注意事項：${item.notice_markdown}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchFullAgenda(supabase: any): Promise<string> {
  const { data: items } = await supabase
    .from("agenda_items")
    .select("time_label, stage_name, task, description_markdown, notice_markdown")
    .order("sort_order", { ascending: true });

  if (!items || items.length === 0) return "（無 agenda 資料）";

  return items
    .map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (item: any) =>
        `- ${item.time_label} | ${item.stage_name} | ${item.task}${item.description_markdown ? ` | ${item.description_markdown}` : ""}${item.notice_markdown ? ` | 注意：${item.notice_markdown}` : ""}`
    )
    .join("\n");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchKnowledgeBase(supabase: any): Promise<string> {
  const { data: kb } = await supabase
    .from("knowledge_base_documents")
    .select("content_markdown")
    .eq("singleton_key", "main")
    .single();

  return kb?.content_markdown ?? "（無活動知識庫資料）";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAnsweredQA(supabase: any): Promise<string> {
  // Fetch answered questions with their first answer
  const { data: questions } = await supabase
    .from("questions")
    .select("question_code, content, status")
    .eq("status", "answered")
    .order("created_at", { ascending: false })
    .limit(30);

  if (!questions || questions.length === 0) return "（尚無已回答的問題）";

  const questionIds: string[] = [];
  const { data: fullQuestions } = await supabase
    .from("questions")
    .select("id, question_code")
    .eq("status", "answered")
    .order("created_at", { ascending: false })
    .limit(30);

  if (fullQuestions) {
    for (const q of fullQuestions) {
      questionIds.push(q.id);
    }
  }

  // Fetch answers for these questions
  const { data: answers } = await supabase
    .from("answers")
    .select("question_id, body")
    .in("question_id", questionIds.length > 0 ? questionIds : ["_none_"])
    .order("created_at", { ascending: true });

  // Build answer map: question_id → first answer body
  const answerMap: Record<string, string> = {};
  if (answers) {
    for (const a of answers) {
      if (!answerMap[a.question_id]) {
        answerMap[a.question_id] = a.body;
      }
    }
  }

  // Build Q&A context string
  const qaEntries: string[] = [];
  if (fullQuestions) {
    for (const q of fullQuestions) {
      const answer = answerMap[q.id] ?? "";
      const matchingContent = questions.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (qq: any) => qq.question_code === q.question_code
      );
      if (matchingContent) {
        qaEntries.push(
          `${q.question_code}: ${matchingContent.content}${answer ? `\n  回答：${answer}` : ""}`
        );
      }
    }
  }

  return qaEntries.length > 0 ? qaEntries.join("\n\n") : "（尚無已回答的問題）";
}

/**
 * Truncate text to a max character length, keeping whole lines where possible.
 */
function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const truncated = text.slice(0, maxChars);
  const lastNewline = truncated.lastIndexOf("\n");
  if (lastNewline > maxChars * 0.8) {
    return truncated.slice(0, lastNewline) + "\n...（已截斷）";
  }
  return truncated + "...（已截斷）";
}
