"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import AIWidget from "./AIWidget";

/**
 * AI Widget wrapper for /home page.
 * On handoff: navigates to /qa with draft prefill via URL param.
 */
export default function HomeAIWidget() {
  const router = useRouter();

  const handleHandoff = useCallback(
    (draft: string) => {
      const params = new URLSearchParams();
      params.set("prefill", draft);
      params.set("source", "ai_handoff");
      router.push(`/qa?${params.toString()}`);
    },
    [router]
  );

  return <AIWidget onHandoff={handleHandoff} />;
}
