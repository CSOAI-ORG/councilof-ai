import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Layer-0 Compliance Intelligence OS — CSOAI Blueprint",
  description:
    "CSOAI's Layer-0 Compliance Intelligence OS connects the obligation landscape to the entity landscape via deadlines. Regulation graph, daily ingest, entity registry, risk engine and action layer.",
  alternates: { canonical: "/resources/layer-0-compliance-intelligence-os" },
};

const layers = [
  {
    name: "Regulation Graph",
    text: "Jurisdiction → instrument → obligation → deadline → applicability. Seeded by 177-country framework data and structured for machine-readable traversal.",
  },
  {
    name: "Daily Ingest",
    text: "EUR-Lex, national gazettes, regulator sites, enforcement actions, standards updates and guidance are crawled, extracted and emitted as structured deltas.",
  },
  {
    name: "Entity Registry",
    text: "Public signals on companies with AI/robotics exposure are matched to the obligations that attach to them, geo-located for the map cockpit.",
  },
  {
    name: "Risk Engine",
    text: "Scores each entity × obligation on scope, deadline proximity and readiness signals. Outputs defensible risk indicators, never verdicts.",
  },
  {
    name: "Action Layer",
    text: "Outreach to at-risk entities and aggregate/sectoral intelligence for regulators — all backed by Layer-0-addressable attestations.",
  },
];

const objects = [
  { name: "Regulation / obligation", id: "canonical id, citation, attestable provenance" },
  { name: "Company / entity", id: "jurisdiction, systems, applicable obligations" },
  { name: "Tool (MCP)", id: "callable per obligation, returns Ed25519-signed attestation" },
  { name: "Deadline", id: "event on the global clock that fans out to in-scope entities" },
];

export default function Layer0BlueprintPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "Layer-0 Compliance Intelligence OS",
    description:
      "CSOAI's blueprint for a continuously-crawled global governance dataset that connects obligations to entities via deadlines.",
    url: "https://csoai.org/resources/layer-0-compliance-intelligence-os",
    author: { "@type": "Organization", name: "CSOAI" },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent opacity-60 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 text-center">
          <span className="inline-block rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-6">
            Blueprint
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter mb-6">
            Layer-0 Compliance Intelligence OS
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Not “what are the AI rules?” — but{" "}
            <span className="text-white font-semibold">
              who must comply with what, by when, and are they on track?
            </span>
          </p>
        </div>
      </section>

      <section className="py-20 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tighter mb-6">Layer 0 connects all</h2>
          <p className="text-lg text-slate-400 leading-relaxed mb-10">
            CSOAI&apos;s trust/protocol substrate — Ed25519 attestations, agent.json, .well-known/mcp.json,
            and the MCP fleet — is the bus. Every object in the OS is a Layer-0-addressable,
            attestable node.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {objects.map((o) => (
              <div
                key={o.name}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-5 hover:border-emerald-500/30 transition"
              >
                <h3 className="font-bold text-emerald-400 mb-1">{o.name}</h3>
                <p className="text-sm text-slate-400">{o.id}</p>
              </div>
            ))}
          </div>
          <p className="text-slate-400 mt-8">
            So the EU AI Act Article 50 deadline connects to every in-scope company, the MCP tool
            that proves compliance, and the signed attestation — one graph, addressable through
            Layer 0.
          </p>
        </div>
      </section>

      <section className="py-20 border-b border-white/5 bg-slate-900/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tighter mb-10">The five layers</h2>
          <div className="space-y-4">
            {layers.map((l, idx) => (
              <div
                key={l.name}
                className="flex gap-5 rounded-xl border border-white/10 bg-white/[0.03] p-6 hover:border-emerald-500/30 transition"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">{l.name}</h3>
                  <p className="text-slate-400 leading-relaxed">{l.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tighter mb-6">
            The immersive cockpit
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed mb-8">
            OpenGridWorks renders the OS as “AI Governance Earth.” Zoom progressively reveals the
            obligation and entity landscape:
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { level: "World", detail: "Regulation-density heat map" },
              { level: "Country", detail: "Obligations + live deadline clocks + applicable standards" },
              { level: "Region / admin-1", detail: "State/provincial rules (Colorado, California, Quebec…)" },
              { level: "City / cluster", detail: "Company markers, systems, obligations, readiness signal" },
            ].map((z) => (
              <div
                key={z.level}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
              >
                <h3 className="font-bold mb-1">{z.level}</h3>
                <p className="text-sm text-slate-400">{z.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 border-b border-white/5 bg-slate-900/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tighter mb-6">
            Legal guardrails
          </h2>
          <ul className="space-y-3 text-slate-300 text-lg">
            <li className="flex gap-3">
              <span className="text-emerald-400">→</span>
              <span>“Risk signal,” not “verdict.” No named company is branded non-compliant without evidence.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-emerald-400">→</span>
              <span>GDPR and lawful basis are respected for entity and personal data.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-emerald-400">→</span>
              <span>Crawling respects robots.txt and terms of service.</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-12">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tighter mb-6">
              See the map cockpit
            </h2>
            <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
              OpenGridWorks is the live interface to the Layer-0 Compliance Intelligence OS.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://app.csoai.org/opengridworks"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition"
              >
                Open Atlas →
              </a>
              <Link
                href="/framework-crosswalk"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 font-bold transition"
              >
                Explore crosswalks
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
