import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI Agent Identity & Certification — CSOAI",
  description:
    "Persistent identity for AI agents. CSOAI provides did:csoai (W3C DID v1.1) and Watchdog Certificates to build trust in the agentic economy.",
  alternates: { canonical: "/identity" },
  openGraph: {
    title: "AI Agent Identity & Certification — CSOAI",
    description:
      "Persistent identity for AI agents. CSOAI provides did:csoai and Watchdog Certificates.",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CSOAI",
  url: "https://csoai.org",
  sameAs: ["https://github.com/csoai-org"],
};

export default function IdentityPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <div className="mx-auto max-w-6xl px-6 py-20">
        <section className="mb-20">
          <p className="mb-4 text-xs font-black uppercase tracking-widest text-emerald-400">
            Layer 0-A &amp; B: Identity
          </p>
          <h1 className="mb-6 text-5xl font-black tracking-tighter sm:text-6xl">
            The Foundation of Trust
          </h1>
          <p className="mb-8 max-w-3xl text-xl text-slate-400">
            Every agent needs a persistent identity and a valid certificate before it can be trusted
            to act. CSOAI provides the sovereign infrastructure for AI identity.
          </p>
          <Link
            href="/verify"
            className="inline-block rounded-full bg-amber-400 px-8 py-4 text-sm font-black uppercase tracking-widest text-slate-950 transition hover:bg-amber-300"
          >
            Verify an Agent
          </Link>
        </section>

        <section className="mb-20 rounded-[2rem] border-2 border-amber-400/30 bg-white/[0.03] p-8 shadow-2xl shadow-amber-500/10 sm:p-12">
          <p className="mb-4 text-xs font-black uppercase tracking-widest text-slate-500">
            Sovereign AI Identifier
          </p>
          <div className="mb-6 break-all font-mono text-2xl font-extrabold sm:text-4xl">
            did:<span className="text-amber-400">csoai</span>:8f2a-91c1-4b7d-6e5a
          </div>
          <p className="max-w-2xl text-slate-400">
            W3C DID v1.1 compliant. IETF AIP compatible. Persistent across platforms, protocols, and
            jurisdictions.
          </p>
        </section>

        <section className="grid gap-8 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
            <h3 className="mb-4 text-xl font-bold text-amber-400">Watchdog Certificates</h3>
            <p className="text-slate-400">
              Ed25519-signed certification mapping to 30 frameworks. Prove your agent is compliant
              with EU AI Act, NIST, and ISO 42001 in real-time.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
            <h3 className="mb-4 text-xl font-bold text-amber-400">BFT Council Governance</h3>
            <p className="text-slate-400">
              Identity is validated by a decentralized council of nodes using Byzantine Fault
              Tolerant consensus to prevent single-point-of-failure trust.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
            <h3 className="mb-4 text-xl font-bold text-amber-400">Protocol Agnostic</h3>
            <p className="text-slate-400">
              Integrate CSOAI identity into any protocol: MCP, A2A, x402, or custom API tunnels. One
              identity to rule them all.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
