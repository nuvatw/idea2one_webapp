/**
 * Participant app loading skeleton.
 * Matches the new layout (no top nav, bottom nav provided by layout).
 */
export default function ParticipantLoading() {
  return (
    <main className="mx-auto max-w-screen-md px-5 pt-6">
      {/* Greeting skeleton */}
      <div className="pb-5 pt-2">
        <div className="mb-2 h-4 w-20 animate-pulse rounded-lg bg-primary-100" />
        <div className="mb-1 h-8 w-40 animate-pulse rounded-lg bg-warm-200" />
        <div className="h-8 w-32 animate-pulse rounded-lg bg-primary-100" />
      </div>

      {/* Current agenda skeleton */}
      <div className="mb-4 rounded-2xl border-2 border-primary-200 bg-primary-50 p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary-300" />
          <div className="h-5 w-14 animate-pulse rounded-full bg-primary-200" />
        </div>
        <div className="mb-2 h-4 w-24 animate-pulse rounded-lg bg-warm-200" />
        <div className="mb-2 h-6 w-48 animate-pulse rounded-lg bg-warm-200" />
        <div className="h-4 w-full animate-pulse rounded-lg bg-warm-200" />
      </div>

      {/* Next section skeleton */}
      <div className="mb-4 rounded-2xl border border-warm-100 bg-surface-raised p-4">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-4 w-4 animate-pulse rounded bg-warm-200" />
          <div className="h-3 w-14 animate-pulse rounded-lg bg-warm-200" />
        </div>
        <div className="ml-6">
          <div className="mb-1 h-3 w-20 animate-pulse rounded-lg bg-warm-200" />
          <div className="mb-1 h-5 w-36 animate-pulse rounded-lg bg-warm-200" />
          <div className="h-4 w-48 animate-pulse rounded-lg bg-warm-200" />
        </div>
      </div>

      {/* Questions status skeleton */}
      <div className="rounded-2xl border border-warm-100 bg-surface-raised p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="h-4 w-20 animate-pulse rounded-lg bg-warm-200" />
          <div className="h-3 w-14 animate-pulse rounded-lg bg-warm-200" />
        </div>
        <div className="flex gap-3">
          <div className="flex-1 rounded-xl bg-accent-50 p-3">
            <div className="mx-auto mb-1 h-6 w-8 animate-pulse rounded-lg bg-accent-100" />
            <div className="mx-auto h-3 w-10 animate-pulse rounded-lg bg-accent-100" />
          </div>
          <div className="flex-1 rounded-xl bg-success-50 p-3">
            <div className="mx-auto mb-1 h-6 w-8 animate-pulse rounded-lg bg-success-100" />
            <div className="mx-auto h-3 w-10 animate-pulse rounded-lg bg-success-100" />
          </div>
        </div>
      </div>
    </main>
  );
}
