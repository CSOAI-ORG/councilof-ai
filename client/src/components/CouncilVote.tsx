import { useEffect, useRef, useState } from "react";

// CouncilVote — a DESIGN SIMULATION of the 33-seat council's supermajority quorum.
// This is an illustration of the architecture, not a live vote: the measured
// cross-checking value today is n_eff 1.21 of 3 (see /refutation-ledger).
// 33 nodes in a ring vote toward a supermajority quorum; a care-floor gauge holds at
// 0.95. Pure SVG + rAF, zero deps. Re-runs when `trigger` changes.
const N = 33;
const QUORUM = Math.ceil((2 * N) / 3); // 22 — Byzantine 2/3
const R = 120, CX = 150, CY = 150;

export default function CouncilVote({ trigger = 0, verdict }: { trigger?: number; verdict?: string }) {
  const [votes, setVotes] = useState<number[]>(() => Array(N).fill(0)); // 0 idle, 1 agree, -1 dissent
  const [phase, setPhase] = useState<"idle" | "voting" | "done">("idle");
  const raf = useRef<number | null>(null);

  useEffect(() => {
    // reset + run a consensus round
    setVotes(Array(N).fill(0)); setPhase("voting");
    const order = Array.from({ length: N }, (_, i) => i).sort(() => Math.random() - 0.5);
    let i = 0;
    const step = () => {
      if (i >= N) { setPhase("done"); return; }
      const idx = order[i];
      // ~85% agree, a few honest dissenters (BFT tolerates them)
      const v = Math.random() < 0.85 ? 1 : -1;
      setVotes((prev) => { const next = prev.slice(); next[idx] = v; return next; });
      i++;
      raf.current = window.setTimeout(step, 55) as unknown as number;
    };
    raf.current = window.setTimeout(step, 250) as unknown as number;
    return () => { if (raf.current) clearTimeout(raf.current); };
  }, [trigger]);

  const agree = votes.filter((v) => v === 1).length;
  const dissent = votes.filter((v) => v === -1).length;
  const reached = agree >= QUORUM;

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-black text-emerald-100">33-seat Council <span className="text-[10px] font-bold text-emerald-300/60">design simulation</span></div>
        <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + (reached ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-emerald-300/60")}>{phase === "done" ? (reached ? "consensus reached" : "no quorum") : "voting…"}</span>
      </div>
      <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
        <svg viewBox="0 0 300 300" className="h-56 w-56 shrink-0">
          <circle cx={CX} cy={CY} r={R + 16} fill="none" stroke="rgba(16,185,129,.12)" strokeWidth="1" />
          {/* consensus arcs */}
          {votes.map((v, i) => {
            const a = (i / N) * Math.PI * 2 - Math.PI / 2;
            const x = CX + R * Math.cos(a), y = CY + R * Math.sin(a);
            const col = v === 1 ? "#34d399" : v === -1 ? "#f59e0b" : "#1f3d31";
            return (
              <g key={i}>
                {v !== 0 && <line x1={CX} y1={CY} x2={x} y2={y} stroke={v === 1 ? "rgba(52,211,153,.25)" : "rgba(245,158,11,.2)"} strokeWidth="1" />}
                <circle cx={x} cy={y} r={v === 0 ? 4 : 6} fill={col} style={{ transition: "all .3s ease" }}>
                  {v === 1 && <animate attributeName="r" values="6;8;6" dur="1.2s" repeatCount="indefinite" />}
                </circle>
              </g>
            );
          })}
          {/* center */}
          <circle cx={CX} cy={CY} r="34" fill={reached ? "rgba(16,185,129,.15)" : "rgba(255,255,255,.03)"} stroke={reached ? "#34d399" : "rgba(16,185,129,.3)"} strokeWidth="1.5" style={{ transition: "all .4s" }} />
          <text x={CX} y={CY - 4} textAnchor="middle" className="fill-emerald-200" style={{ fontSize: 20, fontWeight: 800 }}>{agree}/{N}</text>
          <text x={CX} y={CY + 12} textAnchor="middle" className="fill-emerald-300/60" style={{ fontSize: 8, letterSpacing: 1 }}>QUORUM {QUORUM}</text>
        </svg>
        <div className="w-full space-y-2 text-sm">
          <Row label="Agree" val={agree} tot={N} color="#34d399" />
          <Row label="Honest dissent (tolerated)" val={dissent} tot={N} color="#f59e0b" />
          <div className="mt-1 border-t border-emerald-500/15 pt-2">
            <div className="flex items-center justify-between text-[13px]"><span className="text-emerald-100/70">Care-floor</span><span className="font-mono font-bold text-emerald-300">0.95 ✓</span></div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400" style={{ width: "95%" }} /></div>
          </div>
          {phase === "done" && (
            <div className={"mt-2 rounded-lg border px-3 py-2 text-[12px] " + (reached ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100" : "border-amber-400/30 bg-amber-500/10 text-amber-100")}>
              {reached ? "▲ Supermajority reached in this design simulation — in the target architecture the verdict seals to Layer 0." : "No quorum in this round — the council design withholds a verdict rather than forcing one."}
              {verdict && reached && <div className="mt-1 font-semibold text-emerald-200">{verdict}</div>}
            </div>
          )}
        </div>
      </div>
      <p className="mt-2 text-[10px] text-emerald-300/40">Design simulation of the 33-seat architecture: no single agent decides — a supermajority does, so the council can't be captured. Honest dissent is tolerated by design (Charter Art. 11). Measured cross-checking today: n_eff 1.21 of 3 — see the <a href="/refutation-ledger" className="underline">Refutation Ledger</a>.</p>
    </div>
  );
}

function Row({ label, val, tot, color }: { label: string; val: number; tot: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[13px]"><span className="text-emerald-100/70">{label}</span><span className="font-mono text-emerald-200">{val}</span></div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: (val / tot) * 100 + "%", background: color, transition: "width .3s ease" }} /></div>
    </div>
  );
}
