"use client";

import { useState, useRef, useCallback } from "react";
import type { AIAskResponse } from "@/types/dto";
import StatusBadge from "@/components/shared/StatusBadge";

type WidgetState =
  | "closed"
  | "open"
  | "asking"
  | "answered"
  | "uncertain"
  | "out_of_scope"
  | "error";

interface AIWidgetProps {
  onHandoff: (draft: string) => void;
}

/**
 * AI Widget — floating button + bottom sheet / panel.
 * Spec: fixed bottom-right, mobile bottom sheet, desktop floating panel.
 * States: closed / open / asking / answered / uncertain / out_of_scope / error
 * Per Spec: input 16px, hit area 44x44.
 */
export default function AIWidget({ onHandoff }: AIWidgetProps) {
  const [widgetState, setWidgetState] = useState<WidgetState>("closed");
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<AIAskResponse | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleToggle = useCallback(() => {
    setWidgetState((s) => (s === "closed" ? "open" : "closed"));
    // Reset state when opening
    if (widgetState === "closed") {
      setQuery("");
      setResponse(null);
    }
  }, [widgetState]);

  const handleClose = useCallback(() => {
    setWidgetState("closed");
    setQuery("");
    setResponse(null);
  }, []);

  const handleAsk = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setWidgetState("asking");
    setResponse(null);

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });

      if (res.status === 401) {
        // Session expired — redirect to login
        window.location.href = "/login";
        return;
      }

      const data: AIAskResponse = await res.json();
      setResponse(data);

      switch (data.outcome) {
        case "answered":
          setWidgetState("answered");
          break;
        case "uncertain":
          setWidgetState("uncertain");
          break;
        case "out_of_scope":
          setWidgetState("out_of_scope");
          break;
        default:
          setWidgetState("error");
          break;
      }
    } catch {
      setResponse({
        outcome: "error",
        answerText: "AI 目前正在午休中",
        relatedQuestions: [],
      });
      setWidgetState("error");
    }
  }, [query]);

  const handleHandoff = useCallback(() => {
    const draft = response?.draftQuestion ?? query;
    onHandoff(draft);
    handleClose();
  }, [response, query, onHandoff, handleClose]);

  const handleNewQuestion = useCallback(() => {
    setWidgetState("open");
    setQuery("");
    setResponse(null);
    // Focus the input after state update
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Floating button (always visible when closed)
  if (widgetState === "closed") {
    return (
      <button
        onClick={handleToggle}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500 text-white shadow-lg transition-all hover:scale-105 hover:bg-primary-600 hover:shadow-xl active:scale-95"
        aria-label="開啟 AI 助手"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <path d="M12 2a8 8 0 0 0-8 8c0 3.4 2.1 6.3 5 7.5V20a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2.5c2.9-1.2 5-4.1 5-7.5a8 8 0 0 0-8-8z" />
          <path d="M9 22h6" />
          <path d="M10 2v1" />
          <path d="M14 2v1" />
        </svg>
      </button>
    );
  }

  // Panel (open states)
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-warm-900/30 backdrop-blur-[2px]"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel — mobile bottom sheet / desktop floating panel */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85vh] max-w-screen-md flex-col rounded-t-2xl bg-surface-raised shadow-xl sm:bottom-5 sm:right-5 sm:left-auto sm:inset-x-auto sm:w-96 sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="AI 助手"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-warm-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-primary-500 animate-live" />
            <h3 className="text-sm font-semibold text-warm-800">AI 助手</h3>
          </div>
          <button
            onClick={handleClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-warm-400 transition-colors hover:bg-warm-100 hover:text-warm-600"
            aria-label="關閉 AI 助手"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {/* Response area */}
          {response && (
            <div className="mb-4 space-y-3">
              {/* Answer text */}
              <div
                className={`rounded-xl p-3 text-sm leading-relaxed ${
                  response.outcome === "error"
                    ? "bg-danger-50 text-danger-600"
                    : response.outcome === "out_of_scope"
                      ? "bg-warm-50 text-warm-700"
                      : response.outcome === "uncertain"
                        ? "bg-accent-50 text-accent-600"
                        : "bg-primary-50 text-warm-800"
                }`}
              >
                {response.answerText}
              </div>

              {/* Related questions (max 3) — using StatusBadge */}
              {response.relatedQuestions.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-warm-500">
                    相關問題
                  </p>
                  {response.relatedQuestions.map((rq) => (
                    <div
                      key={rq.code}
                      className="flex items-center gap-2 rounded-lg border border-warm-200 px-3 py-2 text-xs text-warm-700"
                    >
                      <span className="font-semibold text-primary-600">
                        {rq.code}
                      </span>
                      <StatusBadge
                        variant={rq.status === "answered" ? "answered" : "pending"}
                      />
                      <span className="flex-1 truncate">{rq.contentPreview}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Uncertain → handoff button */}
              {response.outcome === "uncertain" && (
                <button
                  onClick={handleHandoff}
                  className="min-h-[44px] w-full rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600"
                >
                  轉正式提問
                </button>
              )}

              {/* Error → suggest formal question */}
              {response.outcome === "error" && (
                <button
                  onClick={handleHandoff}
                  className="min-h-[44px] w-full rounded-xl border border-warm-200 px-4 py-2.5 text-sm font-medium text-warm-700 transition-colors hover:bg-warm-50"
                >
                  改用正式提問
                </button>
              )}

              {/* Ask another question */}
              {(response.outcome === "answered" ||
                response.outcome === "out_of_scope") && (
                <button
                  onClick={handleNewQuestion}
                  className="min-h-[44px] w-full rounded-xl border border-warm-200 px-4 py-2.5 text-sm font-medium text-warm-700 transition-colors hover:bg-warm-50"
                >
                  再問一個問題
                </button>
              )}
            </div>
          )}

          {/* Loading state */}
          {widgetState === "asking" && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-warm-50 p-3" role="status">
              <div className="flex gap-1" aria-hidden="true">
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary-400 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary-400 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary-400 [animation-delay:300ms]" />
              </div>
              <span className="text-sm text-warm-500">AI 正在思考中...</span>
            </div>
          )}
        </div>

        {/* Input area — always visible when not showing response */}
        {(widgetState === "open" || widgetState === "asking") && (
          <div className="border-t border-warm-100 px-4 py-3">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="問我活動相關問題..."
                rows={2}
                maxLength={500}
                disabled={widgetState === "asking"}
                className="flex-1 resize-none rounded-xl border border-warm-200 px-3 py-2 text-base placeholder:text-warm-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-warm-50 disabled:text-warm-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAsk();
                  }
                }}
              />
              <button
                onClick={handleAsk}
                disabled={widgetState === "asking" || !query.trim()}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center self-end rounded-xl bg-primary-500 text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="送出問題"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                </svg>
              </button>
            </div>
            <p className="mt-1 text-[11px] text-warm-400">
              按 Enter 送出，Shift + Enter 換行
            </p>
          </div>
        )}
      </div>
    </>
  );
}
