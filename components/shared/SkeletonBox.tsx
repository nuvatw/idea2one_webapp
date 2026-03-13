/**
 * Reusable skeleton placeholder block used in loading.tsx skeletons.
 * Renders an animate-pulse div with rounded corners and configurable size/color.
 */
export default function SkeletonBox({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg ${className}`} />;
}
