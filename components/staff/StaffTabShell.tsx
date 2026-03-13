"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { type ReactNode, useCallback, useTransition } from "react";
import Spinner from "@/components/shared/Spinner";

export type StaffTab =
  | "dashboard"
  | "agenda"
  | "qna"
  | "attendance"
  | "lunch"
  | "content"
  | "import"
  | "settings";

const TAB_LABELS: Record<StaffTab, string> = {
  dashboard: "總覽",
  agenda: "Agenda",
  qna: "Q&A",
  attendance: "報到",
  lunch: "午餐",
  content: "內容",
  import: "匯入",
  settings: "設定",
};

const TAB_ORDER: StaffTab[] = [
  "dashboard",
  "agenda",
  "qna",
  "attendance",
  "lunch",
  "content",
  "import",
  "settings",
];

interface StaffTabShellProps {
  children: Record<StaffTab, ReactNode>;
}

/**
 * Sticky tab bar for staff dashboard.
 * Active tab controlled by ?tab= query param.
 * Per Spec: min hit area 44x44.
 */
export default function StaffTabShell({ children }: StaffTabShellProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [isNavigating, startTransition] = useTransition();

  const currentTab = (searchParams.get("tab") as StaffTab) || "dashboard";
  const validTab = TAB_ORDER.includes(currentTab) ? currentTab : "dashboard";

  const setTab = useCallback(
    (tab: StaffTab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [searchParams, router, pathname, startTransition]
  );

  return (
    <div>
      {/* Sticky tab bar */}
      <nav
        className="sticky top-[57px] z-10 overflow-x-auto border-b border-warm-200 bg-surface-raised/95 backdrop-blur-sm"
        aria-label="後台功能分頁"
      >
        <div className="mx-auto flex max-w-screen-lg gap-0.5 px-2">
          {TAB_ORDER.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTab(tab)}
              aria-current={validTab === tab ? "page" : undefined}
              className={`min-h-[44px] whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors ${
                validTab === tab
                  ? "border-b-2 border-primary-500 text-primary-600"
                  : "text-warm-500 hover:text-warm-700"
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab content */}
      <div className="mx-auto max-w-screen-lg px-4 py-4">
        {isNavigating ? (
          <div className="flex items-center justify-center py-20">
            <Spinner className="h-8 w-8 text-primary-500" />
          </div>
        ) : (
          children[validTab]
        )}
      </div>
    </div>
  );
}
