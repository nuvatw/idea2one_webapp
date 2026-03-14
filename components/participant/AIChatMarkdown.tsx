"use client";

import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import type { Components } from "react-markdown";

interface AIChatMarkdownProps {
  content: string;
}

/**
 * Markdown renderer for AI chat messages.
 * Supports code blocks with language label header and dark styling.
 */
export default function AIChatMarkdown({ content }: AIChatMarkdownProps) {
  return (
    <ReactMarkdown
      rehypePlugins={[rehypeSanitize]}
      components={markdownComponents}
    >
      {content}
    </ReactMarkdown>
  );
}

const CODE_ICON = (
  <svg
    className="h-3.5 w-3.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const markdownComponents: Components = {
  // Fenced code blocks: ```lang ... ```
  pre({ children }) {
    return <>{children}</>;
  },
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    const isBlock = match || (typeof children === "string" && children.includes("\n"));

    if (isBlock) {
      const lang = match ? capitalizeFirst(match[1]) : "Code";
      return (
        <div className="my-2 overflow-hidden rounded-xl border border-warm-200/60">
          {/* Language header */}
          <div className="flex items-center gap-1.5 bg-warm-800 px-3 py-1.5">
            <span className="text-amber-400">{CODE_ICON}</span>
            <span className="text-xs font-semibold text-warm-200">{lang}</span>
          </div>
          {/* Code body */}
          <div className="overflow-x-auto bg-warm-900 px-4 py-3">
            <pre className="m-0">
              <code className="text-[13px] leading-relaxed text-warm-100" {...props}>
                {children}
              </code>
            </pre>
          </div>
        </div>
      );
    }

    // Inline code
    return (
      <code
        className="rounded-md bg-warm-200/60 px-1.5 py-0.5 text-[13px] font-medium text-warm-800"
        {...props}
      >
        {children}
      </code>
    );
  },
  // Paragraphs — remove extra margins in chat context
  p({ children }) {
    return <p className="mb-1.5 last:mb-0">{children}</p>;
  },
  // Lists
  ul({ children }) {
    return <ul className="mb-1.5 ml-4 list-disc last:mb-0">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="mb-1.5 ml-4 list-decimal last:mb-0">{children}</ol>;
  },
  li({ children }) {
    return <li className="mb-0.5">{children}</li>;
  },
  // Strong/bold
  strong({ children }) {
    return <strong className="font-semibold">{children}</strong>;
  },
  // Links
  a({ href, children }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary-600 underline decoration-primary-300 hover:decoration-primary-500"
      >
        {children}
      </a>
    );
  },
};
