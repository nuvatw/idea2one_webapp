"use client";

import { useState } from "react";
import { participantLogout } from "@/lib/actions/participant-auth";

interface GreetingHeaderProps {
  name: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "早安";
  if (hour < 18) return "下午好";
  return "晚上好";
}

export default function GreetingHeader({ name }: GreetingHeaderProps) {
  const [greeting] = useState(getGreeting);

  return (
    <div className="flex items-start justify-between pb-5 pt-2">
      <div>
        <p className="mb-1 text-sm font-semibold tracking-wide text-primary-600">
          nuva
        </p>
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-warm-800">
          {greeting}，
          <br />
          <span className="text-primary-600">{name}</span>
        </h1>
      </div>
      <form action={participantLogout}>
        <button
          type="submit"
          className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-warm-100 text-warm-500 transition-colors hover:bg-warm-200 hover:text-warm-700"
          aria-label="登出"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </form>
    </div>
  );
}
