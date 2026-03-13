import LoginFormSkeleton from "@/components/shared/LoginFormSkeleton";

/**
 * Participant login page loading skeleton.
 * Matches: centered logo + subtitle + login form layout
 */
export default function LoginLoading() {
  return (
    <LoginFormSkeleton
      iconClassName="h-[120px] w-[120px] rounded-3xl bg-warm-100"
      subtitleClassName="h-4 w-48 bg-warm-100"
      labelClassName="h-4 w-16 bg-warm-100"
      buttonClassName="bg-primary-100"
    />
  );
}
