import { useEffect, useState } from "react";

/**
 * Shared countdown tiles — one clock, one tile, used by every deadline surface
 * (/countdown, /art50). Dates are never in this file: callers pass an ISO date
 * from the regulation register. Initial state is computed synchronously so the
 * prerender bakes real numbers, then a 1s interval keeps the tiles honest live.
 */

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  passed: boolean;
}

export function computeTimeLeft(iso: string): TimeLeft {
  const diff = new Date(`${iso}T00:00:00Z`).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, passed: true };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    passed: false,
  };
}

/** Ticks every second; initial state is computed synchronously so the prerender is fat. */
export function useTimeLeft(iso: string): TimeLeft {
  const [t, setT] = useState<TimeLeft>(() => computeTimeLeft(iso));
  useEffect(() => {
    const id = setInterval(() => setT(computeTimeLeft(iso)), 1000);
    return () => clearInterval(id);
  }, [iso]);
  return t;
}

export function Tile({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`min-w-[58px] rounded-lg border px-3 py-2 text-center sm:min-w-[70px] ${tone}`}
      >
        <span className="text-2xl font-black tabular-nums sm:text-3xl">
          {value.toString().padStart(2, "0")}
        </span>
      </div>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-100/60">
        {label}
      </span>
    </div>
  );
}

export function urgency(days: number): "critical" | "soon" | "calm" {
  if (days < 30) return "critical";
  if (days < 180) return "soon";
  return "calm";
}

export const URGENCY_TILE: Record<string, string> = {
  critical: "border-red-400/50 bg-red-500/15 text-red-200",
  soon: "border-amber-400/50 bg-amber-500/10 text-amber-200",
  calm: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
};
export const URGENCY_LABEL: Record<string, { text: string; cls: string }> = {
  critical: { text: "under 30 days", cls: "border-red-400/50 bg-red-500/15 text-red-200" },
  soon: { text: "under 6 months", cls: "border-amber-400/50 bg-amber-500/10 text-amber-200" },
  calm: { text: "on the horizon", cls: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" },
};
