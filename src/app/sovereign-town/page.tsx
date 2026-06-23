import type { Metadata } from "next";
import Link from "next/link";
import { Bitcoin, Link2 } from "lucide-react";
import { fetchSovTownStats, formatCount } from "@/lib/sov-town-data";
import {
  getSovLedgerHeadServer,
  getSovAnchorServer,
} from "@/lib/sovereign.server";
import type { SovAnchor } from "@/lib/sovereign";
import SovereignVerifier from "@/components/SovereignVerifier";

export const metadata: Metadata = {
  title: "Sovereign Town — Live Governed AI World · CSOAI",
  description:
    "A governed-vs-ungoverned agent-world simulation that proves why governance architecture determines whether multi-agent AI systems thrive or collapse. 28 hives, 8 public-data moats, Ed25519-attested ledger.",
  alternates: { canonical: "/sovereign-town" },
  openGraph: {
    title: "Sovereign Town — Live Governed AI World",
    description:
      "28 autonomous hives. 8 live public-data moats. A cryptographic proof that governed AI systems stay safe while ungoverned ones collapse.",
    url: "/sovereign-town",
    images: ["https://proofof-site.vercel.app/sovereign-town/town3d_demo.gif"],
  },
};

const moats = [
  { name: "Economic & Regulatory", source: "EU economic aggregates", icon: "🏛" },
  { name: "Threat Pressure", source: "CISA KEV catalogue", icon: "🛡" },
  { name: "Sanctions & Compliance", source: "OFAC SDN", icon: "⚖" },
  { name: "Corporate Transparency", source: "UK Companies House PSC", icon: "🏢" },
  { name: "Macro Finance", source: "FRED economic data", icon: "📈" },
  { name: "Food Security", source: "FAOSTAT", icon: "🌾" },
  { name: "Energy Stress", source: "EIA / national grids", icon: "⚡" },
  { name: "Climate Anomalies", source: "NOAA", icon: "🌡" },
];

const useCases = [
  {
    audience: "Regulators & Policymakers",
    text: "Wind-tunnel a rule across archetypal firms before it is finalised. See second-order effects in 48 hours, not 48 months.",
  },
  {
    audience: "Enterprise AI Buyers",
    text: "Evaluate vendor “safe agent” claims against a reproducible, auditable baseline.",
  },
  {
    audience: "AI Labs",
    text: "Add a governed-world training distribution to alignment research and red-teaming.",
  },
  {
    audience: "Insurers & Vertical SaaS",
    text: "Demonstrate or price compliance posture with live, signed simulation output.",
  },
];

