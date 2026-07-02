import { useEffect } from "react";

// /why — the USP page. What CSOAI does that Vanta/Credo/OneTrust don't, and the
// model that black-swans AI governance: open-source core + free training and
// certification + fair PAYG/subscription — putting safety and value back into
// SMBs and enterprises, not into middlemen who sell expensive certificates.

const MATRIX: { cap: string; csoai: string; others: string }[] = [
  { cap: "Core software", csoai: "Open-source, self-hostable, no lock-in", others: "Closed SaaS, per-seat lock-in" },
  { cap: "Training & certification", csoai: "Free to learn + verifiable credential", others: "$$$ courses + paid certificates" },
  { cap: "How verdicts are reached", csoai: "33-agent Byzantine-fault-tolerant council", others: "Single checklist / one model" },
  { cap: "Proof", csoai: "Ed25519-signed to Layer 0 — offline-verifiable", others: "PDF reports, trust-us attestations" },
  { cap: "Coverage", csoai: "AI + cyber + data, one evidence set, crosswalked", others: "Siloed per framework, re-work each time" },
  { cap: "Cyber testing", csoai: "God's Eye — you scan with open-source, Sovereign fixes", others: "Upsell to a separate pen-test vendor" },
  { cap: "Pricing", csoai: "Free open-source tier + fair PAYG + subscription", others: "Vanta ~$10k–50k+/yr · Credo AI ~$75k+/yr · OneTrust ~$30–80k/yr add-on" },
  { cap: "Who benefits", csoai: "SMBs, enterprises, governments, every person", others: "The governance vendor's shareholders" },
];

const USPS: { t: string; d: string }[] = [
  { t: "Open-source core", d: "The engine is open. Fork it, self-host it, audit it. Governance you can't trust to read the source isn't governance." },
  { t: "Free training + certification", d: "Learn the frameworks and earn a verifiable Sovereign credential for free. Competence shouldn't be paywalled." },
  { t: "The BFT Council", d: "Five to thirty-three specialised agents deliberate every verdict with Byzantine-fault-tolerant voting — a council beats one model." },
  { t: "Layer 0 signing", d: "Every decision sealed with Ed25519 and written to a tamper-evident ledger — provable, not promised." },
  { t: "God's Eye self-scan", d: "A stack of reputable open-source security tools so any CISO can test their own cyber — the Sovereign triages and fixes." },
  { t: "The Care Floor", d: "A hard 0.95 care threshold below which the system won't act — safety is a floor, not a marketing line." },
  { t: "Comply once, crosswalk everywhere", d: "One evidence set mapped across EU AI Act, NIST, ISO 42001, NIS2, DORA, CRA and more." },
  { t: "Fair economics", d: "Value flows to the people doing the work — SMBs and enterprises — not to a middleman selling expensive certificates." },
];

import TrustMarquee from "../components/TrustMarquee";
import SovereignSpot from "../components/SovereignSpot";

