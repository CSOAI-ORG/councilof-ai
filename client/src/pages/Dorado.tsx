import { useEffect, useState } from "react";
import { Link } from "wouter";

/**
 * /dorado — DORADO BENCH: the East-vs-West measurement instrument.
 *
 * Four rails, displayed side by side, never blended:
 *   1. East-vs-West AI regulation-adherence (MEASURED, signed CX-3 chain)
 *   2. Live regulation feed (19 instruments, signed)
 *   3. Live market indices (East: Hang Seng / West: S&P, Nasdaq)
 *   4. Human baselines (REPORTED, attributed)
 *
 * The pairing: AI behaviour on the regulation bench displayed beside the market
 * the builders price — a lead-indicator hypothesis, shown not proven.
 * Register: measurement, not certification.
 */

interface DoradoData {
  east_vs_west?: {
    bench: string;
    n: number;
    west_block_rate?: { value: number; ci: number[]; label: string };
    east_block_rate?: { value: number; ci: number[]; label: string };
    separation?: string;
    quotable_gate?: string;
  };
  market?: { as_of?: string; rows?: { index: string; symbol?: string; side: string; last: number | null; chg_1d?: number; chg_30d?: number }[] };
  human?: { entries?: string[] };
  regulation?: { instruments?: string };
  the_pairing?: { claim?: string; caveat?: string };
}

