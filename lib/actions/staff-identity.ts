"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/utils/supabase";
import {
  verifyStaffSession,
  encodeStaffSession,
  setStaffSessionCookie,
} from "@/lib/auth/session";

export type StaffIdentityResult = {
  success: boolean;
  error?: {
    type: "unauthorized" | "not_found" | "system";
    message: string;
  };
};

export async function selectStaffIdentity(
  _prevState: StaffIdentityResult | null,
  formData: FormData
): Promise<StaffIdentityResult> {
  const staffId = (formData.get("staffId") as string) || "";

  if (!staffId) {
    return {
      success: false,
      error: { type: "not_found", message: "請選擇一個身份" },
    };
  }

  try {
    // Verify existing staff auth
    const session = await verifyStaffSession();
    if (!session) {
      redirect("/staff/login");
    }

    // Look up staff member
    const supabase = createServerSupabaseClient();
    const { data: staff, error } = await supabase
      .from("staff_members")
      .select("id, name")
      .eq("id", staffId)
      .single();

    if (error || !staff) {
      return {
        success: false,
        error: { type: "not_found", message: "找不到此努努身份，請重新整理" },
      };
    }

    // Re-encode session with selected identity
    const token = await encodeStaffSession({
      role: "staff",
      selectedStaffId: staff.id,
      selectedStaffName: staff.name,
    });

    await setStaffSessionCookie(token);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e; // re-throw redirect
    return {
      success: false,
      error: { type: "system", message: "系統錯誤，請稍後再試" },
    };
  }

  redirect("/staff");
}
