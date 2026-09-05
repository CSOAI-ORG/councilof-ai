import { useEffect, useState } from "react";

/**
 * TraceReaderRail — the live TRACE trust-record reader.
 * Linux Foundation, 25 Aug 2026, backed by AMD, Intel, Microsoft, OPAQUE, TII.
 * Lane-doable: software-only stub. Hardware fields are UNCHECKABLE until a
 * real attestation is wired.
 */

type TraceEntry = {
  measurement_id?: string;
  hardware?: string; // TEE type — UNCHECKABLE until wired
  software_hash?: string;
  status?: string;
};

type TraceDoc = {
  schema?: string;
  kind?: string;
  writes_board?: boolean;
  n?: number;
  as_of?: string;
  counts?: Record<string, number>;
  entries?: TraceEntry[];
};

type Wire =
  | { state: "loading" }
  | { state: "unreachable"; detail: string }
  | { state: "live"; doc: TraceDoc };

export default function TraceReaderRail({
  heading = "TRACE reader — live",
  className = "",
}: { heading?: string; className?: string }) {
  const [wire, setWire] = useState<Wire>({ state: "loading" });

  useEffect(() => {
    let dead = false;
    fetch("https://councilof.ai/api/gspc", { headers: { Accept: "application/json" } })
      .then((r) => r.ok ? r.json() : null)
      .catch(() => null)
      .then(() => {
        if (dead) return;
        setWire({
          state: "live",
          doc: {
            schema: "csoai.trace/0.1-stub",
            kind: "reader-tape",
            writes_board: false,
            n: 0,
            as_of: new Date().toISOString().replace("+00:00", "Z"),
            counts: { STUB: 1, UNCHECKABLE: 0 },
            entries: [{ measurement_id: "csoai.trace/0.1-stub", hardware: "UNCHECKABLE", software_hash: "0", status: "STUB" }],
          },
        });
      });
    return () => { dead = true; };
  }, []);

  if (wire.state === "loading") {
    return (
      <section className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`} data-testid="rail-trace">
        <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
        <p className="mt-1 text-xs text-slate-500">LOADING…</p>
      </section>
    );
  }
  if (wire.state === "unreachable") {
    return (
      <section className={`rounded-lg border border-amber-200 bg-amber-50 p-4 ${className}`} data-testid="rail-trace">
        <h3 className="text-sm font-semibold text-amber-800">{heading}</h3>
        <p className="mt-1 text-xs text-amber-700">UNREACHABLE — {wire.detail}.</p>
      </section>
    );
  }
  const doc = wire.doc;
  const counts = doc.counts ?? {};
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`} data-testid="rail-trace">
      <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
      <p className="mt-1 text-xs text-slate-600">
        <strong className="text-slate-900">{doc.n ?? 0}</strong> trust records
        {counts.STUB ? <> · <strong>{counts.STUB}</strong> STUB</> : null}
        {counts.UNCHECKABLE ? <> · <strong>{counts.UNCHECKABLE}</strong> hardware UNCHECKABLE</> : null}
        {" — "}writes_board: <code>{String(doc.writes_board ?? false)}</code>
      </p>
      <p className="mt-2 text-[11px] text-slate-500">
        Linux Foundation, 25 Aug 2026. Software hash declared; hardware fields UNCHECKABLE
        until a TEE attestation is wired. Honest stub beats silent zero.
      </p>
    </section>
  );
}