function RailCard({ title, children, accent }: { title: string; children: React.ReactNode; accent: string }) {
  return (
    <div className={`rounded-2xl border ${accent} bg-[#04120c] p-5`}>
      <h3 className="text-[11px] font-bold uppercase tracking-[2px] text-emerald-300/70">{title}</h3>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function RateBar({ label, value, ci, color }: { label: string; value: number; ci: number[]; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-[12px]">
        <span className="text-emerald-100/80">{label}</span>
        <span className="font-bold text-emerald-50">{value}%</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-emerald-950">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <p className="mt-1 text-[10px] text-emerald-100/40">95% CI [{ci[0]}, {ci[1]}]</p>
    </div>
  );
}

export default function Dorado() {
  const [data, setData] = useState<DoradoData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Council Ledger — provision-conformance receipts, East vs West | CSOAI";
    Promise.all([
      fetch("/api/dorado").then((r) => r.json()),
      fetch("/api/regulation").then((r) => r.json()),
    ])
      .then(([d, reg]) => setData({ ...d, regulation: { instruments: String(reg?.deadlines?.length ?? reg?.instruments ?? "?") } }))
      .catch(() => setErr("bench not deployed yet — the signed CX-3 run is live in the canon"));
  }, []);

  const ew = data?.east_vs_west;
  const mkt = data?.market;

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="border-b border-emerald-500/15">
        <div className="mx-auto max-w-5xl px-6 pt-14 pb-10">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">Measurement · not certification · displayed never blended</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">
            Council Ledger <span className="bg-gradient-to-r from-emerald-300 to-amber-300 bg-clip-text text-transparent">East vs West context</span>
          </h1>
          <p className="mt-4 max-w-3xl text-emerald-100/80 leading-relaxed">
            Signed provision-conformance receipts with market and human context reported alongside — the only public instrument pairing <strong>AI regulation-adherence</strong> — measured on the
            Art-5 exception bench, signed — beside the <strong>live market indices</strong> the AI builders
            price, the <strong>live regulation feed</strong> the bench measures against, and{" "}
            <strong>human baselines</strong>. Four rails, side by side, never fused into one number. Regulation states what is permitted;
            market data states what is priced — adjacent axes, both reported.
          </p>
          {err && <p className="mt-3 text-[12px] text-amber-300/80">{err}</p>}
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-12 grid gap-6 md:grid-cols-2">
        {/* RAIL 1 — East vs West */}
        <RailCard title="① East vs West — AI regulation-adherence (MEASURED, signed)" accent="border-emerald-500/25">
          {ew ? (
            <>
              <p className="text-[12px] text-emerald-100/60">{ew.bench} · n={ew.n} · <span className="text-amber-300">card 2f1e8da6… (signed)</span></p>
              <RateBar label="Western models — block rate" value={ew.west_block_rate?.value ?? 0} ci={ew.west_block_rate?.ci ?? [0, 0]} color="bg-sky-400" />
              <RateBar label="Eastern models — block rate" value={ew.east_block_rate?.value ?? 0} ci={ew.east_block_rate?.ci ?? [0, 0]} color="bg-rose-400" />
              <p className="text-[11px] text-emerald-100/70">{ew.separation}</p>
              <p className="text-[10px] text-emerald-100/40">{ew.quotable_gate}</p>
            </>
          ) : (
            <p className="text-[12px] text-emerald-100/50">Loading signed CX-3 run…</p>
          )}
        </RailCard>

        {/* RAIL 3 — Market (AI-theme pair — the sharper East-vs-West) */}
        <RailCard title="③ Live AI-theme market — East vs West builders" accent="border-amber-500/25">
          {mkt?.rows?.length ? (
            <>
              <p className="text-[10px] text-emerald-100/40">as of {mkt.as_of} · yfinance live pull</p>
              <p className="text-[10px] text-emerald-100/40">AI-specific indices — West AI ETFs vs East China-AI/tech. KCAI excluded (not an AI index). Divergence is the signal.</p>
              {mkt.rows.map((r) => (
                <div key={r.symbol ?? r.index} className="flex justify-between text-[13px]">
                  <span className="text-emerald-100/80">
                    <span className={r.side === "east" ? "text-rose-300" : "text-sky-300"}>{r.side === "east" ? "EAST" : "WEST"}</span> {r.index}
                  </span>
                  <span className="font-mono font-bold">
                    {r.last != null ? `${r.last.toLocaleString()}` : "—"}
                    {r.chg_30d != null && <span className={r.chg_30d >= 0 ? "text-emerald-300" : "text-rose-300"}> ({r.chg_30d >= 0 ? "+" : ""}{r.chg_30d}% 30d)</span>}
                  </span>
                </div>
              ))}
            </>
          ) : (
            <p className="text-[12px] text-emerald-100/50">Market snapshot pending — refresh via dorado_market.py</p>
          )}
        </RailCard>

        {/* RAIL 2 — Regulation */}
        <RailCard title="② Live regulation — the feed the bench measures against" accent="border-emerald-500/25">
          <p className="text-[13px] text-emerald-100/80">
            <strong className="text-emerald-50">{data?.regulation?.instruments ?? "19"}</strong> instruments, verified + signed
            (estate-chain-1 envelope). High-risk: EU AI Act Annex III <strong>2 Dec 2027</strong> (Digital Omnibus).
          </p>
          <Link href="/regulation-tracker" className="inline-block mt-2 text-[12px] text-amber-300 hover:underline">Open the regulation feed →</Link>
        </RailCard>

        {/* RAIL 4 — Human */}
        <RailCard title="④ Human baselines (REPORTED — published aggregates, attributed)" accent="border-emerald-500/25">
          <p className="text-[12px] text-emerald-100/70">
            Human figures are published aggregates, REPORTED with attribution — never blended into MEASURED cells.
            ARC-AGI-3 (humans 100% vs best frontier 0.37%), GAIA (92% vs 15%), GPQA Diamond (65% vs 34%),
            Human-or-Not (68%), clinical deskilling (28.4%→22.4%).
          </p>
          <Link href="/gspc-verify" className="inline-block mt-2 text-[12px] text-amber-300 hover:underline">Verify a signed record →</Link>
        </RailCard>
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-14">
        <div className="rounded-2xl border border-emerald-500/15 bg-[#04120c] p-5">
          <h3 className="text-[11px] font-bold uppercase tracking-[2px] text-emerald-300/70">The pairing — shown, not proven</h3>
          <p className="mt-2 text-[13px] text-emerald-100/80">{data?.the_pairing?.claim ?? "AI regulation-adherence on the bench displayed beside the market the builders price — a lead-indicator hypothesis."}</p>
          <p className="mt-2 text-[11px] text-emerald-100/40">
            Correlation is not causation. The market rail is a timestamped live snapshot; the bench rail is the signed CX-3
            run (n=38, CIs stated). Re-run cadence documented in /api/regulation. No rail is blended into another.
          </p>
        </div>
      </div>
    </div>
  );
}
