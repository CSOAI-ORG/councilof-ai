import { useEffect, useMemo, useState } from "react";

/**
 * XrplReaderRail — the live XRPL reader, quoted from GET /api/xrpl at runtime.
 *
 * P0.3 (CSOAI_FRONTEND_REACH_AGENTS_01Sep2026): homepage / scoreboard / OS side
 * rail must quote the LIVE reader names. NOTHING here is typed: the names, the
 * count, writes_board and the unsigned-leaf honesty flag are all read from the
 * endpoint on every load, because the sixteen can change and a typed list would
 * silently rot (the old attest tape — Archax × abrdn, OpenEden TBILL — is a
 * different list and must never be printed as this reader).
 *
 * Loader grammar (A3): LOADING → skeleton rows, no fake numbers.
 * UNREACHABLE → that word, never a last-cached list rendered as live.
 */

type XrplAsset = {
  symbol?: string;
  issuer?: string;
  verified_via?: string;
  sig_ed25519?: string | null;
};

type XrplReaderDoc = {
  kind?: string;
  writes_board?: boolean;
  n?: number;
  as_of?: string;
  assets?: XrplAsset[];
};

type Wire =
  | { state: "loading" }
  | { state: "unreachable"; detail: string }
  | { state: "live"; doc: XrplReaderDoc };

export default function XrplReaderRail({
  heading = "XRPL reader — live",
  className = "",
}: {
  heading?: string;
  className?: string;
}) {
  const [wire, setWire] = useState<Wire>({ state: "loading" });

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/xrpl", { signal: ac.signal, headers: { accept: "application/json" } })
      .then(async (r) => {
        if (!r.ok) throw new Error(`GET /api/xrpl HTTP ${r.status}`);
        if (!(r.headers.get("content-type") || "").toLowerCase().includes("json"))
          throw new Error("GET /api/xrpl answered HTML, not the API");
        const doc = (await r.json()) as XrplReaderDoc;
        if (!Array.isArray(doc.assets)) throw new Error("GET /api/xrpl: no assets[]");
        setWire({ state: "live", doc });
      })
      .catch((e) => {
        if (ac.signal.aborted) return;
        setWire({ state: "unreachable", detail: String(e?.message || e) });
      });
    return () => ac.abort();
  }, []);

  const unsigned = useMemo(
    () =>
      wire.state === "live"
        ? (wire.doc.assets || [])
            .filter((a) => a.sig_ed25519 == null)
            .map((a) => a.symbol || "?")
        : [],
    [wire],
  );

  return (
    <aside
      aria-labelledby="xrpl-rail-h"
      data-testid="xrpl-reader-rail"
      className={`rounded-2xl border border-slate-200 bg-white p-5 ${className}`}
    >
      <h2 id="xrpl-rail-h" className="text-sm font-black uppercase tracking-wide text-slate-900">
        {heading}
      </h2>
      <p className="mt-1 text-xs text-slate-600">
        Names quoted from GET <a className="underline" href="/api/xrpl">/api/xrpl</a> on this load —
        never a typed list. A reader, not a grade: it writes nothing onto the board.
      </p>

      {wire.state === "loading" && (
        <ul className="mt-3 space-y-1.5" aria-hidden="true" data-testid="xrpl-rail-loading">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="h-5 animate-pulse rounded bg-slate-100" />
          ))}
        </ul>
      )}

      {wire.state === "unreachable" && (
        <p className="mt-3 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm font-semibold text-rose-800" data-testid="xrpl-rail-unreachable">
          UNREACHABLE — {wire.detail}. No names are shown, because none were read this load.
          Nothing cached is standing in for the live reader.
        </p>
      )}

      {wire.state === "live" && (
        <>
          <p className="mt-2 font-mono text-[11px] text-emerald-800" data-testid="xrpl-rail-facts">
            kind={wire.doc.kind ?? "—"} · n={wire.doc.n ?? wire.doc.assets!.length} ·{" "}
            writes_board={String(wire.doc.writes_board ?? "—")}
          </p>
          <ul className="mt-3 grid gap-x-4 gap-y-1 text-[13px] sm:grid-cols-2" data-testid="xrpl-rail-names">
            {wire.doc.assets!.map((a) => (
              <li key={`${a.symbol}-${a.issuer}`} className="flex items-baseline gap-1.5">
                <span className="font-mono font-semibold text-slate-900">{a.symbol}</span>
                <span className="truncate text-slate-600">{a.issuer}</span>
                {a.sig_ed25519 == null && (
                  <span
                    className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-1.5 text-[10px] font-bold text-amber-800"
                    title="sig_ed25519 is null on this leaf (NO_LAPTOP_SIGN) — an honest gap, not an error"
                  >
                    unsigned
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-slate-600" data-testid="xrpl-rail-honesty">
            {unsigned.length > 0 ? (
              <>
                Honesty flag: <span className="font-mono">{unsigned.join(", ")}</span>{" "}
                carr{unsigned.length === 1 ? "ies" : "y"} <code>sig_ed25519: null</code> on this
                load (NO_LAPTOP_SIGN) — the gap is printed, never painted over.
              </>
            ) : (
              <>Every leaf on this load carries a signature — this sentence is computed, not promised.</>
            )}{" "}
            Coverage of public identity-verified issued assets. Not clients. Not a rating.
          </p>
        </>
      )}
    </aside>
  );
}
