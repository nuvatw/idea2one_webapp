import SkeletonBox from "@/components/shared/SkeletonBox";

/**
 * Staff identity select page loading skeleton.
 * Matches: centered title + subtitle + identity selector grid + back link
 */
export default function StaffSelectLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <SkeletonBox className="mx-auto mb-2 h-8 w-28 bg-warm-200" />
        <SkeletonBox className="mx-auto mb-6 h-4 w-32 bg-warm-100" />

        {/* Identity selector grid skeleton */}
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonBox
              key={i}
              className="h-12 rounded-xl border border-warm-200 bg-warm-50"
            />
          ))}
        </div>

        {/* Back link */}
        <div className="mt-8 flex justify-center">
          <SkeletonBox className="h-4 w-20 bg-warm-100" />
        </div>
      </div>
    </div>
  );
}
