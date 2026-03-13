"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { AIAskResponse } from "@/types/dto";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  outcome?: AIAskResponse["outcome"];
  relatedQuestions?: AIAskResponse["relatedQuestions"];
  draftQuestion?: string;
};

const SUGGESTED_QUESTIONS = [
  "現在進行到哪個階段了？",
  "下一個活動是什麼？",
  "午餐怎麼領取？",
];

export default function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSend = useCallback(
    async (text?: string) => {
      const trimmed = (text ?? input).trim();
      if (!trimmed || isLoading) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = "48px";
      }

      try {
        const res = await fetch("/api/ai/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed }),
        });

        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }

        const data: AIAskResponse = await res.json();
        const aiMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.answerText,
          outcome: data.outcome,
          relatedQuestions: data.relatedQuestions,
          draftQuestion: data.draftQuestion,
        };

        setMessages((prev) => [...prev, aiMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "抱歉，目前無法連線到 AI 服務，請稍後再試。",
            outcome: "error" as const,
            relatedQuestions: [],
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading],
  );

  const handleSubmitQuestion = useCallback((draft: string) => {
    const params = new URLSearchParams();
    params.set("prefill", draft);
    params.set("source", "ai_handoff");
    window.location.href = `/qa?${params.toString()}`;
  }, []);

  return (
    <div className="flex h-[calc(100dvh-88px)] flex-col bg-surface">
      {/* Header */}
      <header className="flex items-center justify-center border-b border-warm-100 bg-surface-raised px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-primary-500 animate-live" />
          <h2 className="text-base font-bold text-warm-800">AI 助手</h2>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        {messages.length === 0 ? (
          /* Empty / Welcome state */
          <div className="flex h-full flex-col items-center justify-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-100">
              <svg
                className="h-8 w-8 text-primary-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <circle cx="9" cy="16" r="1" fill="currentColor" stroke="none" />
                <circle cx="15" cy="16" r="1" fill="currentColor" stroke="none" />
                <path d="M8 11V7a4 4 0 118 0v4" />
                <path d="M12 2v1" />
              </svg>
            </div>
            <h3 className="mb-1 text-lg font-bold text-warm-800">你好！</h3>
            <p className="mb-6 text-center text-sm leading-relaxed text-warm-500">
              有什麼活動相關的問題嗎？
              <br />
              我會盡力幫你解答
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="rounded-full border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100 active:scale-95"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Chat messages */
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="animate-message-appear">
                {msg.role === "user" ? (
                  /* User message — right aligned */
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary-500 px-4 py-3 text-sm leading-relaxed text-white shadow-sm">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  /* AI message — left aligned */
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100">
                        <svg
                          className="h-4 w-4 text-primary-600"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="11" width="18" height="10" rx="2" />
                          <circle cx="9" cy="16" r="1" fill="currentColor" stroke="none" />
                          <circle cx="15" cy="16" r="1" fill="currentColor" stroke="none" />
                          <path d="M8 11V7a4 4 0 118 0v4" />
                        </svg>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed shadow-sm ${
                          msg.outcome === "error"
                            ? "bg-danger-50 text-danger-700"
                            : msg.outcome === "out_of_scope"
                              ? "bg-warm-100 text-warm-700"
                              : "bg-surface-raised text-warm-800"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>

                    {/* Related questions as source cards */}
                    {msg.relatedQuestions &&
                      msg.relatedQuestions.length > 0 && (
                        <div className="ml-9 space-y-2">
                          <p className="text-xs font-medium text-warm-400">
                            參考來源
                          </p>
                          {msg.relatedQuestions.map((rq) => (
                            <button
                              key={rq.code}
                              className="flex w-full items-center gap-3 rounded-xl border border-warm-100 bg-surface-raised p-3 text-left shadow-xs transition-all hover:border-primary-200 hover:shadow-sm active:scale-[0.98]"
                              onClick={() => {
                                window.location.href = `/qa?question=${rq.code}`;
                              }}
                            >
                              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50">
                                <span className="text-xs font-bold text-primary-600">
                                  Q
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-primary-600">
                                    {rq.code}
                                  </span>
                                  <span
                                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                      rq.status === "answered"
                                        ? "bg-success-100 text-success-700"
                                        : "bg-accent-100 text-accent-600"
                                    }`}
                                  >
                                    {rq.status === "answered"
                                      ? "已回答"
                                      : "待回答"}
                                  </span>
                                </div>
                                <p className="mt-0.5 truncate text-xs text-warm-500">
                                  {rq.contentPreview}
                                </p>
                              </div>
                              <svg
                                className="h-4 w-4 flex-shrink-0 text-warm-300"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </button>
                          ))}
                        </div>
                      )}

                    {/* Uncertain → submit question CTA */}
                    {msg.outcome === "uncertain" && (
                      <div className="ml-9">
                        <div className="rounded-xl border border-accent-200 bg-accent-50 p-4">
                          <p className="mb-3 text-sm text-accent-700">
                            找不到確切的答案，你要送出這個問題讓工作人員回覆嗎？
                          </p>
                          <button
                            onClick={() =>
                              handleSubmitQuestion(
                                msg.draftQuestion ?? msg.content,
                              )
                            }
                            className="w-full rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600 active:scale-[0.98]"
                          >
                            我想問問題
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Error → suggest formal question */}
                    {msg.outcome === "error" && (
                      <div className="ml-9">
                        <button
                          onClick={() => {
                            const idx = messages.indexOf(msg);
                            const prevUser = [...messages.slice(0, idx)]
                              .reverse()
                              .find((m) => m.role === "user");
                            handleSubmitQuestion(
                              prevUser?.content ?? "",
                            );
                          }}
                          className="rounded-xl border border-warm-200 bg-surface-raised px-4 py-2.5 text-sm font-medium text-warm-600 transition-colors hover:bg-warm-50 active:scale-[0.98]"
                        >
                          我想問問題
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-start gap-2 animate-message-appear">
                <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100">
                  <svg
                    className="h-4 w-4 text-primary-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M12 2a8 8 0 00-8 8c0 3.4 2.1 6.3 5 7.5V20a1 1 0 001 1h4a1 1 0 001-1v-2.5c2.9-1.2 5-4.1 5-7.5a8 8 0 00-8-8z" />
                  </svg>
                </div>
                <div
                  className="rounded-2xl rounded-bl-md bg-surface-raised px-4 py-3 shadow-sm"
                  role="status"
                  aria-label="AI 正在思考中"
                >
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary-400 [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary-400 [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary-400 [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-warm-100 bg-surface-raised px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="歡迎詢問任何對今天活動的任何問題！"
            rows={1}
            maxLength={500}
            disabled={isLoading}
            className="flex-1 resize-none rounded-2xl border border-warm-200 bg-surface px-4 py-3 text-base leading-normal placeholder:text-warm-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-warm-50 disabled:text-warm-400"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            style={{
              minHeight: "48px",
              maxHeight: "120px",
              height: "48px",
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "48px";
              target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-500 text-white transition-all hover:bg-primary-600 disabled:bg-warm-200 disabled:text-warm-400 active:scale-95"
            aria-label="送出訊息"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
        <p className="mt-1.5 text-center text-[11px] text-warm-400">
          按 Enter 送出 · Shift + Enter 換行
        </p>
      </div>
    </div>
  );
}