export default function WhyCsoai() {
  useEffect(() => { document.title = "Why CSOAI — what we do that others don't | AI governance, open"; }, []);
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="relative overflow-hidden border-b border-emerald-500/15">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(900px 420px at 50% -10%, rgba(16,185,129,.16), transparent 60%)" }} />
        <div className="relative mx-auto max-w-5xl px-6 pt-14 pb-9 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI OS · why we're different</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">We put the value back <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">where it belongs.</span></h1>
          <p className="mx-auto mt-4 max-w-2xl text-emerald-100/80">AI governance became a market for expensive certificates. We're black-swanning that — an open-source core, free training and certification, and fair pricing that returns safety and value to SMBs and enterprises, not to middlemen.</p>
        </div>
      </section>

      <section className="border-b border-emerald-500/15 py-8">
        <TrustMarquee variant="full" dark speed={70} />
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <SovereignSpot topic="why CSOAI beats Vanta, Credo AI and OneTrust" layer="frameworks" suggest="How does CSOAI's open-source + BFT-council model undercut the incumbents?" />
      </section>

      <section className="mx-auto max-w-5xl px-6 py-8">
        <div className="text-sm font-bold uppercase tracking-wide text-emerald-300/70">CSOAI vs the incumbents</div>
        <div className="mt-3 overflow-hidden rounded-2xl border border-emerald-500/20">
          <table className="w-full text-left text-sm">
            <thead className="bg-emerald-500/10 text-emerald-200"><tr><th className="px-4 py-3 font-bold">Capability</th><th className="px-4 py-3 font-bold text-emerald-300">CSOAI</th><th className="px-4 py-3 font-bold text-emerald-100/60">Vanta / Credo / OneTrust</th></tr></thead>
            <tbody>
              {MATRIX.map((m, i) => (
                <tr key={i} className={i % 2 ? "bg-white/[0.02]" : ""}>
                  <td className="px-4 py-3 font-semibold text-emerald-100/90">{m.cap}</td>
                  <td className="px-4 py-3 text-emerald-200"><span className="mr-1 text-emerald-400">✓</span>{m.csoai}</td>
                  <td className="px-4 py-3 text-emerald-100/55">{m.others}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 text-sm font-bold uppercase tracking-wide text-emerald-300/70">The USPs, in full</div>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {USPS.map((u) => (
            <div key={u.t} className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
              <div className="font-bold text-emerald-50">{u.t}</div>
              <p className="mt-1 text-[13px] text-emerald-100/75">{u.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/5 p-5"><div className="text-lg font-black text-emerald-200">Free</div><div className="text-xs text-emerald-100/70">Open-source core + free training & certification. Start with everything that matters at zero cost.</div></div>
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/5 p-5"><div className="text-lg font-black text-emerald-200">PAYG</div><div className="text-xs text-emerald-100/70">Pay only for what you run — a signed passport, an audit, a council verdict. Cents, not five figures.</div></div>
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/5 p-5"><div className="text-lg font-black text-emerald-200">Subscription</div><div className="text-xs text-emerald-100/70">Scale to a full program when you're ready — hosted, supported, still portable and yours to leave with.</div></div>
        </div>

        <div className="mt-8 rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/10 to-transparent p-6">
          <div className="text-sm font-bold uppercase tracking-wide text-emerald-300/70">The market reality (2026)</div>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div><div className="text-2xl font-black text-emerald-200">~$418M</div><div className="text-xs text-emerald-100/70">AI-governance software market in 2026, up from ~$308M in 2025 — Gartner calls it a billion-dollar market forming.</div></div>
            <div><div className="text-2xl font-black text-emerald-200">30+ tools</div><div className="text-xs text-emerald-100/70">crowding the space — most priced at five-figure annual minimums, out of reach for the SMBs that need governance most.</div></div>
            <div><div className="text-2xl font-black text-emerald-200">~20% CAGR</div><div className="text-xs text-emerald-100/70">growth as EU AI Act, NIS2, DORA and CRA bite — and the SME segment is the fastest-growing, underserved slice.</div></div>
          </div>
          <p className="mt-3 text-[13px] text-emerald-100/75">The incumbents built a market for expensive certificates. We built the open-source core, free training, and fair pricing to serve the businesses they price out. That's the black swan: safety as a public good, value back to the people doing the work.</p>
          <p className="mt-2 text-[11px] text-emerald-300/50">Figures compiled from public 2026 market analyses (Grand View, Precedence, Gartner) and vendor pricing summaries — indicative, verify for procurement.</p>
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-500/15 bg-white/[0.02] p-6 text-center">
          <div className="text-sm font-bold text-emerald-100">See it, don't take our word for it.</div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <a href="/regulators" className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#03110b] hover:bg-emerald-400">The Regulator Atlas →</a>
            <a href="/scan" className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20">God's Eye self-scan →</a>
            <a href="/try" className="rounded-xl border border-emerald-400/40 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">Meet the Council →</a>
            <a href="/plans" className="rounded-xl border border-emerald-400/40 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">See pricing →</a>
          </div>
        </div>
      </section>
    </div>
  );
}
