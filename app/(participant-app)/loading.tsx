import SkeletonBox from "@/components/shared/SkeletonBox";

/**
 * Fallback loading skeleton for participant app layout.
 * Only shows during layout-level async work (auth/check-in).
 * Per-page loading.tsx files handle page-specific skeletons.
 */
export default function ParticipantLoading() {
  return (
    <main className="mx-auto max-w-screen-md px-5 pt-6">
      <div className="pb-5 pt-2">
        <SkeletonBox className="mb-2 h-4 w-12 bg-primary-100" />
        <SkeletonBox className="mb-1 h-8 w-40 bg-warm-200" />
        <SkeletonBox className="h-8 w-32 bg-primary-100" />
      </div>

      <SkeletonBox className="mb-4 h-36 rounded-2xl border border-warm-100 bg-warm-50" />
      <SkeletonBox className="mb-4 h-24 rounded-2xl border border-warm-100 bg-warm-50" />
      <SkeletonBox className="h-28 rounded-2xl border border-warm-100 bg-warm-50" />
    </main>
  );
}
