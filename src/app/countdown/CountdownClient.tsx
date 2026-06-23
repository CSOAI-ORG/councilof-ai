"use client";

import { useEffect, useState } from "react";

const pad = (n: number) => n.toString().padStart(2, "0");

export default function CountdownClient() {
  const [timeLeft, setTimeLeft] = useState({ days: "--", hours: "--", minutes: "--", seconds: "--" });

  useEffect(() => {
    const target = new Date("2026-08-02T00:00:00Z").getTime();

    const update = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft({ days: "00", hours: "00", minutes: "00", seconds: "00" });
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({
        days: pad(d),
        hours: pad(h),
        minutes: pad(m),
        seconds: pad(s),
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {units.map((unit) => (
        <div
          key={unit.label}
          className="rounded-xl border-2 border-red-500/40 bg-slate-900/80 p-6 backdrop-blur"
        >
          <div className="bg-gradient-to-b from-red-400 to-amber-400 bg-clip-text text-4xl font-black tabular-nums text-transparent sm:text-5xl">
            {unit.value}
          </div>
          <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            {unit.label}
          </div>
        </div>
      ))}
    </div>
  );
}
