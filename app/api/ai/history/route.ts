import { NextResponse } from "next/server";
import { verifyParticipantSession } from "@/lib/auth/session";
import {
  getOrCreateConversation,
  getConversationMessages,
} from "@/lib/dal/ai-conversations";
import { enrichRelatedQuestionCodes } from "@/lib/ai/response-mapper";
import type { AIConversationHistoryResponse, AIMessageDTO } from "@/types/dto";

/**
 * GET /api/ai/history — Load conversation history for current participant.
 * Creates conversation if none exists.
 */
export async function GET() {
  const session = await verifyParticipantSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const conversationId = await getOrCreateConversation(
      session.participantId
    );
    const messages = await getConversationMessages(conversationId);

    // Enrich related questions for assistant messages
    const enrichedMessages: AIMessageDTO[] = await Promise.all(
      messages.map(async (msg) => {
        let relatedQuestions: AIMessageDTO["relatedQuestions"] = [];
        if (
          msg.role === "assistant" &&
          msg.related_question_codes &&
          msg.related_question_codes.length > 0
        ) {
          relatedQuestions = await enrichRelatedQuestionCodes(
            msg.related_question_codes
          );
        }

        return {
          id: msg.id,
          role: msg.role,
          content: msg.content,
          outcome: msg.outcome,
          relatedQuestions,
          draftQuestion: msg.draft_question ?? undefined,
          createdAt: msg.created_at,
        };
      })
    );

    const response: AIConversationHistoryResponse = {
      conversationId,
      messages: enrichedMessages,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("Failed to load conversation history:", err);
    return NextResponse.json(
      { error: "Failed to load history" },
      { status: 500 }
    );
  }
}