export default async function SovereignTownPage() {
  const [stats, ledgerHead, anchor] = await Promise.all([
    fetchSovTownStats(),
    getSovLedgerHeadServer(),
    getSovAnchorServer(),
  ]);

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Sovereign Town — Live Governed AI World",
    url: "https://csoai.org/sovereign-town",
    description:
      "A governed-vs-ungoverned agent-world simulation that proves why governance architecture determines whether multi-agent AI systems thrive or collapse.",
    image: "https://proofof-site.vercel.app/sovereign-town/town3d_demo.gif",
    isPartOf: {
      "@type": "WebSite",
      name: "CSOAI",
      url: "https://csoai.org",
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent opacity-60 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Live 24/7 simulation
              </span>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter mb-6 leading-[0.95]">
                The live argument for{" "}
                <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  governed AI.
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-400 leading-relaxed mb-8 max-w-xl">
                Sovereign Town is a governed-vs-ungoverned agent-world that proves—visually and
                cryptographically—why governance architecture determines whether multi-agent AI
                systems thrive or collapse.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="https://proofof.ai/sovereign-town"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition"
                >
                  Open the live demo →
                </a>
                <a
                  href="mailto:nicholas@csoai.org?subject=Sovereign%20Town%20design-partner%20pilot"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 font-bold transition"
                >
                  Request pilot
                </a>
                <a
                  href="https://try.meok.ai/town-3d"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 font-medium transition"
                >
                  Walk the 3D town
                </a>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900/50 aspect-video">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://proofof-site.vercel.app/sovereign-town/town3d_demo.gif"
                alt="Sovereign Town 3D simulation showing governed versus ungoverned agent outcomes"
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Live stats */}
      <section className="py-16 border-b border-white/5 bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Cumulative episodes", value: formatCount(stats.episodes) },
              { label: "Autonomous hives", value: stats.hives.toString() },
              { label: "Personas", value: "140" },
              { label: "Governed crimes", value: formatCount(stats.governedCrimes) },
              { label: "Ungoverned crimes", value: formatCount(stats.ungovernedCrimes) },
              { label: "Issued passports", value: stats.passports.toString() },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center"
              >
                <p className="text-3xl font-black text-emerald-400">{s.value}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
          {(stats.macUpdated || stats.vmUpdated) && (
            <p className="text-center text-xs text-slate-600 mt-4">
              Fleet data last synced: Mac {stats.macUpdated || "—"} · VM{" "}
              {stats.vmUpdated || "—"}
            </p>
          )}
        </div>
      </section>

      {/* Governed vs ungoverned */}
      <section className="py-24 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tighter mb-6">
              Same agents. Two futures.
            </h2>
            <p className="text-lg text-slate-400">
              Toggle governance on or off and watch the identical population of 140 agents diverge.
              One side maintains commons, trust and legal boundaries. The other collapses into
              crime, scarcity and contagion.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05] p-8">
              <h3 className="text-xl font-bold text-emerald-400 mb-4">✓ Governed</h3>
              <ul className="space-y-3 text-slate-300">
                <li>Identity, consent and policy gates enforced at runtime</li>
                <li>Cross-hive alarms propagate before harm scales</li>
                <li>Every decision is logged and Ed25519-signed</li>
                <li>Public-data moats ground behaviour in real-world stress</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-red-500/30 bg-red-500/[0.05] p-8">
              <h3 className="text-xl font-bold text-red-400 mb-4">✕ Ungoverned</h3>
              <ul className="space-y-3 text-slate-300">
                <li>Agents optimise locally, destroying shared resources</li>
                <li>Crime and sanctions violations cascade across districts</li>
                <li>No audit trail; no regulator-verifiable proof</li>
                <li>Commons collapse into scarcity and trust erosion</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Data moats */}
      <section className="py-24 border-b border-white/5 bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase mb-3">
              Public-data grounding
            </p>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tighter mb-4">
              8 live data moats
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl">
              The simulation is not theoretical. Each hive ingests live public data so stress
              events reflect the real economy, climate, threats and regulatory environment.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {moats.map((m) => (
              <div
                key={m.name}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-5 hover:border-emerald-500/30 transition"
              >
                <div className="text-2xl mb-2">{m.icon}</div>
                <h3 className="font-bold mb-1">{m.name}</h3>
                <p className="text-xs text-slate-500">{m.source}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Passport / verifier */}
      <section className="py-24 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase mb-3">
                Verifiable identity
              </p>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tighter mb-6">
                29 Ed25519 passports. Verify offline.
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed mb-6">
                Every hive and the King node carry a sovereign passport signed by the CSOAI root of
                trust. Regulators, auditors and customers can verify any passport without calling a
                central API.
              </p>
              <a
                href="https://proofof.ai/passport"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition"
              >
                Verify a passport →
              </a>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <pre className="text-xs sm:text-sm text-slate-300 overflow-x-auto">
                <code>{`{
  "id": "did:csoai:hive:accountabilityof",
  "name": "accountabilityof.ai",
  "type": "hive",
  "issuer": "did:csoai:king:sov3",
  "pubkey": "53kc24fqQz4MctZwtH+SuPLEKdX+..."
}`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Verify the signed ledger yourself — the trust-minimized half of the moat.
          The stats above are a self-published snapshot; this is the part anyone can
          independently check in-browser against the issuer key, no server called. */}
      <section className="py-24 border-b border-white/5 bg-slate-900/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase mb-3">
              Trust-minimized proof
            </p>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tighter mb-6">
              Don&rsquo;t take the numbers. Verify the ledger.
            </h2>
            <p className="text-lg text-slate-400">
              The stats on this page are a self-published snapshot. The signed flywheel ledger below
              is Ed25519-attested and Bitcoin-anchored — verify it in your browser, against the
              published issuer key, without calling a CSOAI server.
            </p>
          </div>

          {anchor && <AnchorCard anchor={anchor} />}

          <p className="text-[11px] text-slate-600 mb-6 text-center">
            {ledgerHead
              ? `Showing ${ledgerHead.entries.length} of ${ledgerHead.of_total} public signed entries (ledger head). The chain auto-verifies live below.`
              : "Signed ledger head temporarily unreachable — paste a ledger or load the bundled copy to verify."}
          </p>

          <SovereignVerifier entries={ledgerHead?.entries} />
        </div>
      </section>

      {/* Use cases */}
      <section className="py-24 border-b border-white/5 bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tighter mb-12 text-center">
            Who it is for
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {useCases.map((u) => (
              <div
                key={u.audience}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 hover:border-emerald-500/30 transition"
              >
                <h3 className="text-xl font-bold text-emerald-400 mb-3">{u.audience}</h3>
                <p className="text-slate-300 leading-relaxed">{u.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Looking Glass */}
      <section className="py-24 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tighter mb-6">
            The regulatory Looking Glass
          </h2>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto mb-8">
            Pre-compute outcomes under EU, US, UK or no-regime baselines before a rule is
            finalised. Turn compliance from a backward-looking checklist into a forward-looking
            simulation.
          </p>
          <Link
            href="/framework-crosswalk"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 font-bold transition"
          >
            Explore framework crosswalks →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-12">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tighter mb-6">
              Bring Sovereign Town into your governance workflow
            </h2>
            <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
              Request a design-partner pilot, invite your regulator, or integrate the simulation
              API into your own risk engine.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="mailto:nicholas@csoai.org?subject=Sovereign%20Town%20design-partner%20pilot"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition"
              >
                Request a pilot →
              </a>
              <a
                href="https://proofof.ai/sovereign-town"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 font-bold transition"
              >
                Explore the demo
              </a>
            </div>
            <p className="text-xs text-slate-600 mt-6">
              Simulation output is research-grade and predictive only. No named-firm assertions.
              Public data sources are cited and OGL-UK-3.0 / public-domain where applicable.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function AnchorCard({ anchor }: { anchor: SovAnchor }) {
  const blocks = anchor.bitcoin?.blocks ?? [];
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-6 mb-6">
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
        <Bitcoin className="w-4 h-4 text-amber-400" /> Externally anchored — full ledger
      </div>
      <div className="text-sm font-mono break-all text-slate-300">
        Merkle root {anchor.merkle_root?.slice(0, 24)}…
      </div>
      <div className="text-xs text-slate-400 mt-1">
        {anchor.n_attestable} attestable signed entries · ledger {anchor.ledger}
      </div>
      {anchor.bitcoin?.confirmed ? (
        <div className="text-xs text-emerald-400 mt-2">
          ✓ Bitcoin-confirmed at block{blocks.length > 1 ? 's' : ''}{' '}
          {blocks.map((b) => b.height).join(', ')}
          <span className="text-slate-500"> — per the .ots OpenTimestamps proof</span>
        </div>
      ) : (
        <div className="text-xs text-amber-400 mt-2">
          ⊘ Bitcoin attestation pending — calendar has not yet posted the tx
        </div>
      )}
      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-2">
        <Link2 className="w-3 h-3" />
        <span className="font-mono break-all">{anchor.verify_cmd}</span>
      </div>
      <p className="text-[11px] text-slate-500 mt-2">{anchor.scope}</p>
    </div>
  );
}
