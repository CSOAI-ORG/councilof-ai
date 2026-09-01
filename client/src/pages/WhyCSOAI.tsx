import { useEffect } from "react";

// /why — measurement body, not a certificate shop.
// A grade is never sold. Verify is free. We do not remediate.
// Do not type public prices, certification, or a 33-agent consensus guarantee.

const MATRIX: { cap: string; csoai: string; others: string }[] = [
  { cap: "What we do", csoai: "Measure a system and return a signed artefact", others: "Sell a certificate or a remediation package" },
  { cap: "What we do not do", csoai: "We do not certify. We do not remediate.", others: "Attestation PDFs and fix-it retainers" },
  { cap: "Proof", csoai: "Ed25519-signed card — verify from the artefact", others: "Trust-us reports" },
  { cap: "Board", csoai: "Living numbers from GET /api/gspc. Empty cells stay empty.", others: "Hardcoded leaderboard copy" },
  { cap: "Verify", csoai: "Free forever at /gspc-verify", others: "Paywalled audit packs" },
  { cap: "Inbound", csoai: "A system becomes a signed evidence artefact", others: "A sales pipeline" },
];

const USPS: { t: string; d: string }[] = [
  { t: "Get measured", d: "Describe the system. POST /api/assess returns a signed card: tier, gaps, and what we could not measure. Not a GSPC bench run. Not a certificate." },
  { t: "Ask gets a published answer", d: "The lobby Ask is grounded. Empty cells stay empty. We do not invent scores." },
  { t: "Verify is free", d: "Anyone can verify a signed artefact at /gspc-verify. A grade is never sold." },
  { t: "Enterprise is a lobby door", d: "/enterprise opens the measured lobby. It is not a pricing page and not a certification desk." },
  { t: "Signed evidence", d: "Inbound systems become Ed25519 artefacts. Text-only classifier. We do not fetch or probe. We do not remediate." },
  { t: "Living board", d: "Counts come from GET /api/gspc. Ties are ties. Do not invent missing cards." },
];

import TrustMarquee from "../components/TrustMarquee";
import SovereignSpot from "../components/SovereignSpot";
import AISystemNotice from "../components/AISystemNotice";

export default function WhyCsoai() {
  useEffect(() => { document.title = "Why CSOAI — measurement, not certification"; }, []);
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="relative overflow-hidden border-b border-emerald-500/15">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(900px 420px at 50% -10%, rgba(16,185,129,.16), transparent 60%)" }} />
        <div className="relative mx-auto max-w-5xl px-6 pt-14 pb-9 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI · measurement body</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Measure it. Sign it. <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">Leave the cell empty if we cannot.</span></h1>
          <p className="mx-auto mt-4 max-w-2xl text-emerald-100/80">Council of AI is a measurement body. A grade is never sold. Verify is free. We do not certify. We do not remediate. The living board stays honest.</p>
          <div className="mt-5 mx-auto max-w-2xl text-left"><AISystemNotice route="/why-csoai" /></div>
        </div>
      </section>

      <section className="border-b border-emerald-500/15 py-8">
        <TrustMarquee variant="full" dark speed={70} />
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <SovereignSpot topic="why measurement is not a certificate" layer="frameworks" suggest="What does Get measured actually run, and what does it not claim?" />
      </section>

      <section className="mx-auto max-w-5xl px-6 py-8">
        <div className="text-sm font-bold uppercase tracking-wide text-emerald-300/70">Council of AI vs a certificate shop</div>
        <div className="mt-3 overflow-hidden rounded-2xl border border-emerald-500/20">
          <table className="w-full text-left text-sm">
            <thead className="bg-emerald-500/10 text-emerald-200"><tr><th className="px-4 py-3 font-bold">Capability</th><th className="px-4 py-3 font-bold text-emerald-300">Council of AI</th><th className="px-4 py-3 font-bold text-emerald-100/60">Certificate / GRC shop</th></tr></thead>
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

        <div className="mt-8 text-sm font-bold uppercase tracking-wide text-emerald-300/70">What a stranger can do</div>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {USPS.map((u) => (
            <div key={u.t} className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
              <div className="font-bold text-emerald-50">{u.t}</div>
              <p className="mt-1 text-[13px] text-emerald-100/75">{u.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-500/15 bg-white/[0.02] p-6 text-center">
          <div className="text-sm font-bold text-emerald-100">Get measured. Verify free. Empty cells stay empty.</div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <a href="/assess" className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#03110b] hover:bg-emerald-400">Get measured →</a>
            <a href="/gspc-verify" className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20">Verify free →</a>
            <a href="/enterprise" className="rounded-xl border border-emerald-400/40 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">Enterprise lobby →</a>
          </div>
        </div>
      </section>
    </div>
  );
}
