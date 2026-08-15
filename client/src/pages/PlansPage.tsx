import { useEffect } from "react";

// Pricing — ONE page, TWO rails (audit §3.3).
// Agents pay per call on the x402 rail; humans pay per month on the Council rail.
// Both rails end in the same 3KB Ed25519-signed, timestamp-anchored measurement card.
// Brand-gate: CSOAI is a MEASUREMENT body — never a certification body.

type AgentRow = { name: string; price: string; unit: string; desc: string; highlight?: boolean };

const AGENT_ROWS: AgentRow[] = [
  { name: "Free daily", price: "$0", unit: "", desc: "100 free calls/day per key, standard cards on all published instruments." },
  { name: "Per-call", price: "$0.005", unit: "/card", desc: "Standard measurement card, signed + timestamp-anchored; x402 (USDC on Base) or card; metered, balance never expires.", highlight: true },
  { name: "Deep bundle — Governance", price: "$0.10", unit: "/call", desc: "Full instrument battery, per-item evidence, signed card." },
  { name: "Deep bundle — Safety + Provenance", price: "$0.18", unit: "/call", desc: "Calibrated-refusal battery + manifest-survival matrix, one signed card." },
  { name: "Deep bundle — Full spectrum", price: "$0.25", unit: "/call", desc: "All axes, all frozen items, full evidence transcript." },
];

type Plan = { name: string; price: string; sub: string; cta: string; href: string; tag?: string; highlight?: boolean };

const PLANS: Plan[] = [
  { name: "Free", price: "£0", sub: "get started", cta: "Start free", href: "/start" },
  { name: "Pro", price: "£59", sub: "per month", cta: "14-day trial", href: "/start", tag: "Most popular", highlight: true },
  { name: "Business", price: "£199", sub: "per month", cta: "14-day trial", href: "/start" },
  { name: "Enterprise", price: "from £1,500", sub: "per month", cta: "Talk to us", href: "/contact" },
];

// Council-rail comparison rows: [label, Free, Pro, Business, Enterprise]
const MATRIX: [string, string, string, string, string][] = [
  ["Cards / month", "3", "50", "300", "Custom"],
  ["Re-attestation", "—", "Quarterly", "Monthly", "Continuous"],
  ["Credential wallet + alerts", "✓", "✓", "✓", "✓"],
  ["All published instruments (4 control-sets)", "✓", "✓", "✓", "✓ + custom"],
  ["Evidence export", "—", "JSON · CSV", "JSON · CSV", "+ Parquet"],
  ["Seats", "1", "3", "25", "Unlimited"],
  ["x402 credits included", "—", "£10/mo", "£50/mo", "Custom"],
  ["SSO / SAML, audit log", "—", "—", "✓", "✓"],
];

