import SkeletonBox from "@/components/shared/SkeletonBox";

/**
 * Home page loading skeleton.
 * Matches: GreetingHeader + CurrentAgendaCard + NextAgendaCard + QuestionsStatusCard
 */
export default function HomeLoading() {
  return (
    <main className="mx-auto max-w-screen-md px-5 pt-6">
      {/* GreetingHeader skeleton */}
      <div className="flex items-start justify-between pb-5 pt-2">
        <div>
          <SkeletonBox className="mb-2 h-4 w-12 bg-primary-100" />
          <SkeletonBox className="mb-1 h-8 w-40 bg-warm-200" />
          <SkeletonBox className="h-8 w-32 bg-primary-100" />
        </div>
        <SkeletonBox className="mt-1 h-10 w-10 rounded-xl bg-warm-100" />
      </div>

      {/* Current agenda card skeleton */}
      <div className="mb-4 rounded-2xl border-2 border-primary-200 bg-primary-50 p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <SkeletonBox className="h-2.5 w-2.5 rounded-full bg-primary-300" />
          <SkeletonBox className="h-5 w-14 rounded-full bg-primary-200" />
        </div>
        <SkeletonBox className="mb-1 h-3 w-24 bg-primary-200" />
        <SkeletonBox className="mb-1 h-7 w-48 bg-primary-200" />
        <SkeletonBox className="h-4 w-36 bg-primary-200" />
      </div>

      {/* Next agenda card skeleton */}
      <div className="mb-4 rounded-2xl border border-warm-100 bg-surface-raised p-4 shadow-xs">
        <div className="mb-1 flex items-center gap-2">
          <SkeletonBox className="h-4 w-4 rounded bg-warm-200" />
          <SkeletonBox className="h-3 w-14 bg-warm-200" />
        </div>
        <div className="ml-6">
          <SkeletonBox className="mb-1 h-3 w-20 bg-warm-200" />
          <SkeletonBox className="mb-1 h-5 w-36 bg-warm-200" />
          <SkeletonBox className="h-4 w-48 bg-warm-200" />
        </div>
      </div>

      {/* Questions status card skeleton */}
      <div className="rounded-2xl border border-warm-100 bg-surface-raised p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <SkeletonBox className="h-4 w-16 bg-warm-200" />
          <SkeletonBox className="h-3 w-14 bg-warm-200" />
        </div>
        <div className="space-y-3">
          {/* Stats row */}
          <div className="flex gap-3">
            <div className="flex-1 rounded-xl bg-accent-50 p-3">
              <SkeletonBox className="mx-auto mb-1 h-6 w-8 bg-accent-100" />
              <SkeletonBox className="mx-auto h-3 w-10 bg-accent-100" />
            </div>
            <div className="flex-1 rounded-xl bg-success-50 p-3">
              <SkeletonBox className="mx-auto mb-1 h-6 w-8 bg-success-100" />
              <SkeletonBox className="mx-auto h-3 w-10 bg-success-100" />
            </div>
          </div>
          {/* Question preview skeletons */}
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex w-full items-center gap-3 rounded-xl border border-warm-100 p-3"
            >
              <div className="min-w-0 flex-1">
                <SkeletonBox className="mb-1 h-4 w-full bg-warm-200" />
                <SkeletonBox className="h-3 w-16 bg-warm-100" />
              </div>
              <SkeletonBox className="h-5 w-12 rounded-full bg-warm-100" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
