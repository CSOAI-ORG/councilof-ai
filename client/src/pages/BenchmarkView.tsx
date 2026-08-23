// BenchmarkView — the Council OS "Benchmarks" product tab.
// Surfaces: (1) OUR measured arena Elo with Wilson CIs (MEASURED, deterministic),
// (2) the 6 assessed third-party benchmark records (benchmark-quality register),
// (3) OpenRouter catalogue + LMArena as REPORTED context — never fused.
import { useEffect, useState } from "react";

interface EloRow { model: string; elo: number; games: number; winrate: number; ci: number[] }
interface RegRecord { id: string; benchmark: string; publisher: string; tally: { checked: number; pass: number; fail: number; unknown: number } }

export default function BenchmarkView() {
  const [elo, setElo] = useState<EloRow[] | null>(null);
  const [reg, setReg] = useState<RegRecord[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/arena/elo").then(r => r.json()).catch(() => null),
      fetch("/api/benchmark-quality").then(r => r.json()).catch(() => null),
    ]).then(([e, q]) => {
      setElo(e?.leaderboard ?? null);
      setReg(q?.records ?? null);
    }).catch(() => setErr("failed to load"));
  }, []);

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

      {/* Our Elo leaderboard */}
      <section className="mb-8 rounded-2xl border border-emerald-400/20 bg-emerald-950/30 p-5">
        <h2 className="mb-3 text-sm font-bold text-emerald-100">🏟 Arena Elo — measured, deterministic</h2>
        {err && <p className="text-xs text-red-300">{err}</p>}
        {!elo && !err && <p className="text-xs text-emerald-200/50">loading leaderboard…</p>}
        {elo && elo.length === 0 && <p className="text-xs text-emerald-200/50">no models with nu22655 yet.</p>}
        {elo && elo.length > 0 && (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-emerald-400/20 text-emerald-300/70">
                <th className="py-2 pr-4">Model</th><th className="py-2 pr-4">Elo</th>
                <th className="py-2 pr-4">Games</th><th className="py-2 pr-4">Win rate</th>
                <th className="py-2">95% CI</th>
              </tr>
            </thead>
            <tbody>
              {elo.map(r => (
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
        )}
        <p className="mt-3 text-[10px] text-emerald-200/40">
          Bradley-Terry Elo, K=32, Wilson 95% CI on win rate (n≥5). MEASURED — deterministic, no model judges.
          LMArena-style CIs published, never hidden. Not a certification.
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
    </div>
  );
}
