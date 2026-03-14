"use client";

import { useState, useCallback, useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { QuestionSummary, QuestionDetail } from "@/types/dto";
import type { QuestionSource } from "@/types/domain";
import QAFilterBar, { type QAFilterState } from "./QAFilterBar";
import QuestionList from "./QuestionList";
import FormalQuestionComposer from "./FormalQuestionComposer";
import QuestionDetailModal from "./QuestionDetailModal";

const PAGE_SIZE = 10;

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

  // Composing mode: show form, hide question list
  const [isComposing, setIsComposing] = useState(!!initialPrefill);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

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
      setCurrentPage(1); // Reset to first page on filter change

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

  // Toggle compose mode
  const handleToggleCompose = useCallback(() => {
    setIsComposing((prev) => !prev);
  }, []);

  // Handle new question created — switch to "my questions" filter so user sees it
  const handleQuestionCreated = useCallback(
    (_questionCode: string) => {
      // Clear handoff state after question is created
      setComposerPrefill("");
      setComposerSource(undefined);

      // Exit composing mode
      setIsComposing(false);

      // Switch filter to "mine" so the user sees their submitted question
      const newFilters: QAFilterState = { q: "", scope: "mine", status: "all" };
      setFilters(newFilters);
      setCurrentPage(1);

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

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedQuestions = filteredQuestions.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  // Determine empty message
  const emptyMessage = useMemo(() => {
    if (questions.length === 0) return "目前還沒有公開問題";
    if (filteredQuestions.length === 0) return "找不到符合條件的問題";
    return undefined;
  }, [questions, filteredQuestions]);

  return (
    <div className="space-y-4">
      <QAFilterBar
        filters={filters}
        onChange={handleFilterChange}
        isComposing={isComposing}
        onToggleCompose={handleToggleCompose}
      />

      {isComposing ? (
        <div id="formal-question-composer">
          <FormalQuestionComposer
            prefill={composerPrefill || undefined}
            source={composerSource}
            onQuestionCreated={handleQuestionCreated}
          />
        </div>
      ) : (
        <>
          <QuestionList
            items={paginatedQuestions}
            onOpenQuestion={handleOpenQuestion}
            emptyMessage={emptyMessage}
          />

          {totalPages > 1 && (
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      <QuestionDetailModal
        thread={modalThread}
        open={modalOpen}
        onClose={handleCloseModal}
        loading={modalLoading}
        participantCode={participantCode}
        onCommentCreated={async () => {
          // Re-fetch question detail without resetting modal loading state
          if (modalThread?.question_code) {
            try {
              const { getQuestionDetail } = await import("@/lib/dal/questions");
              const detail = await getQuestionDetail(modalThread.question_code);
              setModalThread(detail);
            } catch {
              // silently fail — user can close and reopen
            }
          }
        }}
      />
    </div>
  );
}

/* ── Pagination ── */

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = buildPageNumbers(currentPage, totalPages);

  return (
    <nav aria-label="分頁" className="flex items-center justify-center gap-1 pt-2">
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="min-h-[44px] min-w-[44px] rounded-lg px-2 text-sm text-warm-500 transition-colors hover:bg-warm-100 disabled:cursor-not-allowed disabled:opacity-30"
        aria-label="上一頁"
      >
        &lsaquo;
      </button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="min-h-[44px] min-w-[36px] flex items-center justify-center text-sm text-warm-400"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p as number)}
            className={`min-h-[44px] min-w-[44px] rounded-lg px-2 text-sm font-medium transition-colors ${
              p === currentPage
                ? "bg-primary-500 text-white"
                : "text-warm-600 hover:bg-warm-100"
            }`}
            aria-current={p === currentPage ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="min-h-[44px] min-w-[44px] rounded-lg px-2 text-sm text-warm-500 transition-colors hover:bg-warm-100 disabled:cursor-not-allowed disabled:opacity-30"
        aria-label="下一頁"
      >
        &rsaquo;
      </button>
    </nav>
  );
}

/**
 * Build page number array with ellipsis, e.g. [1, 2, 3, '...', 10]
 * Always shows first, last, and up to 2 pages around current.
 */
function buildPageNumbers(
  current: number,
  total: number
): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];
  const around = new Set<number>();

  // Always show first and last
  around.add(1);
  around.add(total);

  // Pages around current
  for (let i = current - 2; i <= current + 2; i++) {
    if (i >= 1 && i <= total) around.add(i);
  }

  const sorted = [...around].sort((a, b) => a - b);

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      pages.push("...");
    }
    pages.push(sorted[i]);
  }

  return pages;
}
