import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CSOAI IS LAYER 0 — The Sovereign Foundation for AI Agents",
  description:
    "Before any AI agent can pay, hire, or act, it needs to prove it's compliant. Discover CSOAI Layer 0: the missing foundation for the agentic economy.",
  openGraph: {
    title: "CSOAI IS LAYER 0",
    description: "The missing identity and compliance foundation for the agentic economy.",
    images: ["/api/og?title=CSOAI%20IS%20LAYER%200&desc=Sovereign%20foundation%20for%20AI%20agents"],
  },
  alternates: { canonical: "/layer0" },
};

const protocols = [
  { name: "MCP", layer: "L1 Tool Integration", status: "97M SDK/mo", what: "Agents call tools" },
  { name: "Slim.tools", layer: "L1.5 Tool Orchestration", status: "Production", what: "Dynamic discovery & sandboxing" },
  { name: "A2A", layer: "L2 Agent Coordination", status: "Production v1.0", what: "Agents discover/delegate" },
  { name: "x402", layer: "L3 Settlement", status: "140M+ transactions", what: "HTTP-native micropayments" },
  { name: "ACP", layer: "L4 Merchant Checkout", status: "Live in ChatGPT", what: "Agent-to-merchant purchasing" },
  { name: "Microsoft AGT", layer: "L1-L2 Governance", status: "Open source", what: "Runtime policy, trust mesh" },
];

const layers = [
  { badge: "L0-A: IDENTITY", title: "did:csoai", text: "W3C DID v1.1 compliant. IETF AIP token format. Ed25519 signed identities integrating deeply with OAuth, OIDC, and SPIFFE workloads." },
  { badge: "L0-B: CERTIFICATION", title: "Watchdog Certificates", text: "CertAI trust scoring across 10 dimensions. BFT Council consensus. 30-framework compliance mapping verifying identity instantly." },
  { badge: "L0-C: POLICY ENGINE", title: "PDCA Runtime", text: "Sub-millisecond latency. Microsoft AGT and OPA/Rego adapters mapping OWASP Agentic Top 10, EU AI Act, and TC260 standards in real-time." },
  { badge: "L0-D: CROSS-REGIONAL", title: "A2A Handoff", text: "Jurisdiction-aware data handoff (EU/US/UK/CN/SG/KR). Strictest-framework-wins logic integrated with Google A2A compliance badges." },
  { badge: "L0-E: PAYMENT PRE-CHECK", title: "Agentic Treasury", text: "Compliance pre-check BEFORE x402, Stripe ACP, or Google AP2 execution. Prevent funds from moving if Watchdog Certificates are invalid." },
  { badge: "L0-F: AUDIT LAYER", title: "Immutable Ledger", text: "IPFS storage anchored to Polygon PoA. Ed25519 and ML-DSA-65 quantum-safe signatures ensuring an unbroken chain of custody." },
  { badge: "L0-G: HUMAN-IN-THE-LOOP", title: "BFT Escalation", text: "IETF AIP approval envelopes and PBFT consensus triggers for critical violations, large financial boundaries, and strict cross-border transfers." },
  { badge: "L0-H: LEGACY BRIDGE", title: "COBOL Parser", text: "Bridging 43% of the world's banking infrastructure into the agentic economy securely. Mainframe-to-Agent architecture via cobolbridge.ai." },
];

const schema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "CSOAI IS LAYER 0",
  description: "The sovereign identity and compliance foundation for the agentic economy.",
  url: "https://csoai.org/layer0",
};

export default function Layer0Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div className="min-h-screen bg-slate-950 text-white">
        <section className="relative mx-auto max-w-5xl px-4 pb-16 pt-32 text-center">
          <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(201,168,76,0.15)_0%,transparent_70%)]" />
          <h1 className="relative mb-6 text-4xl font-black tracking-tighter sm:text-6xl lg:text-7xl">
            <span className="gradient-text">CSOAI IS LAYER 0</span>
          </h1>
          <p className="relative mx-auto mb-10 max-w-3xl text-xl leading-relaxed text-slate-400">
            Google built A2A for agent coordination. Stripe built ACP for checkout. Coinbase built
            x402 for micropayments. But before any agent can pay, hire, or act — it needs to prove
            it&apos;s compliant. <strong className="text-white">That&apos;s Layer 0.</strong>
          </p>
          <div className="relative flex flex-wrap justify-center gap-4">
            <Link
              href="/mcp-distribution"
              className="inline-flex rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              VIEW FLEET REGISTRY
            </Link>
            <a
              href="https://github.com/CSOAI-ORG"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-lg border border-emerald-500 px-6 py-3 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500 hover:text-slate-950"
            >
              GET ENTERPRISE SDK
            </a>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-16">
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-white/[0.05] to-emerald-500/[0.05] p-8 sm:p-12">
            <h2 className="mb-6 text-2xl font-bold text-emerald-400 sm:text-3xl">
              The Missing Foundation of the Agentic Economy
            </h2>
            <div className="space-y-4 text-slate-300">
              <p>
                The agentic economy is exploding in 2026. MCP has 97 million SDK downloads per month.
                x402 has processed 140 million transactions. Microsoft AGT has 9,500+ tests.
              </p>
              <p>
                <strong className="text-white">
                  But every single one of these protocols has a fatal flaw:
                </strong>{" "}
                they assume the agent is already trusted. They assume Layer 0 exists. It doesn&apos;t.
              </p>
              <p>
                CSOAI built Layer 0. We certify agents with Ed25519-signed Watchdog Certificates
                backed by BFT Council consensus. We enforce policies in real-time across 30
                frameworks. We govern cross-border compliance across 6 jurisdictions. We verify
                payments with compliance pre-checks before x402, ACP, AP2, or MPP execute.
              </p>
              <p className="pt-4 text-lg font-bold text-emerald-400">
                We&apos;re not just a compliance tool. We&apos;re the operating system for agent trust.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-16">
          <h2 className="mb-8 text-center text-3xl font-black tracking-tight text-white">
            The Protocol Landscape (Production-Ready 2026)
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/50">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-emerald-400">Protocol</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-emerald-400">Layer</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-emerald-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-emerald-400">What It Does</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {protocols.map((protocol) => (
                  <tr key={protocol.name} className="border-b border-white/5 last:border-b-0">
                    <td className="px-6 py-4 font-bold text-white">{protocol.name}</td>
                    <td className="px-6 py-4">{protocol.layer}</td>
                    <td className="px-6 py-4">{protocol.status}</td>
                    <td className="px-6 py-4">{protocol.what}</td>
                  </tr>
                ))}
                <tr className="bg-emerald-500/[0.05]">
                  <td className="px-6 py-4 font-bold text-emerald-400">CSOAI (did:csoai)</td>
                  <td className="px-6 py-4 font-bold text-emerald-400">LAYER 0 (IDENTITY & TRUST)</td>
                  <td className="px-6 py-4 font-bold text-emerald-400">PRODUCTION</td>
                  <td className="px-6 py-4 font-bold text-emerald-400">Persistent Identity, Cross-Regional Policy, Payment Pre-Checks, Audit Anchoring</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-32">
          <h2 className="mb-8 text-center text-3xl font-black tracking-tight text-white">
            The 8 Layers of Trust Infrastructure
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {layers.map((layer) => (
              <div
                key={layer.title}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-emerald-500/30"
              >
                <span className="mb-3 inline-block rounded bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  {layer.badge}
                </span>
                <h3 className="mb-2 text-lg font-bold text-white">{layer.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{layer.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
