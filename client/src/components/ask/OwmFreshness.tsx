/**
 * OwmFreshness — how old the outer world model snapshot is, against the staleness bound the
 * snapshot itself declares. Reads GET /api/owm: generated_at and stale_after_s are the snapshot's
 * own fields; age is computed here from the reader's clock. A snapshot older than its bound is
 * shown as STALE, never as current. An unreadable snapshot says so; no time is shown in its place.
 */
import { useEffect, useState } from "react";

type Snap = { generated_at: string; stale_after_s: number; subjects: number | null } | null;

export function ageLabel(seconds: number): string {
  if (seconds < 90) return `${Math.max(0, Math.round(seconds))} s`;
  if (seconds < 5400) return `${Math.round(seconds / 60)} min`;
  if (seconds < 172800) return `${Math.round(seconds / 3600)} h`;
  return `${Math.round(seconds / 86400)} d`;
}

export function freshness(generatedAt: string, staleAfterS: number, now = Date.now()): { age: number; stale: boolean } {
  const age = (now - Date.parse(generatedAt)) / 1000;
  return { age, stale: !(age <= staleAfterS) };
}

export default function OwmFreshness({ className = "" }: { className?: string }) {
  const [snap, setSnap] = useState<Snap>(null);
  const [err, setErr] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let live = true;
    fetch("/api/owm", { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: Record<string, unknown>) => {
        if (!live) return;
        if (typeof d.generated_at !== "string" || typeof d.stale_after_s !== "number") throw new Error("no generated_at / stale_after_s");
        const counts = d.counts as Record<string, unknown> | undefined;
        setSnap({ generated_at: d.generated_at, stale_after_s: d.stale_after_s, subjects: typeof counts?.subjects === "number" ? counts.subjects : null });
      })
      .catch((e: unknown) => live && setErr(e instanceof Error ? e.message : String(e)));
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      live = false;
      window.clearInterval(t);
    };
  }, []);

  if (err)
    return (
      <p className={`text-xs text-muted-foreground ${className}`} data-testid="owm-freshness" data-state="UNREAD">
        World-model snapshot: GET /api/owm could not be read ({err}). No time is shown in its place.
      </p>
    );
  if (!snap)
    return (
      <p className={`text-xs text-muted-foreground ${className}`} data-testid="owm-freshness" data-state="LOADING">
        Reading the world-model snapshot…
      </p>
    );
  const { age, stale } = freshness(snap.generated_at, snap.stale_after_s, now);
  const at = snap.generated_at.replace("T", " ").replace(/:\d\dZ$/, "Z");
  return (
    <p className={`text-xs text-muted-foreground ${className}`} data-testid="owm-freshness" data-state={stale ? "STALE" : "FRESH"}>
      <a href="/api/owm" className="font-medium text-foreground underline underline-offset-2">
        World-model snapshot
      </a>{" "}
      generated {at}, {ageLabel(age)} ago:{" "}
      <span
        className={`rounded px-1 font-mono font-bold ${stale ? "bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100" : "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"}`}
      >
        {stale ? "STALE" : "FRESH"}
      </span>{" "}
      (the snapshot says it goes stale after {ageLabel(snap.stale_after_s)}
      {snap.subjects !== null ? `; ${snap.subjects} subjects` : ""}).
    </p>
  );
}
