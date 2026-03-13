/**
 * Staff dashboard loading skeleton.
 * Per Spec (8.15): loading.tsx must provide skeleton, not just spinner.
 */
export default function StaffLoading() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar skeleton */}
      <div className="sticky top-0 z-10 border-b border-warm-200 bg-surface-raised">
        <div className="mx-auto flex max-w-screen-lg items-center justify-between px-4 py-3">
          <div>
            <div className="mb-1 h-6 w-24 animate-pulse rounded-lg bg-warm-200" />
            <div className="h-3 w-36 animate-pulse rounded-lg bg-warm-200" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-20 animate-pulse rounded-xl bg-warm-200" />
            <div className="h-8 w-14 animate-pulse rounded-xl bg-warm-200" />
          </div>
        </div>
      </div>

      {/* Tab bar skeleton */}
      <div className="sticky top-[57px] z-10 border-b border-warm-200 bg-surface-raised">
        <div className="mx-auto flex max-w-screen-lg gap-1 px-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="h-10 w-14 animate-pulse rounded-lg bg-warm-100"
            />
          ))}
        </div>
      </div>

      {/* Content skeleton */}
      <div className="mx-auto max-w-screen-lg px-4 py-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-warm-200 p-4"
            >
              <div className="mb-2 h-3 w-16 animate-pulse rounded-lg bg-warm-200" />
              <div className="h-8 w-12 animate-pulse rounded-lg bg-warm-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
