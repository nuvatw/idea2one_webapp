import { NextRequest, NextResponse } from "next/server";
import { verifyParticipantSession } from "@/lib/auth/session";
import { gatherRetrievalContext } from "@/lib/ai/retrieval";
import { buildSystemPrompt, buildUserMessage } from "@/lib/ai/prompt";
import { mapAIResponse } from "@/lib/ai/response-mapper";
import { createServerSupabaseClient } from "@/lib/utils/supabase";
import type { AiOutcome } from "@/types/domain";
import OpenAI from "openai";

const AI_TIMEOUT_MS = 15_000;

/**
 * POST /api/ai/ask — AI 助手 Route Handler
 * Requires participant session. Server-only AI provider call.
 */
export async function POST(request: NextRequest) {
  // 1. Verify participant session
  const session = await verifyParticipantSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse request body
  let query: string;
  try {
    const body = await request.json();
    query = typeof body.query === "string" ? body.query.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!query || query.length === 0) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  if (query.length > 500) {
    return NextResponse.json(
      { error: "Query too long (max 500 chars)" },
      { status: 400 }
    );
  }

  // 3. Check API key availability
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    await logAIInteraction(session.participantId, query, "error", []);
    return NextResponse.json(
      {
        outcome: "error",
        answerText: "AI 目前正在午休中",
        relatedQuestions: [],
      },
      { status: 503 }
    );
  }

  // 4. Gather retrieval context
  let context;
  try {
    context = await gatherRetrievalContext();
  } catch (err) {
    console.error("Failed to gather retrieval context:", err);
    await logAIInteraction(session.participantId, query, "error", []);
    return NextResponse.json(
      {
        outcome: "error",
        answerText: "AI 目前正在午休中",
        relatedQuestions: [],
      },
      { status: 503 }
    );
  }

  // 5. Call AI provider with timeout
  try {
    const openai = new OpenAI({ apiKey });
    const model = process.env.AI_MODEL ?? "gpt-4o-mini";

    const systemPrompt = buildSystemPrompt(context);
    const userMessage = buildUserMessage(query);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    let rawText: string;
    try {
      const completion = await openai.chat.completions.create(
        {
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          temperature: 0.3,
          max_tokens: 800,
        },
        { signal: controller.signal }
      );
      rawText = completion.choices[0]?.message?.content ?? "";
    } finally {
      clearTimeout(timeout);
    }

    if (!rawText) {
      await logAIInteraction(session.participantId, query, "error", []);
      return NextResponse.json(
        {
          outcome: "error",
          answerText: "AI 目前正在午休中",
          relatedQuestions: [],
        },
        { status: 503 }
      );
    }

    // 6. Parse and map response
    const { response, outcome } = await mapAIResponse(rawText);

    // 7. Log interaction
    const relatedCodes = response.relatedQuestions.map((rq) => rq.code);
    await logAIInteraction(
      session.participantId,
      query,
      outcome,
      relatedCodes
    );

    return NextResponse.json(response);
  } catch (err) {
    console.error("AI provider error:", err);
    await logAIInteraction(session.participantId, query, "error", []);
    return NextResponse.json(
      {
        outcome: "error",
        answerText: "AI 目前正在午休中",
        relatedQuestions: [],
      },
      { status: 503 }
    );
  }
}

/**
 * Log AI interaction to the database (best-effort, never throws).
 */
async function logAIInteraction(
  participantId: string,
  prompt: string,
  outcome: AiOutcome,
  relatedQuestionCodes: string[]
) {
  try {
    const supabase = createServerSupabaseClient();
    await supabase.from("ai_logs").insert({
      participant_id: participantId,
      prompt,
      outcome,
      related_question_codes:
        relatedQuestionCodes.length > 0 ? relatedQuestionCodes : null,
    });
  } catch (err) {
    console.error("Failed to log AI interaction:", err);
  }
}
