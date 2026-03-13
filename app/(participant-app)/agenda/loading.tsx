import SkeletonBox from "@/components/shared/SkeletonBox";

type ItemState = "current" | "past" | "future";

const TIMELINE_ITEMS: ItemState[] = ["past", "current", "future", "future"];

function dotClassName(state: ItemState): string {
  switch (state) {
    case "current":
      return "h-6 w-6 animate-pulse bg-primary-400 shadow-md shadow-primary-500/30";
    case "past":
      return "h-4 w-4 animate-pulse bg-primary-300";
    case "future":
      return "h-4 w-4 animate-pulse border-2 border-warm-300 bg-surface-raised";
  }
}

function lineClassName(state: ItemState): string {
  if (state === "current" || state === "past") return "bg-primary-200";
  return "bg-warm-200";
}

function cardClassName(state: ItemState): string {
  switch (state) {
    case "current":
      return "border-primary-200 bg-primary-50 shadow-sm";
    case "past":
      return "border-warm-100 bg-surface-raised opacity-70";
    case "future":
      return "border-warm-100 bg-surface-raised";
  }
}

function cardAccentColor(state: ItemState): string {
  return state === "current" ? "bg-primary-200" : "bg-warm-200";
}

/**
 * Agenda page loading skeleton.
 * Matches: page header + AgendaTimeline (4 timeline items with dots, lines, and cards)
 */
export default function AgendaLoading() {
  return (
    <main className="mx-auto max-w-screen-md px-5 pt-6">
      {/* Page header skeleton */}
      <div className="mb-5">
        <SkeletonBox className="h-7 w-28 bg-warm-200" />
        <SkeletonBox className="mt-2 h-4 w-40 bg-warm-100" />
      </div>

      {/* Timeline skeleton */}
      <div className="relative">
        {TIMELINE_ITEMS.map((state, index) => {
          const isLast = index === TIMELINE_ITEMS.length - 1;
          const accent = cardAccentColor(state);

          return (
            <div key={index} className="relative flex gap-4">
              {/* Timeline column */}
              <div className="flex flex-col items-center">
                <div
                  className={`relative z-10 rounded-full ${dotClassName(state)}`}
                />
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 ${lineClassName(state)}`}
                  />
                )}
              </div>

              {/* Content card skeleton */}
              <div className={`flex-1 ${isLast ? "" : "pb-4"}`}>
                <div
                  className={`rounded-2xl border p-4 ${cardClassName(state)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <SkeletonBox className={`mb-1 h-3 w-20 ${accent}`} />
                      <SkeletonBox className={`h-5 w-32 ${accent}`} />
                    </div>
                    {state === "current" && (
                      <SkeletonBox className="h-6 w-14 rounded-full bg-primary-200" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
