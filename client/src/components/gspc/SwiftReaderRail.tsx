import { useEffect, useState } from "react";

/**
 * SwiftReaderRail — the live SWIFT reader, quoted from GET /api/swift at runtime.
 * Lane-doable: only reads; nothing typed. Loader: LOADING → skeleton;
 * UNREACHABLE → that word, never a last-cached list.
 */

type SwiftEntry = {
  bank?: string;
  status?: string;
  press_url?: string | null;
  as_of?: string | null;
};

type SwiftDoc = {
  schema?: string;
  kind?: string;
  writes_board?: boolean;
  n?: number;
  as_of?: string;
  counts?: Record<string, number>;
  entries?: SwiftEntry[];
};

type Wire =
  | { state: "loading" }
  | { state: "unreachable"; detail: string }
  | { state: "live"; doc: SwiftDoc };

export default function SwiftReaderRail({
  heading = "SWIFT reader — live",
  className = "",
}: { heading?: string; className?: string }) {
  const [wire, setWire] = useState<Wire>({ state: "loading" });

  useEffect(() => {
    let dead = false;
    fetch("https://councilof.ai/api/swift", { headers: { Accept: "application/json" } })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return await r.json();
      })
      .then((doc) => {
        if (dead) return;
        setWire({ state: "live", doc: doc as SwiftDoc });
      })
      .catch((e) => {
        if (dead) return;
        setWire({ state: "unreachable", detail: String(e?.message || e) });
      });
    return () => { dead = true; };
  }, []);

  if (wire.state === "loading") {
    return (
      <section className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`} data-testid="rail-swift">
        <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
        <p className="mt-1 text-xs text-slate-500">LOADING — fetching GET /api/swift…</p>
      </section>
    );
  }
  if (wire.state === "unreachable") {
    return (
      <section className={`rounded-lg border border-amber-200 bg-amber-50 p-4 ${className}`} data-testid="rail-swift">
        <h3 className="text-sm font-semibold text-amber-800">{heading}</h3>
        <p className="mt-1 text-xs text-amber-700">UNREACHABLE — {wire.detail}. Cite <code>GET /api/swift</code> when it returns.</p>
      </section>
    );
  }
  const doc = wire.doc;
  const n = doc.n ?? doc.counts?.n ?? 0;
  const counts = doc.counts ?? {};
  const entries = (doc.entries ?? []).slice(0, 6);

  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`} data-testid="rail-swift">
      <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
      <p className="mt-1 text-xs text-slate-600">
        <strong className="text-slate-900">{n}</strong> banks in the census
        {counts.LIVE ? <> · <strong className="text-emerald-700">{counts.LIVE}</strong> LIVE</> : null}
        {counts.COMMITTED ? <> · <strong>{counts.COMMITTED}</strong> COMMITTED</> : null}
        {counts.DISCOVERED ? <> · <strong>{counts.DISCOVERED}</strong> DISCOVERED</> : null}
        {" — "}writes_board: <code>{String(doc.writes_board ?? false)}</code> · as_of {doc.as_of ?? "?"}
      </p>
      <ul className="mt-2 space-y-1">
        {entries.map((e, i) => (
          <li key={i} className="text-xs text-slate-700 flex justify-between gap-2">
            <span className="truncate">{e.bank || "(unnamed)"}</span>
            <span className="shrink-0 font-mono text-[10px] text-slate-500">{e.status || "DISCOVERED"}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-slate-500">Reader only — never a GSPC grade. <code>GET /api/swift</code> is the authority.</p>
    </section>
  );
}
