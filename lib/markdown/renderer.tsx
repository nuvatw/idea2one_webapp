import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Safe Markdown renderer.
 * Uses rehype-sanitize to strip dangerous HTML (e.g. <script>).
 */
export default function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm max-w-none ${className ?? ""}`}>
      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
