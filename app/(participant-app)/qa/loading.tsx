import SkeletonBox from "@/components/shared/SkeletonBox";

/**
 * Q&A page loading skeleton.
 * Matches: page header + QAFilterBar (search + filter toggles) + QuestionList (3 cards) + FormalQuestionComposer
 */
export default function QALoading() {
  return (
    <main className="mx-auto max-w-screen-md px-5 pt-6">
      {/* Page header skeleton */}
      <div className="mb-4">
        <SkeletonBox className="h-7 w-24 bg-warm-200" />
        <SkeletonBox className="mt-2 h-4 w-32 bg-warm-100" />
      </div>

      <div className="space-y-4">
        {/* QAFilterBar skeleton */}
        <div className="space-y-3">
          <SkeletonBox className="h-11 w-full rounded-xl border border-warm-200 bg-warm-50" />
          <div className="flex gap-2">
            <div className="flex rounded-xl border border-warm-200 bg-warm-50 p-0.5">
              <SkeletonBox className="h-[44px] w-20 bg-warm-100" />
              <SkeletonBox className="h-[44px] w-20 bg-transparent" />
            </div>
            <div className="flex rounded-xl border border-warm-200 bg-warm-50 p-0.5">
              <SkeletonBox className="h-[44px] w-20 bg-warm-100" />
              <SkeletonBox className="h-[44px] w-16 bg-transparent" />
            </div>
          </div>
        </div>

        {/* QuestionList skeleton -- 3 question cards */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-warm-200 bg-surface-raised p-4 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <SkeletonBox className="h-4 w-16 bg-primary-100" />
                  </div>
                  <SkeletonBox className="mb-1 h-4 w-full bg-warm-200" />
                  <SkeletonBox className="h-4 w-3/4 bg-warm-100" />
                  <div className="mt-2 flex items-center gap-3">
                    <SkeletonBox className="h-3 w-14 bg-warm-100" />
                    <SkeletonBox className="h-3 w-10 bg-warm-100" />
                  </div>
                </div>
                <SkeletonBox className="mt-0.5 h-5 w-14 rounded-full bg-warm-100" />
              </div>
            </div>
          ))}
        </div>

        {/* FormalQuestionComposer skeleton */}
        <div className="rounded-xl border border-warm-200 bg-surface-raised p-4 shadow-xs">
          <SkeletonBox className="mb-3 h-4 w-24 bg-warm-200" />
          <SkeletonBox className="h-[76px] w-full rounded-xl border border-warm-200 bg-warm-50" />
          <div className="mt-2 flex items-center justify-end">
            <SkeletonBox className="h-[44px] w-24 rounded-xl bg-primary-100" />
          </div>
        </div>
      </div>
    </main>
  );
}
