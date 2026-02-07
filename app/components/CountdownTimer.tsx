"use client";

import { useEffect, useState } from "react";

const TARGET_DATE = new Date("2026-06-27T00:00:00").getTime();

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(): TimeLeft {
  const diff = TARGET_DATE - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="neon-glow-cyan rounded-xl bg-surface px-4 py-3 sm:px-6 sm:py-4">
        <span className="text-3xl font-bold tabular-nums text-neon-cyan sm:text-5xl">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="mt-2 text-xs uppercase tracking-widest text-gray-500">
        {label}
      </span>
    </div>
  );
}

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!timeLeft) {
    return (
      <div className="flex gap-3 sm:gap-5">
        {["Days", "Hours", "Minutes", "Seconds"].map((label) => (
          <div key={label} className="flex flex-col items-center">
            <div className="rounded-xl bg-surface px-4 py-3 sm:px-6 sm:py-4">
              <span className="text-3xl font-bold text-gray-600 sm:text-5xl">
                --
              </span>
            </div>
            <span className="mt-2 text-xs uppercase tracking-widest text-gray-500">
              {label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 sm:gap-5">
      <TimeUnit value={timeLeft.days} label="Days" />
      <TimeUnit value={timeLeft.hours} label="Hours" />
      <TimeUnit value={timeLeft.minutes} label="Minutes" />
      <TimeUnit value={timeLeft.seconds} label="Seconds" />
    </div>
  );
}
