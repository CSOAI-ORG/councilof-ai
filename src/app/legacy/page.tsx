import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Legacy Modernization & COBOL Bridge — CSOAI",
  description:
    "Securely bridge your Mainframe and COBOL systems to AI agents. CSOAI Layer 0-H provides governed tunnels for legacy modernization.",
  openGraph: {
    title: "Legacy Modernization & COBOL Bridge — CSOAI",
    description: "Governed tunnels that let AI agents securely interact with COBOL and Mainframe environments.",
    images: ["/api/og?title=COBOL%20Bridge&desc=Legacy%20modernization%20for%20AI%20agents"],
  },
  alternates: { canonical: "/legacy" },
};

const features = [
  {
    title: "COBOL Parser",
    description:
      "Convert complex legacy logic into agent-readable JSON schemas while maintaining strict data sovereignty and audit trails.",
  },
  {
    title: "Mainframe Wrapper",
    description:
      "Securely expose IBM z/OS and AS/400 resources to modern MCP-enabled agents without modifying core code.",
  },
  {
    title: "Oracle Forms Bridge",
    description:
      "Automate interactions with legacy Oracle Forms applications using our governed robotic process automation (RPA) tunnels.",
  },
];

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "CSOAI Legacy Modernization & COBOL Bridge",
  provider: { "@type": "Organization", name: "CSOAI", url: "https://csoai.org" },
  description: "Governed tunnels for AI agents to securely interact with COBOL and Mainframe systems.",
  areaServed: "Global",
  url: "https://csoai.org/legacy",
};

export default function LegacyPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div className="min-h-screen bg-slate-950 text-white">
        <section className="mx-auto max-w-5xl px-4 pb-16 pt-32">
          <div className="mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">
            Layer 0-H: Legacy Bridge
          </div>
          <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl lg:text-7xl">
            <span className="gradient-text">Mainframe to Agent Tunnels</span>
          </h1>
          <p className="mb-10 max-w-3xl text-xl leading-relaxed text-slate-400">
            Don&apos;t rewrite your legacy systems. Bridge them. CSOAI provides governed tunnels that
            allow AI agents to securely interact with COBOL and Mainframe environments.
          </p>
          <Link
            href="/contact"
            className="inline-flex rounded-full bg-emerald-500 px-8 py-4 text-sm font-black uppercase tracking-widest text-slate-950 transition hover:bg-emerald-400"
          >
            Talk to an Architect
          </Link>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-20">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900 p-6 font-mono text-sm text-slate-300 sm:p-10">
            <div className="mb-2 text-slate-500">* BRIDGE CONFIGURATION FOR SAP R/3 & MAINFRAME Z/OS</div>
            <div className="text-purple-400">IDENTIFICATION DIVISION.</div>
            <div>PROGRAM-ID. CSOAI-TUNNEL.</div>
            <br />
            <div className="text-purple-400">ENVIRONMENT DIVISION.</div>
            <div>CONFIGURATION SECTION.</div>
            <div>SPECIAL-NAMES.</div>
            <div className="pl-8">AGENT-ID <span className="text-purple-400">IS</span> <span className="text-emerald-400">&quot;did:csoai:8f2a-91c1&quot;</span></div>
            <div className="pl-8">POLICY-SET <span className="text-purple-400">IS</span> <span className="text-emerald-400">&quot;PDCA-ENTERPRISE-v2&quot;</span></div>
            <br />
            <div className="text-slate-500">* RUNTIME ENFORCEMENT ACTIVE</div>
            <div>
              <span className="text-purple-400">IF</span> AGENT-NOT-CERTIFIED{" "}
              <span className="text-purple-400">THEN</span>
            </div>
            <div className="pl-8">
              <span className="text-purple-400">CALL</span>{" "}
              <span className="text-emerald-400">&apos;BLOCK-ACCESS&apos;</span>{" "}
              <span className="text-purple-400">USING</span> CSOAI-WATCHDOG
            </div>
            <div className="text-purple-400">END-IF.</div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-32">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 transition hover:-translate-y-2 hover:border-emerald-500/30 hover:bg-white/[0.05]"
              >
                <h3 className="mb-3 text-xl font-bold text-emerald-400">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
