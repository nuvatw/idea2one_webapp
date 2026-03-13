"use client";

import { useState, useCallback, useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { QuestionSummary, QuestionDetail } from "@/types/dto";
import type { QuestionSource } from "@/types/domain";
import QAFilterBar, { type QAFilterState } from "./QAFilterBar";
import QuestionList from "./QuestionList";
import FormalQuestionComposer from "./FormalQuestionComposer";
import QuestionDetailModal from "./QuestionDetailModal";

interface QAPageClientProps {
  questions: QuestionSummary[];
  participantCode: string;
  initialFilters: QAFilterState;
  initialQuestionCode: string | null;
  initialQuestionDetail: QuestionDetail | null;
  initialPrefill?: string | null;
  initialSource?: QuestionSource;
}

/**
 * Client-side wrapper for the Q&A page.
 * Manages filter state, URL sync, modal open/close, and AI handoff.
 * Filtering is done client-side for instant response.
 */
export default function QAPageClient({
  questions,
  participantCode,
  initialFilters,
  initialQuestionCode,
  initialQuestionDetail,
  initialPrefill,
  initialSource,
}: QAPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [filters, setFilters] = useState<QAFilterState>(initialFilters);
  const [modalOpen, setModalOpen] = useState(!!initialQuestionCode);
  const [modalThread, setModalThread] = useState<QuestionDetail | null>(
    initialQuestionDetail
  );
  const [modalLoading, setModalLoading] = useState(false);

  // AI handoff prefill state
  const [composerPrefill, setComposerPrefill] = useState<string>(
    initialPrefill ?? ""
  );
  const [composerSource, setComposerSource] = useState<
    QuestionSource | undefined
  >(initialSource);

  // Sync filters to URL
  const handleFilterChange = useCallback(
    (newFilters: QAFilterState) => {
      setFilters(newFilters);

      const params = new URLSearchParams(searchParams.toString());
      if (newFilters.q) params.set("q", newFilters.q);
      else params.delete("q");

      if (newFilters.scope !== "all") params.set("scope", newFilters.scope);
      else params.delete("scope");

      if (newFilters.status !== "all") params.set("status", newFilters.status);
      else params.delete("status");

      // Keep question param if modal is open
      const qParam = params.get("question");
      if (!qParam) params.delete("question");

      // Clean up handoff params
      params.delete("prefill");
      params.delete("source");

      startTransition(() => {
        router.replace(`/qa?${params.toString()}`, { scroll: false });
      });
    },
    [searchParams, router]
  );

  // Open question detail modal
  const handleOpenQuestion = useCallback(
    async (questionCode: string) => {
      // Set URL param
      const params = new URLSearchParams(searchParams.toString());
      params.set("question", questionCode);
      startTransition(() => {
        router.replace(`/qa?${params.toString()}`, { scroll: false });
      });

      setModalOpen(true);
      setModalLoading(true);

      try {
        // Fetch question detail via server action (dynamic import to avoid bundling)
        const { getQuestionDetail } = await import("@/lib/dal/questions");
        const detail = await getQuestionDetail(questionCode);
        setModalThread(detail);
      } catch {
        setModalThread(null);
      } finally {
        setModalLoading(false);
      }
    },
    [searchParams, router]
  );

  // Close modal
  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setModalThread(null);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("question");
    startTransition(() => {
      router.replace(`/qa?${params.toString()}`, { scroll: false });
    });
  }, [searchParams, router]);

  // Handle new question created — switch to "my questions" filter so user sees it
  const handleQuestionCreated = useCallback(
    (_questionCode: string) => {
      // Clear handoff state after question is created
      setComposerPrefill("");
      setComposerSource(undefined);

      // Switch filter to "mine" so the user sees their submitted question
      const newFilters: QAFilterState = { q: "", scope: "mine", status: "all" };
      setFilters(newFilters);

      // Refresh the page to get the new question in the SSR data
      startTransition(() => {
        router.refresh();
      });

      // Sync URL with new filter
      const params = new URLSearchParams();
      params.set("scope", "mine");
      startTransition(() => {
        router.replace(`/qa?${params.toString()}`, { scroll: false });
      });
    },
    [router]
  );

  // Client-side filtering
  const filteredQuestions = useMemo(() => {
    let result = questions;

    // Scope filter
    if (filters.scope === "mine") {
      result = result.filter((q) => q.participant_code === participantCode);
    }

    // Status filter
    if (filters.status === "answered") {
      result = result.filter((q) => q.status === "answered");
    }

    // Keyword / question code search
    if (filters.q.trim()) {
      const search = filters.q.trim().toLowerCase();
      result = result.filter(
        (q) =>
          q.question_code.toLowerCase().includes(search) ||
          q.content.toLowerCase().includes(search)
      );
    }

    return result;
  }, [questions, filters, participantCode]);

  // Determine empty message
  const emptyMessage = useMemo(() => {
    if (questions.length === 0) return "目前還沒有公開問題";
    if (filteredQuestions.length === 0) return "找不到符合條件的問題";
    return undefined;
  }, [questions, filteredQuestions]);

  return (
    <div className="space-y-4">
      <QAFilterBar filters={filters} onChange={handleFilterChange} />

      <QuestionList
        items={filteredQuestions}
        onOpenQuestion={handleOpenQuestion}
        emptyMessage={emptyMessage}
      />

      <div id="formal-question-composer">
        <FormalQuestionComposer
          prefill={composerPrefill || undefined}
          source={composerSource}
          onQuestionCreated={handleQuestionCreated}
        />
      </div>

      <QuestionDetailModal
        thread={modalThread}
        open={modalOpen}
        onClose={handleCloseModal}
        loading={modalLoading}
      />
    </div>
  );
}