export default function PlansPage() {
  useEffect(() => { document.title = "Pricing — two rails, one signed card | Council of AI"; }, []);
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-emerald-500/15 mx-auto max-w-6xl px-6 pt-16 pb-10 text-center">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(800px 380px at 50% -10%, rgba(16,185,129,.20), transparent 60%)" }} />
        <p className="relative font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">Council of AI — pricing</p>
        <h1 className="relative mt-3 text-4xl sm:text-6xl font-black tracking-tight">
          Two rails. <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">One signed card.</span>
        </h1>
        <p className="relative mt-4 mx-auto max-w-3xl text-emerald-100/80">
          Agents pay per call on the x402 rail. Humans pay per month on the Council rail. Different rails,
          same destination: every call and every plan ends in a 3KB measurement card — Ed25519-signed,
          timestamp-anchored, verifiable by anyone.
        </p>
      </section>

      {/* RAIL 1 — AGENT (x402) */}
      <section className="mx-auto max-w-6xl px-6 pt-14 pb-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/70">Rail 1</p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-black">Agent — the x402 rail</h2>
            <p className="mt-1 text-sm text-emerald-100/70">Pay per call. USDC on Base or card. Metered, no subscription.</p>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {AGENT_ROWS.map((r) => (
            <div key={r.name} className={"flex flex-col gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between " + (r.highlight ? "border-emerald-400/50 bg-emerald-500/[0.06]" : "border-emerald-500/20 bg-[#05140d]")}>
              <div className="sm:max-w-2xl">
                <div className="text-base font-bold text-emerald-100">{r.name}</div>
                <p className="mt-1 text-sm text-emerald-100/75">{r.desc}</p>
              </div>
              <div className="flex items-baseline gap-1 sm:justify-end">
                <span className="text-3xl font-black text-emerald-100">{r.price}</span>
                {r.unit && <span className="text-sm text-emerald-300/75">{r.unit}</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href="/start" className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#03110b] hover:bg-emerald-400">Get a free key →</a>
          <a href="/payg" className="rounded-xl border border-emerald-400/40 px-5 py-2.5 text-sm font-bold text-emerald-100 hover:bg-white/5">Top up the x402 rail →</a>
        </div>
        <p className="mt-4 rounded-xl border border-emerald-500/15 bg-black/20 px-4 py-3 text-sm text-emerald-100/70">
          Every agent-rail response IS the signed card — your auditor verifies independently of us.
        </p>
      </section>

      {/* RAIL 2 — HUMAN (Council) */}
      <section className="mx-auto max-w-6xl px-6 pt-6 pb-14">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/70">Rail 2</p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-black">Human — the Council rail</h2>
          <p className="mt-1 text-sm text-emerald-100/70">Pay per month. Billed in GBP. You own your data.</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => (
            <div key={p.name} className={"flex flex-col rounded-2xl border p-5 " + (p.highlight ? "border-emerald-400/60 bg-emerald-500/5 shadow-[0_0_40px_-12px_rgba(16,185,129,.5)]" : "border-emerald-500/20 bg-[#05140d]")}>
              {p.tag && <span className="self-start rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300">{p.tag}</span>}
              <div className="mt-2 text-lg font-bold">{p.name}</div>
              <div className="mt-1 text-3xl font-black text-emerald-100">{p.price}</div>
              <div className="text-xs text-emerald-300/75">{p.sub}</div>
              <a href={p.href} className={"mt-5 rounded-xl px-4 py-2 text-center text-sm font-bold " + (p.highlight ? "bg-emerald-500 text-[#03110b] hover:bg-emerald-400" : "border border-emerald-400/40 text-emerald-100 hover:bg-white/5")}>{p.cta}</a>
            </div>
          ))}
        </div>

        {/* Comparison matrix */}
        <div className="mt-8 overflow-x-auto rounded-2xl border border-emerald-500/15 bg-black/20">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-emerald-500/20 text-left">
                <th className="px-4 py-3 font-semibold text-emerald-200/80"></th>
                <th className="px-4 py-3 text-center font-bold text-emerald-100">Free</th>
                <th className="px-4 py-3 text-center font-bold text-emerald-100">Pro</th>
                <th className="px-4 py-3 text-center font-bold text-emerald-100">Business</th>
                <th className="px-4 py-3 text-center font-bold text-emerald-100">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((row) => (
                <tr key={row[0]} className="border-b border-emerald-500/10">
                  <td className="px-4 py-3 text-emerald-100/80">{row[0]}</td>
                  <td className="px-4 py-3 text-center text-emerald-100/90">{row[1]}</td>
                  <td className="px-4 py-3 text-center text-emerald-100/90">{row[2]}</td>
                  <td className="px-4 py-3 text-center text-emerald-100/90">{row[3]}</td>
                  <td className="px-4 py-3 text-center text-emerald-100/90">{row[4]}</td>
                </tr>
              ))}
              <tr>
                <td className="px-4 py-4"></td>
                <td className="px-4 py-4 text-center"><a href="/start" className="rounded-lg border border-emerald-400/40 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-white/5">Start free</a></td>
                <td className="px-4 py-4 text-center"><a href="/start" className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-[#03110b] hover:bg-emerald-400">14-day trial</a></td>
                <td className="px-4 py-4 text-center"><a href="/start" className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-[#03110b] hover:bg-emerald-400">14-day trial</a></td>
                <td className="px-4 py-4 text-center"><a href="/contact" className="rounded-lg border border-emerald-400/40 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-white/5">Talk to us</a></td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-center text-xs text-emerald-300/75">
          Not a certification body (cards are verified measurement credentials, not certificates), not an
          observability platform. Billed in GBP. You own your data.
        </p>
      </section>
    </div>
  );
}
