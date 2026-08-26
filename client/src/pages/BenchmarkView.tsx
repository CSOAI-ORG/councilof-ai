// BenchmarkView — the Council OS "Benchmarks" product tab.
// Surfaces: (1) our measured arena Elo with Wilson CIs — served from the SAME
// signed static feed the /gspc-scoreboard panel uses (/arena/elo_reference.json,
// schema csoai.arena-elo-reference/0.1), with an independent in-browser verify,
// and (2) the assessed third-party benchmark-quality register (/api/benchmark-quality).
// MEASURED (ours, signed) vs REPORTED (third-party, attributed) — never blended.
import { useEffect, useState } from "react";
import { sha256Hex, verifyEd25519Detached } from "@/lib/verify";

interface EloRow { model: string; elo: number; games: number; winrate: number; ci: number[] }
interface EloRef {
  axes?: string[];
  generated?: string;
  leaderboard?: EloRow[];
  per_axis?: Record<string, EloRow[]>;
  content_id?: string;
  signature?: { sig?: string; pubkey?: string };
  register?: string;
  method?: string;
}
interface RegRecord { id: string; benchmark: string; publisher: string; tally: { checked: number; pass: number; fail: number; unknown: number } }

function sortKeysDeep(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeysDeep);
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v as Record<string, unknown>).sort()) out[k] = sortKeysDeep((v as Record<string, unknown>)[k]);
    return out;
  }
  return v;
}

