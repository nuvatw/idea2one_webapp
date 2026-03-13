import type { AiOutcome } from "@/types/domain";
import type { AIAskResponse } from "@/types/dto";
import { createServerSupabaseClient } from "@/lib/utils/supabase";

/**
 * Parse raw AI provider response text into structured AIAskResponse.
 * Handles JSON parsing, validation, and related question enrichment.
 */

interface RawAIResponse {
  outcome?: string;
  answerText?: string;
  relatedQuestionCodes?: string[];
  draftQuestion?: string;
}

/**
 * Map raw AI response text to AIAskResponse.
 * Falls back to error if parsing fails.
 */
export async function mapAIResponse(
  rawText: string
): Promise<{ response: AIAskResponse; outcome: AiOutcome }> {
  let parsed: RawAIResponse;

  try {
    // Strip potential markdown code fences
    const cleaned = rawText
      .replace(/^```json\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    // AI returned unparseable response — treat as error
    return {
      response: {
        outcome: "error",
        answerText: "AI 目前正在午休中",
        relatedQuestions: [],
      },
      outcome: "error",
    };
  }

  const outcome = validateOutcome(parsed.outcome);
  const answerText = parsed.answerText ?? "";
  const draftQuestion =
    outcome === "uncertain" ? (parsed.draftQuestion ?? undefined) : undefined;

  // Enrich related question codes with status and content preview
  const relatedQuestions = await enrichRelatedQuestions(
    parsed.relatedQuestionCodes ?? []
  );

  return {
    response: {
      outcome,
      answerText,
      relatedQuestions,
      draftQuestion,
    },
    outcome,
  };
}

function validateOutcome(raw: string | undefined): AIAskResponse["outcome"] {
  if (raw === "answered" || raw === "uncertain" || raw === "out_of_scope") {
    return raw;
  }
  return "error";
}

/**
 * Fetch related questions from DB to enrich the response.
 * Returns at most 3 related questions.
 */
async function enrichRelatedQuestions(
  codes: string[]
): Promise<AIAskResponse["relatedQuestions"]> {
  if (codes.length === 0) return [];

  const supabase = createServerSupabaseClient();
  const limitedCodes = codes.slice(0, 3);

  const { data: questions } = await supabase
    .from("questions")
    .select("question_code, content, status")
    .in("question_code", limitedCodes);

  if (!questions) return [];

  return questions.map((q) => ({
    code: q.question_code,
    status: q.status as "pending" | "answered",
    contentPreview:
      q.content.length > 60 ? q.content.slice(0, 60) + "..." : q.content,
  }));
}
