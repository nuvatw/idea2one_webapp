"use client";

import { useState } from "react";
import CountdownTimer from "./CountdownTimer";

interface PreCheckInScreenProps {
  eventStartTime: string | null;
}

const YOUTUBE_VIDEO_ID = "wHeS6sOhyC8";
const GOOGLE_MAPS_URL = "https://maps.app.goo.gl/ah4pGnHs388N8caF8";
const DEFAULT_EVENT_START = "2026-03-14T09:30:00+08:00";
const LOCATION_TEXT = "大安森林公園 7 號公共廁所";

/**
 * Pre-check-in gated screen shown to participants who haven't checked in yet.
 *
 * Scenario 1 (time not yet): Shows YouTube video + countdown + map navigation
 * Scenario 2 (time arrived): Shows check-in prompt with location info
 */
export default function PreCheckInScreen({
  eventStartTime,
}: PreCheckInScreenProps) {
  const targetTime = eventStartTime || DEFAULT_EVENT_START;
  const [hasTimeArrived] = useState(
    () => Date.now() >= new Date(targetTime).getTime()
  );

  if (hasTimeArrived) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface p-6">
        <div className="w-full max-w-sm text-center">
          {/* Check-in icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-100">
            <svg
              className="h-10 w-10 text-primary-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>

          <h1 className="mb-3 text-xl font-extrabold text-warm-800">
            請先完成報到
          </h1>
          <p className="mb-6 text-sm leading-relaxed text-warm-600">
            請先至<span className="font-semibold text-primary-600">{LOCATION_TEXT}</span>進行報到
          </p>

          {/* Navigate button */}
          <a
            href={GOOGLE_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:bg-primary-600 hover:shadow-xl active:scale-95"
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
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
            前往導航
          </a>
        </div>
      </div>
    );
  }

  // Scenario 1: Time hasn't arrived yet
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="mx-auto w-full max-w-sm flex-1 px-5 py-8">
        {/* YouTube embed */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-warm-900 shadow-lg">
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=0&rel=0`}
              title="活動影片"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* Countdown */}
        <div className="mb-6 rounded-2xl border border-warm-100 bg-surface-raised p-5 shadow-xs">
          <CountdownTimer targetTime={targetTime} />
        </div>

        {/* Location info */}
        <div className="rounded-2xl border border-warm-100 bg-surface-raised p-5 shadow-xs">
          <div className="mb-3 flex items-center gap-2">
            <svg
              className="h-5 w-5 text-primary-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <h2 className="text-sm font-bold text-warm-800">報到地點</h2>
          </div>
          <p className="mb-4 text-sm text-warm-600">{LOCATION_TEXT}</p>
          <a
            href={GOOGLE_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-primary-500/20 transition-all hover:bg-primary-600 active:scale-95"
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
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
            前往導航
          </a>
        </div>
      </div>
    </div>
  );
}
