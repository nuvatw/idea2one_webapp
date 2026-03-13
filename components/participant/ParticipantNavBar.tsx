"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import { participantLogout } from "@/lib/actions/participant-auth";
import Spinner from "@/components/shared/Spinner";

interface ParticipantNavBarProps {
  participantName: string;
}

function LogoutButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-warm-200 bg-surface-raised px-3 py-2 text-sm text-warm-600 shadow-xs transition-colors hover:bg-warm-50 hover:text-warm-800 disabled:opacity-50"
    >
      {pending && <Spinner className="h-3.5 w-3.5" />}
      {pending ? "登出中…" : "登出"}
    </button>
  );
}

export default function ParticipantNavBar({ participantName }: ParticipantNavBarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "首頁", href: "/home" },
    { label: "Q&A", href: "/qa" },
  ];

  return (
    <nav className="sticky top-0 z-10 border-b border-warm-200 bg-surface-raised/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-screen-md items-center justify-between px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="mr-3 text-sm font-bold tracking-tight text-primary-600">
            nuva
          </span>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "bg-primary-50 text-primary-700"
                  : "text-warm-600 hover:bg-warm-100 hover:text-warm-800"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-warm-500">{participantName}</span>
          <form action={participantLogout}>
            <LogoutButton />
          </form>
        </div>
      </div>
    </nav>
  );
}
