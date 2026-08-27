import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useBoardCount } from "@/lib/boardCount";

/**
 * ArenaScoreboard — the signed, per-axis Elo leaderboard.
 *
 * Driven entirely by GET /api/arena/scoreboard (the pod-canonical signed artifact).
 * Every figure, n, and count is read from the payload — nothing hardcoded.
 *
 * ── WHICH COUNT IS THIS? (the reason this page used to read wrong) ────────────
 * The arena is a DIFFERENT INSTRUMENT from the GSPC board and legitimately has
 * its own, smaller axis set — see client/src/data/facts.json,
 * counts.namespaces.arena_elo. The number this page renders is the length of the
 * payload's own axis_pass_rates, and it is NOT the board's axis count. Until
 * 2026-08-26 the page printed it as a bare "N axes measured", which a reader had
 * no way to distinguish from the board's count and which also called thin-n axes
 * measured. It is now named for its instrument, split into slots vs rankable,
 * and shown beside the board's derived count so the two cannot be confused.
 * Forcing the arena to the board's number would destroy information, not fix it.
 *
 * THE HONESTY RULES (same as LiveLeaderboard):
 *   1. No number is hardcoded. Per-axis rate, n, and model list come from the API.
 *   2. A thin-n axis is a DESIGNED state — "insufficient data to rank", not a ranking.
 *   3. Every score is a measurement; the signature proof is the point. A "verify this
 *      leaderboard" toggle recomputes the content_id and shows match:true|false.
 *
 * Doctrine: measurement, not certification. We publish the verify path; neither
 * OpenRouter (usage rank, no provenance) nor LMArena (crowd Elo, no verify path) does.
 */

interface ModelScore {
  pass: number;
  n: number;
  rate: number;
}
interface AxisEntry {
  n_rounds: number;
  models: Record<string, ModelScore>;
}
type Payload = {
  schema?: string;
  generation?: string;
  as_of?: string;
  n_rounds?: number;
  bench_sources?: number;
  axis_pass_rates?: Record<string, AxisEntry>;
  doctrine?: string;
  signature?: { content_id?: string; sig?: string; kid?: string };
};

const pct = (r: number) => `${Math.round(r * 100)}%`;
const fmtAsOf = (iso?: string) => (iso ? new Date(iso).toUTCString().slice(0, 16) : "—");

