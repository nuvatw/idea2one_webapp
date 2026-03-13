"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetTime: string;
}

/**
 * Client component that displays a live countdown to the target time.
 * Shows HH:MM:SS format. Shows "時間到！" when countdown reaches zero.
 */
export default function CountdownTimer({ targetTime }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(targetTime));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calcTimeLeft(targetTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  if (timeLeft.total <= 0) {
    return (
      <div className="text-center">
        <p className="text-2xl font-extrabold text-primary-600">時間到！</p>
        <p className="mt-1 text-sm text-warm-500">請前往報到地點進行報到</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="mb-2 text-sm font-medium text-warm-500">距離活動開始還有</p>
      <div className="flex items-center justify-center gap-3">
        <TimeBlock value={timeLeft.hours} label="時" />
        <span className="text-2xl font-bold text-warm-300">:</span>
        <TimeBlock value={timeLeft.minutes} label="分" />
        <span className="text-2xl font-bold text-warm-300">:</span>
        <TimeBlock value={timeLeft.seconds} label="秒" />
      </div>
    </div>
  );
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="min-w-[56px] rounded-xl bg-primary-50 px-3 py-2 text-center text-3xl font-extrabold tabular-nums text-primary-700">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-1 text-xs text-warm-400">{label}</span>
    </div>
  );
}

function calcTimeLeft(targetTime: string) {
  const diff = new Date(targetTime).getTime() - Date.now();
  if (diff <= 0) return { total: 0, hours: 0, minutes: 0, seconds: 0 };

  return {
    total: diff,
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}
