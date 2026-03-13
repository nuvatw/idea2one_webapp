"use server";

import { revalidatePath } from "next/cache";
import { requireStaffIdentity } from "@/lib/dal/auth-check";
import { createServerSupabaseClient } from "@/lib/utils/supabase";

export interface SaveKnowledgeResult {
  success: boolean;
  error?: string;
  updatedAt?: string;
  updatedByName?: string;
}

/**
 * Server Action: Save knowledge base content (Markdown).
 * Last-write-wins — no version history.
 */
export async function saveKnowledgeBase(
  _prevState: SaveKnowledgeResult | null,
  formData: FormData
): Promise<SaveKnowledgeResult> {
  const session = await requireStaffIdentity();
  const contentMarkdown = formData.get("content_markdown") as string;

  if (contentMarkdown === null || contentMarkdown === undefined) {
    return { success: false, error: "缺少內容" };
  }

  const supabase = createServerSupabaseClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("knowledge_base_documents")
    .update({
      content_markdown: contentMarkdown,
      updated_by_staff_id: session.selectedStaffId,
      updated_at: now,
    })
    .eq("singleton_key", "main");

  if (error) {
    console.error("Failed to save knowledge base:", error);
    return { success: false, error: "儲存失敗，請稍後再試" };
  }

  revalidatePath("/staff");
  revalidatePath("/home");

  return {
    success: true,
    updatedAt: now,
    updatedByName: session.selectedStaffName,
  };
}
