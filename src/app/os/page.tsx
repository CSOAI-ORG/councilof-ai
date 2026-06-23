import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CSOAI OS — Layer 0 for the Agentic Economy",
  description:
    "They are apps. CSOAI is the operating system. Absorb competitors, regulators, protocols, and vertical AI into one sovereign Layer 0 governance kernel.",
  openGraph: {
    title: "CSOAI OS — Layer 0 for the Agentic Economy",
    description: "Absorb competitors, regulators, protocols, and vertical AI into one sovereign governance kernel.",
    images: ["/api/og?title=CSOAI%20OS&desc=Absorb%20competitors%2C%20regulators%2C%20protocols%2C%20and%20vertical%20AI%20into%20one%20sovereign%20governance%20kernel."],
  },
  alternates: { canonical: "/os" },
};

const buses = [
  {
    name: "Identity bus",
    description: "Every agent, user, and system gets a W3C DID-compatible `did:csoai` identity with Ed25519 keys and revocable credentials.",
    nodes: ["Agents", "Users", "Systems", "IoT", "Humanoids"],
  },
  {
    name: "Attestation bus",
    description: "Every compliance event becomes a signed, public-verify receipt that regulators and customers can check without trusting CSOAI.",
    nodes: ["Watchdog Certs", "Risk scores", "Audit logs", "Framework mappings"],
  },
  {
    name: "Policy bus",
    description: "PDCA runtime enforces rules across every connected app at agent-call latency, under 0.1ms per check.",
    nodes: ["MCP", "A2A", "AP2", "x402", "Worm Hive"],
  },
  {
    name: "Payment bus",
    description: "x402, AP2, ACP, and Stripe ACP flows are pre-checked for compliance before settlement.",
    nodes: ["x402", "AP2", "ACP", "UCP", "MPP"],
  },
  {
    name: "Audit bus",
    description: "Immutable, regulator-checkable logs anchored with cryptographic timestamps and optional eIDAS QES.",
    nodes: ["Blockchain anchor", "RFC 3161", "eIDAS QES", "SIEM export"],
  },
  {
    name: "Council bus",
    description: "Multi-stakeholder BFT governance overrides and constitutional decisions with transparent voting.",
    nodes: ["Regulators", "Notified bodies", "Customers", "Experts", "Public"],
  },
  {
    name: "Simulation bus",
    description: "The 47-agent town generates behavioural governance data before laws are enforced, producing white papers, demos, and predictive compliance evidence.",
    nodes: ["Agent town", "Scenario engine", "White-paper pipeline", "Investor demos", "Regulator sandboxes"],
  },
];

const absorbed = [
  { name: "Vanta / Drata", role: "Evidence source" },
  { name: "OneTrust", role: "AI BOM catalog" },
  { name: "Holistic AI", role: "Model-test evidence" },
  { name: "IBM / Azure / AWS", role: "Compute substrate" },
  { name: "MCP registries", role: "Verified server marketplace" },
  { name: "x402 / AP2", role: "Payment rails" },
  { name: "Regulators", role: "Attestation acceptance network" },
  { name: "Notified bodies", role: "Conformity co-signers" },
];

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "CSOAI OS", item: "https://csoai.org/os" },
  ],
};

export default function OSPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Layer 0
          </div>
          <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">
            They are apps. <span className="text-emerald-400">CSOAI is the OS.</span>
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-slate-400">
            Absorb competitors, regulators, protocols, and vertical AI into one sovereign governance kernel — including
            a 47-agent simulation town that tests compliance before it becomes law.
          </p>
        </div>

        <div className="mb-20 grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
            <h2 className="mb-4 text-2xl font-bold">The Layer 0 kernel</h2>
            <p className="mb-6 text-slate-400">
              Identity, attestation, policy, audit, and council consensus form the substrate. Every other platform
              becomes a node on this bus.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {["did:csoai", "Watchdog Certs", "PDCA Runtime", "BFT Council", "x402 Pre-check", "13 Frameworks"].map((item) => (
                <div key={item} className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-center text-xs font-bold text-emerald-400">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
            <h2 className="mb-4 text-2xl font-bold">Absorbed into the OS</h2>
            <div className="space-y-3">
              {absorbed.map((a) => (
                <div key={a.name} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                  <span className="font-medium text-white">{a.name}</span>
                  <span className="text-xs text-slate-500">{a.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-20 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {buses.map((bus) => (
            <div key={bus.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-emerald-500/30">
              <h3 className="mb-2 text-lg font-bold text-emerald-400">{bus.name}</h3>
              <p className="mb-4 text-sm text-slate-400">{bus.description}</p>
              <div className="flex flex-wrap gap-2">
                {bus.nodes.map((n) => (
                  <span key={n} className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300">
                    {n}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-16 rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold">Why the simulation changes the game</h2>
          <p className="mx-auto mb-6 max-w-2xl text-slate-400">
            Regulators write rules; CSOAI tests them. The town turns abstract legal text into measurable agent
            behaviour, giving regulators and enterprises a shared sandbox before enforcement begins.
          </p>
          <div className="mx-auto grid max-w-4xl gap-4 text-left text-sm text-slate-300 sm:grid-cols-2">
            <div>• Simulate EU AI Act risk classification across 10,000 virtual companies</div>
            <div>• Run DORA resilience scenarios for 22,000 EU financial entities</div>
            <div>• Test cross-border handoffs before real agents cross jurisdictions</div>
            <div>• Export simulation results into signed Watchdog Certificates</div>
          </div>
        </div>

        <div className="mb-16 rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold">Why regulators and legislators want this</h2>
          <div className="mx-auto grid max-w-4xl gap-4 text-left text-sm text-slate-300 sm:grid-cols-2">
            <div>• Single cross-sector AI system inventory</div>
            <div>• Tamper-evident Ed25515 audit trails</div>
            <div>• Standardised cross-jurisdiction framework mapping</div>
            <div>• Public verify URLs reduce enforcement friction</div>
            <div>• Sovereign-by-default reduces extraterritorial risk</div>
            <div>• Open-source substrate increases transparency</div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/switch" className="rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-600">
            Switch from an incumbent →
          </Link>
          <Link href="/pricing" className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 font-bold text-white transition hover:border-emerald-500/40">
            See pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
