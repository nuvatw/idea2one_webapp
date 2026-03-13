"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/utils/supabase";
import {
  encodeParticipantSession,
  setParticipantSessionCookie,
  clearParticipantSessionCookie,
} from "@/lib/auth/session";
import { validateParticipantLogin } from "@/lib/validations/participant-login";

export type ParticipantLoginResult = {
  success: boolean;
  error?: {
    type: "validation" | "not_found" | "email_mismatch" | "system";
    message: string;
    fieldErrors?: { participantCode?: string; email?: string };
  };
};

export async function participantLogin(
  _prevState: ParticipantLoginResult | null,
  formData: FormData
): Promise<ParticipantLoginResult> {
  const participantCode = (formData.get("participantCode") as string) || "";
  const email = (formData.get("email") as string) || "";

  // 1. Client-side validation
  const validation = validateParticipantLogin({ participantCode, email });
  if (!validation.valid) {
    return {
      success: false,
      error: {
        type: "validation",
        message: "請修正以下欄位",
        fieldErrors: validation.errors,
      },
    };
  }

  try {
    const supabase = createServerSupabaseClient();
    const trimmedCode = participantCode.trim();
    const trimmedEmail = email.trim().toLowerCase();

    // 2. Look up by participant_code
    const { data: participant, error } = await supabase
      .from("participants")
      .select("id, participant_code, name, email")
      .eq("participant_code", trimmedCode)
      .single();

    if (error || !participant) {
      return {
        success: false,
        error: {
          type: "not_found",
          message: "編號查詢不到",
        },
      };
    }

    // 3. Compare email
    if (participant.email.toLowerCase() !== trimmedEmail) {
      return {
        success: false,
        error: {
          type: "email_mismatch",
          message: "信箱不正確，請確認行前信收件信箱或洽現場努努",
        },
      };
    }

    // 4. Create session
    const token = await encodeParticipantSession({
      role: "participant",
      participantId: participant.id,
      participantCode: participant.participant_code,
      name: participant.name,
    });

    await setParticipantSessionCookie(token);
  } catch {
    return {
      success: false,
      error: {
        type: "system",
        message: "系統暫時無法登入，請稍後再試或洽現場努努",
      },
    };
  }

  redirect("/home");
}

export async function participantLogout(): Promise<void> {
  await clearParticipantSessionCookie();
  redirect("/login");
}
