"use server";

import { redirect } from "next/navigation";
import {
  encodeStaffSession,
  setStaffSessionCookie,
  clearStaffSessionCookie,
} from "@/lib/auth/session";

export type StaffLoginResult = {
  success: boolean;
  error?: {
    type: "validation" | "wrong_password" | "system";
    message: string;
  };
};

export async function staffLogin(
  _prevState: StaffLoginResult | null,
  formData: FormData
): Promise<StaffLoginResult> {
  const password = (formData.get("password") as string) || "";

  if (!password.trim()) {
    return {
      success: false,
      error: { type: "validation", message: "請輸入密碼" },
    };
  }

  try {
    const expectedPassword = process.env.STAFF_PASSWORD || "0012";

    if (password.trim() !== expectedPassword) {
      return {
        success: false,
        error: { type: "wrong_password", message: "密碼不正確" },
      };
    }

    const token = await encodeStaffSession({ role: "staff" });
    await setStaffSessionCookie(token);
  } catch {
    return {
      success: false,
      error: { type: "system", message: "後台暫時無法登入，請稍後再試" },
    };
  }

  redirect("/staff/select");
}

export async function staffLogout(): Promise<void> {
  await clearStaffSessionCookie();
  redirect("/staff/login");
}
