/**
 * AnchoredToPanel — live, honest "Anchored To" feed.
 *
 * Pulls the watcher_status list from the same D1-backed Worker that
 * /live-ledger uses. Renders with the actual last_checked UTC timestamp
 * pulled live from D1 — not a static "last checked 2h ago" string.
 *
 * Live timestamps turn attribution from a credit list (which everyone
 * has) into a demonstration (which nobody else can show). Cost: one
 * upstream fetch cached 30s on the Pages Function.
 *
 * If upstream is unreachable, the panel renders honestly with a visible
 * "upstream unavailable" notice — NOT fabricated green dots. That is the
 * project rule against "simulation output under a measured label".
 */

import { useEffect, useState } from "react";

type Watcher = {
  source: string;
  status: "LIVE" | "STALE" | "UNREACHABLE" | string;
  last_checked: string;
  last_hash?: string;
  uri?: string;
};

type ColorClass = string;

const STATUS_DOT: Record<string, ColorClass> = {
  LIVE: "bg-emerald-500",
  STALE: "bg-amber-500",
  UNREACHABLE: "bg-rose-500",
};

function relTime(iso: string, nowMs: number): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "—";
  const delta = Math.max(0, nowMs - t);
  const sec = Math.round(delta / 1000);
  if (sec < 60) return sec + "s ago";
  const min = Math.round(sec / 60);
  if (min < 60) return min + "m ago";
  const hr = Math.round(min / 60);
  if (hr < 48) return hr + "h ago";
  const day = Math.round(hr / 24);
  return day + "d ago";
}

export function AnchoredToPanel() {
  const [watchers, setWatchers] = useState<Watcher[] | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch("/api/worker/anchors")
        .then((r) => r.json())
        .then((d) => {
          if (cancelled) return;
          setWatchers(Array.isArray(d.watchers) ? d.watchers : []);
          setFetchedAt(new Date().toISOString());
          setErr(null);
        })
        .catch((e) => {
          if (cancelled) return;
          setErr(String(e?.message ?? e));
        });
    load();
    // The Pages Function caches for 30s, so re-fetching every 5min is fine.
    const id = setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (err && !watchers) {
    return (
      <div className="border-t border-gray-200 mt-8 pt-8">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
          Anchored To
        </h4>
        <p className="text-xs text-rose-500">
          Live anchor feed unavailable ({err}). The static anchor list below is the same data we publish.
        </p>
      </div>
    );
  }
  if (!watchers) {
    return (
      <div className="border-t border-gray-200 mt-8 pt-8">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
          Anchored To
        </h4>
        <p className="text-xs text-gray-500">Loading live watch timestamps…</p>
      </div>
    );
  }

  const live = watchers.filter((w) => w.status === "LIVE").length;
  const now = Date.now();

  return (
    <div className="border-t border-gray-200 mt-8 pt-8">
      <div className="flex items-baseline justify-between mb-3">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          Anchored To
        </h4>
        <span className="text-[10px] text-gray-400">
          {live}/{watchers.length} LIVE · fetched {relTime(fetchedAt, now)} ago
        </span>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-xs text-gray-500">
        {watchers.map((w) => (
          <li key={w.source} className="flex items-center gap-2 min-w-0">
            <span
              className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${STATUS_DOT[w.status] ?? "bg-gray-400"}`}
              aria-label={w.status}
            />
            <span className="truncate flex-1">{w.source}</span>
            <span className="ml-auto flex-shrink-0 font-mono text-[10px] text-gray-400">
              {relTime(w.last_checked, now)} ago
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AnchoredToPanel;
