"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "首頁", href: "/home", iconType: "home" as const },
  { label: "活動議程", href: "/agenda", iconType: "clock" as const },
  { label: "常見問題", href: "/qa", iconType: "help" as const },
  { label: "問 AI", href: "/ai", iconType: "ai" as const },
];

function NavIcon({
  type,
  active,
}: {
  type: "home" | "clock" | "help" | "ai";
  active: boolean;
}) {
  const cls = `h-5 w-5 ${active ? "text-white" : "text-warm-400"}`;

  switch (type) {
    case "home":
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case "clock":
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case "help":
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      );
    case "ai":
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a8 8 0 00-8 8c0 3.4 2.1 6.3 5 7.5V20a1 1 0 001 1h4a1 1 0 001-1v-2.5c2.9-1.2 5-4.1 5-7.5a8 8 0 00-8-8z" />
          <path d="M9 22h6" />
        </svg>
      );
  }
}

export default function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40" aria-label="主導覽列">
      <div className="mx-auto max-w-screen-md px-4 pb-[max(8px,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-around rounded-2xl bg-warm-800 px-2 py-2 shadow-xl">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-xl transition-all ${
                  isActive ? "" : "active:scale-95"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
                    isActive
                      ? "bg-primary-500 shadow-md shadow-primary-500/30"
                      : ""
                  }`}
                >
                  <NavIcon type={item.iconType} active={isActive} />
                </div>
                <span
                  className={`text-[11px] font-medium transition-colors ${
                    isActive ? "text-primary-400" : "text-warm-500"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