export default function ArenaScoreboard() {
  // The GSPC board's own count, derived from /api/gspc — shown only to keep this
  // page's arena count from being read as the board's. Never typed.
  const board = useBoardCount();
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [verify, setVerify] = useState<{ content_id?: string; expected?: string; match?: boolean } | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/arena/scoreboard", { headers: { accept: "application/json" } })
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json() as Promise<Payload>;
      })
      .then((d) => alive && setData(d))
      .catch((e) => alive && setErr(String(e)));
    return () => {
      alive = false;
    };
  }, []);

  const runVerify = async () => {
    setVerifying(true);
    try {
      const r = await fetch("/api/arena/scoreboard?verify=1", { headers: { accept: "application/json" } });
      const d = await r.json();
      setVerify({ content_id: d.content_id, expected: d.expected, match: d.match });
    } catch {
      setVerify({ match: false, expected: "fetch failed" });
    } finally {
      setVerifying(false);
    }
  };

  if (err) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-center text-emerald-200/80">The signed leaderboard is not answering yet ({err}).</p>
        <p className="mt-2 text-center text-sm text-emerald-300/50">The A100 pod publishes it each cycle; the sync lands it here.</p>
      </div>
    );
  }
  if (!data) {
    return <div className="py-24 text-center text-emerald-200/70">Loading the signed leaderboard…</div>;
  }

  const axes = Object.entries(data.axis_pass_rates || {}).sort((a, b) => b[1].n_rounds - a[1].n_rounds);
  // Both numbers travel. axesCount counts the arena's SLOTS; rankableCount counts
  // the ones that clear the same n_rounds >= 3 threshold this page uses below to
  // decide whether an axis may be ranked at all. Quoting only the larger would
  // call a thin-n axis measured.
  const axesCount = axes.length;
  const rankableCount = axes.filter(([, entry]) => entry.n_rounds >= 3).length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/60">Council OS · measurement</p>
        <h1 className="mt-2 text-4xl sm:text-4xl font-black tracking-tight">
          The signed <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">per-axis leaderboard.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-emerald-100/80">
          Every score is a deterministic measurement of the OOWM fleet on a frozen probe.
          Every board is content-addressed and Ed25519-signed — you can recompute it and verify
          it against the published key. That verify path is the point: it is what neither a
          usage rank nor a crowd Elo can offer.
        </p>
        <p className="mt-3 max-w-2xl text-sm text-emerald-200/60">
          The arena measures a different thing over a different axis set from the GSPC board, so
          the two counts are not the same number and are not reconciled. The count on this page is
          the arena&apos;s own, read from <code>axis_pass_rates</code>. The board&apos;s count is{" "}
          <Link to="/gspc-scoreboard" className="underline hover:text-emerald-200">
            {board.public_count}
          </Link>
          , derived from <code>GET /api/gspc</code>.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-emerald-300/60">
            {axesCount} arena axes · {rankableCount} rankable
          </p>
          <p className="mt-0.5 font-mono text-2xl text-emerald-100">{data.n_rounds ?? 0} rounds</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-emerald-300/60">as of</p>
          <p className="mt-0.5 font-mono text-lg text-emerald-100">{fmtAsOf(data.as_of)}</p>
        </div>
        <button
          onClick={runVerify}
          disabled={verifying}
          className="ml-auto rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-[#03110b] hover:bg-emerald-400 disabled:opacity-50"
        >
          {verifying ? "Verifying…" : "Verify this leaderboard"}
        </button>
      </div>

      {verify && (
        <div className={`mb-6 rounded-2xl border p-4 text-sm ${verify.match ? "border-emerald-500/40 bg-emerald-500/10" : "border-amber-500/40 bg-amber-500/10"}`}>
          <p className="font-bold">
            {verify.match ? "✓ signature verified — the recomputed id matches." : "✗ signature check failed."}
          </p>
          <p className="mt-1 font-mono text-xs text-emerald-200/70">
            content_id: {verify.content_id?.slice(0, 16)}
            {verify.expected ? ` · expected: ${verify.expected.slice(0, 16)}` : ""}
          </p>
          <p className="mt-1 text-xs text-emerald-300/60">Recomputed on the edge, checked against the pod-signed content_id.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {axes.map(([axis, entry]) => {
          const models = Object.entries(entry.models).sort((a, b) => b[1].rate - a[1].rate);
          const hasData = entry.n_rounds >= 3;
          return (
            <div key={axis} className="rounded-2xl border border-emerald-500/15 bg-[#05140d] p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-mono text-lg font-bold text-emerald-100">{axis}</h3>
                <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  {entry.n_rounds} rounds
                </span>
              </div>
              {!hasData ? (
                <p className="mt-4 text-sm text-amber-300/80">insufficient data to rank — {entry.n_rounds} round(s) measured, ≥3 needed.</p>
              ) : (
                <table className="mt-4 w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-emerald-300/50">
                      <th className="pb-2">model</th>
                      <th className="pb-2 text-right">rate</th>
                      <th className="pb-2 text-right">n</th>
                    </tr>
                  </thead>
                  <tbody>
                    {models.map(([model, m]) => (
                      <tr key={model} className="border-t border-emerald-500/10">
                        <td className="py-1.5 font-mono text-emerald-100">{model}</td>
                        <td className="py-1.5 text-right font-mono text-emerald-200">{pct(m.rate)}</td>
                        <td className="py-1.5 text-right font-mono text-emerald-300/60">{m.n}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-emerald-300/60">
        Measurement, not certification. A thin-n axis is honest ("insufficient to rank"), never a
        ranking. Corrections appended, never edited.{" "}
        <Link to="/gspc-verify" className="underline hover:text-emerald-200">Verify a measurement</Link>
      </p>
    </div>
  );
}
