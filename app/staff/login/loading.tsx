import LoginFormSkeleton from "@/components/shared/LoginFormSkeleton";

/**
 * Staff login page loading skeleton.
 * Matches: centered icon + title + login form layout
 */
export default function StaffLoginLoading() {
  return (
    <LoginFormSkeleton
      iconClassName="h-14 w-14 rounded-2xl bg-warm-200 shadow-md"
      titleClassName="h-8 w-28 bg-warm-200"
      labelClassName="h-4 w-12 bg-warm-100"
      buttonClassName="bg-warm-200"
    />
  );
}
