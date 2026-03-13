import SkeletonBox from "@/components/shared/SkeletonBox";

/**
 * AI chat page loading skeleton.
 * Matches: header bar + welcome state (icon, greeting, suggested question buttons) + input area
 */
export default function AILoading() {
  return (
    <div className="flex h-[calc(100dvh-88px)] flex-col bg-surface">
      {/* Header */}
      <header className="flex items-center justify-center border-b border-warm-100 bg-surface-raised px-4 py-3">
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-2 w-2 rounded-full bg-primary-300" />
          <SkeletonBox className="h-5 w-16 bg-warm-200" />
        </div>
      </header>

      {/* Welcome state skeleton */}
      <div className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-5">
        <div className="flex flex-col items-center">
          <SkeletonBox className="mb-4 h-16 w-16 rounded-3xl bg-primary-100" />
          <SkeletonBox className="mb-1 h-6 w-14 bg-warm-200" />
          <SkeletonBox className="mb-1 h-4 w-40 bg-warm-100" />
          <SkeletonBox className="mb-6 h-4 w-32 bg-warm-100" />
          {/* Suggested question buttons */}
          <div className="flex flex-wrap justify-center gap-2">
            <SkeletonBox className="h-10 w-44 rounded-full border border-primary-100 bg-primary-50" />
            <SkeletonBox className="h-10 w-40 rounded-full border border-primary-100 bg-primary-50" />
            <SkeletonBox className="h-10 w-36 rounded-full border border-primary-100 bg-primary-50" />
          </div>
        </div>
      </div>

      {/* Input area skeleton */}
      <div className="border-t border-warm-100 bg-surface-raised px-4 py-3">
        <div className="flex items-end gap-2">
          <SkeletonBox className="h-12 flex-1 rounded-2xl border border-warm-200 bg-warm-50" />
          <SkeletonBox className="h-12 w-12 rounded-2xl bg-warm-200" />
        </div>
        <div className="mt-1.5 flex justify-center">
          <SkeletonBox className="h-3 w-40 bg-warm-100" />
        </div>
      </div>
    </div>
  );
}
