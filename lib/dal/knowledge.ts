"use server";

import { createServerSupabaseClient } from "@/lib/utils/supabase";
import type { KnowledgeBaseDocument } from "@/types/domain";

/**
 * Fetch the knowledge base document (singleton).
 */
export async function getKnowledgeBase(): Promise<KnowledgeBaseDocument | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("knowledge_base_documents")
    .select("*")
    .eq("singleton_key", "main")
    .single();

  if (error) {
    console.error("Failed to fetch knowledge base:", error);
    return null;
  }

  return data as KnowledgeBaseDocument;
}
