"use client";

import { useActionState } from "react";
import { selectStaffIdentity, type StaffIdentityResult } from "@/lib/actions/staff-identity";
import Spinner from "@/components/shared/Spinner";

interface StaffOption {
  id: string;
  name: string;
}

interface Props {
  staffList: StaffOption[];
}

export default function StaffIdentitySelector({ staffList }: Props) {
  const [state, formAction, isPending] = useActionState<StaffIdentityResult | null, FormData>(
    selectStaffIdentity,
    null
  );

  if (staffList.length === 0) {
    return (
      <div className="mt-6 rounded-xl bg-warning-50 p-4">
        <p className="text-sm text-warning-600">尚未匯入努努名單</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {state?.error && (
        <div className="rounded-xl bg-danger-50 p-3">
          <p className="text-sm text-danger-600">{state.error.message}</p>
        </div>
      )}

      {staffList.map((staff) => (
        <form key={staff.id} action={formAction}>
          <input type="hidden" name="staffId" value={staff.id} />
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex min-h-[44px] w-full items-center gap-3 rounded-xl border border-warm-200 bg-surface-raised px-4 py-3 text-left text-base font-medium text-warm-800 shadow-xs transition-all hover:border-primary-300 hover:bg-primary-50 hover:shadow-sm disabled:opacity-50"
          >
            {isPending && <Spinner className="h-4 w-4 text-primary-500" />}
            {staff.name}
          </button>
        </form>
      ))}
    </div>
  );
}