export default function BenchmarkView() {
  const [elo, setElo] = useState<EloRef | null>(null);
  const [reg, setReg] = useState<RegRecord[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [axis, setAxis] = useState<string>("overall");
  const [verifyState, setVerifyState] = useState<"idle" | "checking" | "ok" | "bad">("idle");

  useEffect(() => {
    Promise.all([
      fetch("/arena/elo_reference.json").then(r => (r.ok ? r.json() : null)).catch(() => null),
      fetch("/api/benchmark-quality").then(r => r.json()).catch(() => null),
    ]).then(([e, q]) => {
      setElo(e ?? null);
      setReg(q?.records ?? null);
    }).catch(() => setErr("failed to load"));
  }, []);

  async function verifySigned() {
    if (!elo) return;
    setVerifyState("checking");
    try {
      const body: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(elo)) {
        if (k !== "content_id" && k !== "signature") body[k] = v;
      }
      const canonSorted = JSON.stringify(sortKeysDeep(body));
      const want = await sha256Hex(canonSorted);
      const res = await verifyEd25519Detached(
        new TextEncoder().encode(canonSorted),
        elo.signature?.sig || "",
        elo.signature?.pubkey || "",
        want,
        undefined,
      );
      setVerifyState(res.ok ? "ok" : "bad");
    } catch (e) {
      setVerifyState("bad");
    }
  }

  const rows = axis === "overall" ? (elo?.leaderboard || []) : (elo?.per_axis?.[axis] || []);
  const axes = elo?.axes || [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-emerald-100">Benchmarks</h1>
        <p className="mt-1 text-xs text-emerald-200/60">
          Our measured arena Elo (deterministic, Wilson 95% CIs) beside the assessed
          third-party benchmark register. <span className="text-emerald-300">MEASURED</span> (ours,
          signed) vs <span className="text-amber-300">REPORTED</span> (third-party, attributed) — never blended.
        </p>
      </div>

      {/* Our Elo leaderboard — same signed feed as /gspc-scoreboard */}
      <section className="mb-8 rounded-2xl border border-emerald-400/20 bg-emerald-950/30 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-emerald-100">🏟 Arena Elo — measured, signed</h2>
          <button
            onClick={verifySigned}
            className="rounded-lg border border-emerald-400/30 px-3 py-1 text-[10px] font-bold text-emerald-200 hover:bg-emerald-400/10"
          >
            {verifyState === "checking" ? "Verifying…" : "Verify the signature"}
          </button>
        </div>
        {verifyState === "ok" && (
          <p className="mb-3 rounded-lg bg-emerald-400/10 px-3 py-2 text-[10px] font-semibold text-emerald-300">
            ✓ Signature verified — this leaderboard matches the signed body.
          </p>
        )}
        {verifyState === "bad" && (
          <p className="mb-3 rounded-lg bg-red-400/10 px-3 py-2 text-[10px] font-semibold text-red-300">
            ✗ Signature does NOT verify — content may have been altered.
          </p>
        )}
        {err && <p className="text-xs text-red-300">{err}</p>}
        {!elo && !err && <p className="text-xs text-emerald-200/50">loading leaderboard…</p>}
        {elo && rows.length === 0 && <p className="text-xs text-emerald-200/50">no models with n\u22655 yet.</p>}
        {elo && rows.length > 0 && (
          <>
            <div className="mb-3 flex flex-wrap gap-1.5">
              <button
                onClick={() => setAxis("overall")}
                className={`rounded-full px-3 py-1 text-[10px] font-semibold ${axis === "overall" ? "bg-emerald-400/25 text-emerald-100" : "border border-emerald-400/20 text-emerald-300/60 hover:bg-emerald-400/10"}`}
              >
                Overall
              </button>
              {axes.map((a: string) => (
                <button
                  key={a}
                  onClick={() => setAxis(a)}
                  className={`rounded-full px-3 py-1 text-[10px] font-semibold ${axis === a ? "bg-emerald-400/25 text-emerald-100" : "border border-emerald-400/20 text-emerald-300/60 hover:bg-emerald-400/10"}`}
                >
                  {a}
                </button>
              ))}
            </div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-emerald-400/20 text-emerald-300/70">
                  <th className="py-2 pr-4">Model</th><th className="py-2 pr-4">Elo</th>
                  <th className="py-2 pr-4">Games</th><th className="py-2 pr-4">Win rate</th>
                  <th className="py-2">95% CI</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.model} className="border-b border-emerald-400/10">
                    <td className="py-2 pr-4 font-mono text-emerald-100">{r.model}</td>
                    <td className="py-2 pr-4 font-bold text-emerald-300">{r.elo.toFixed(1)}</td>
                    <td className="py-2 pr-4 text-emerald-200/70">{r.games}</td>
                    <td className="py-2 pr-4 text-emerald-200/70">{(r.winrate * 100).toFixed(1)}%</td>
                    <td className="py-2 text-emerald-200/60">[{r.ci[0].toFixed(3)} – {r.ci[1].toFixed(3)}]</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        <p className="mt-3 text-[10px] text-emerald-200/40">
          {elo?.method || "Bradley-Terry Elo, K=32, Wilson 95% CI on win rate (n\u22655)."} MEASURED — deterministic, no model judges.
          Signed static feed: /arena/elo_reference.json (schema csoai.arena-elo-reference/0.1). LMArena-style CIs published, never hidden. Not a certification.
        </p>
      </section>

      {/* Assessed third-party benchmark register */}
      <section className="rounded-2xl border border-amber-400/20 bg-amber-950/20 p-5">
        <h2 className="mb-3 text-sm font-bold text-amber-100">📋 Benchmark-quality register — REPORTED (attributed)</h2>
        {!reg && <p className="text-xs text-amber-200/50">loading register…</p>}
        {reg && reg.length === 0 && <p className="text-xs text-amber-200/50">no assessed records yet.</p>}
        {reg && reg.length > 0 && (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-amber-400/20 text-amber-300/70">
                <th className="py-2 pr-4">Benchmark</th><th className="py-2 pr-4">Publisher</th>
                <th className="py-2 pr-4">PASS</th><th className="py-2 pr-4">FAIL</th>
                <th className="py-2">UNKNOWN</th>
              </tr>
            </thead>
            <tbody>
              {reg.map(r => (
                <tr key={r.id} className="border-b border-amber-400/10">
                  <td className="py-2 pr-4 font-mono text-amber-100">{r.benchmark}</td>
                  <td className="py-2 pr-4 text-amber-200/70">{r.publisher}</td>
                  <td className="py-2 pr-4 font-bold text-emerald-300">{r.tally?.pass ?? 0}</td>
                  <td className="py-2 pr-4 text-red-300">{r.tally?.fail ?? 0}</td>
                  <td className="py-2 text-amber-200/60">{r.tally?.unknown ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="mt-3 text-[10px] text-amber-200/40">
          21 deterministic process-integrity predicates per benchmark. No model judges.
          Council of AI's own boards are structurally excluded (impartiality firewall).
        </p>
      </section>

      {/* The pairing — measured vs reported, never fused */}
      <section className="mt-6 rounded-2xl border border-emerald-400/10 bg-emerald-950/10 p-4">
        <h2 className="text-sm font-bold text-emerald-100">⚖️ The pairing — measured beside reported</h2>
        <p className="mt-2 text-xs text-emerald-200/60">
          Our signed measured Elo sits beside the assessed third-party register — two rails, one page,
          never one blended number. The machine-readable pairing (with the LMArena / OpenRouter REPORTED
          context rails and the UNKNOWN-honest overlap gate) is at{" "}
          <a href="/api/comparison" className="font-mono text-emerald-300 underline decoration-emerald-400/30 hover:text-emerald-100">
            /api/comparison
          </a>
          {" "}(schema csoai.comparison/0.1). OpenRouter routes inference; CSOAI refines it into signed,
          continuously-verifiable measurement data.
        </p>
      </section>
    </div>
  );
}
