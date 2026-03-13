import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { verifyParticipantSession } from "@/lib/auth/session";
import ParticipantLoginForm from "@/components/participant/ParticipantLoginForm";

export const metadata: Metadata = {
  title: "登入 — nuva",
};

/**
 * /login — 法法登入頁
 * If already logged in, redirect to /home.
 */
export default async function ParticipantLoginPage() {
  const session = await verifyParticipantSession();
  if (session) {
    redirect("/home");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Image
            src="/nuvaLogo.png"
            alt="nuva"
            width={120}
            height={120}
            className="mx-auto mb-4"
            priority
          />
          <p className="mt-1.5 text-sm text-warm-500">
            一日戶外工作坊即時活動助手
          </p>
        </div>
        <ParticipantLoginForm />

        {/* 努努登入入口 — 不顯眼 */}
        <div className="mt-12 text-center">
          <a
            href="/staff/login"
            className="text-[11px] text-warm-300 transition-colors hover:text-warm-400"
          >
            努努登入
          </a>
        </div>
      </div>
    </div>
  );
}
