import SkeletonBox from "@/components/shared/SkeletonBox";

interface LoginFormSkeletonProps {
  /** Class names for the logo/icon placeholder */
  iconClassName: string;
  /** Class names for the title placeholder (omit to skip) */
  titleClassName?: string;
  /** Class names for a secondary text line below the icon/title (omit to skip) */
  subtitleClassName?: string;
  /** Class names for the field label placeholder */
  labelClassName: string;
  /** Class names for the submit button placeholder */
  buttonClassName: string;
}

/**
 * Shared login page loading skeleton used by both participant and staff login pages.
 * Renders a centered layout with: icon/logo, optional title, optional subtitle,
 * a form field, and a submit button.
 */
export default function LoginFormSkeleton({
  iconClassName,
  titleClassName,
  subtitleClassName,
  labelClassName,
  buttonClassName,
}: LoginFormSkeletonProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <SkeletonBox className={`mx-auto mb-4 ${iconClassName}`} />
          {titleClassName && (
            <SkeletonBox className={`mx-auto ${titleClassName}`} />
          )}
          {subtitleClassName && (
            <SkeletonBox className={`mx-auto mt-1.5 ${subtitleClassName}`} />
          )}
        </div>

        <div className="space-y-4">
          <div>
            <SkeletonBox className={`mb-1.5 ${labelClassName}`} />
            <SkeletonBox className="h-11 w-full rounded-xl border border-warm-200 bg-warm-50" />
          </div>
          <SkeletonBox className={`h-12 w-full rounded-xl ${buttonClassName}`} />
        </div>
      </div>
    </div>
  );
}
