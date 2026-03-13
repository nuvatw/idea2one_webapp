import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/utils/supabase";
import { requireStaffAuth } from "@/lib/dal/auth-check";
import StaffIdentitySelector from "@/components/staff/StaffIdentitySelector";

export const metadata: Metadata = {
  title: "選擇身份 — nuva",
};

/**
 * /staff/select — 努努身份選擇頁
 * Requires staff auth (password verified).
 */
export default async function StaffSelectPage() {
  await requireStaffAuth();

  const supabase = createServerSupabaseClient();
  const { data: staffList } = await supabase
    .from("staff_members")
    .select("id, name")
    .order("name");

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight text-center text-warm-800">
          選擇身份
        </h1>
        <p className="mt-2 text-center text-warm-500">請選擇你的姓名</p>
        <StaffIdentitySelector staffList={staffList || []} />

        <div className="mt-8 text-center">
          <a
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-warm-400 transition-colors hover:text-warm-600"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            返回登入
          </a>
        </div>
      </div>
    </div>
  );
}
