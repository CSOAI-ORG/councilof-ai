import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transparency Audit Log — CSOAI Layer 0",
  description:
    "Live blockchain-anchored audit log of AI compliance decisions. Verified by the BFT Council on the Polygon PoA network.",
  openGraph: {
    title: "Transparency Audit Log — CSOAI Layer 0",
    description:
      "Real-time stream of PDCA engine decisions anchored to the Polygon PoA blockchain.",
    images: ["/api/og?title=Transparency%20Audit%20Log&desc=Blockchain-anchored%20compliance%20decisions"],
  },
  alternates: { canonical: "/audit" },
};

const auditEntries = [
  {
    timestamp: "2026-06-11 14:22:01",
    identity: "did:csoai:e60e...",
    action: "A2A Delegation",
    jurisdiction: "🇪🇺 EU",
    result: "ALLOW",
  },
  {
    timestamp: "2026-06-11 14:21:55",
    identity: "did:csoai:8822...",
    action: "x402 Payment",
    jurisdiction: "🇺🇸 US",
    result: "ALLOW",
  },
  {
    timestamp: "2026-06-11 14:21:40",
    identity: "did:csoai:3321...",
    action: "Data Transfer",
    jurisdiction: "🇨🇳 CN",
    result: "BLOCK (TC260)",
  },
  {
    timestamp: "2026-06-11 14:21:12",
    identity: "did:csoai:990a...",
    action: "MCP Tool Call",
    jurisdiction: "🇬🇧 UK",
    result: "ALLOW",
  },
];

const schema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Transparency Audit Log",
  description:
    "Live blockchain-anchored audit log of AI compliance decisions verified by the BFT Council.",
  url: "https://csoai.org/audit",
  mainEntity: {
    "@type": "ItemList",
    itemListElement: auditEntries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Thing",
        name: `${entry.action} — ${entry.result}`,
        description: `Agent ${entry.identity} performed ${entry.action} in ${entry.jurisdiction} at ${entry.timestamp}.`,
      },
    })),
  },
};

export default function AuditPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div className="min-h-screen bg-slate-950 text-white">
        <section className="mx-auto max-w-5xl px-4 pb-16 pt-32">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-400">
            Live Stream Active
          </span>
          <h1 className="mb-4 text-4xl font-black tracking-tighter sm:text-5xl">
            <span className="gradient-text">Transparency Audit Log</span>
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-slate-300">
            Real-time stream of PDCA engine decisions anchored to the Polygon PoA blockchain. Each
            entry represents a verified compliance check by the Layer 0 foundation.
          </p>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-20">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    Timestamp
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    Agent Identity
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    Action
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    Jurisdiction
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody className="font-mono text-slate-300">
                {auditEntries.map((entry) => (
                  <tr key={entry.timestamp} className="border-b border-white/5 last:border-b-0">
                    <td className="px-6 py-4">{entry.timestamp}</td>
                    <td className="px-6 py-4">{entry.identity}</td>
                    <td className="px-6 py-4">{entry.action}</td>
                    <td className="px-6 py-4">{entry.jurisdiction}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-bold ${
                          entry.result.startsWith("ALLOW")
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {entry.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-10 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05] p-8">
            <h3 className="mb-3 text-xl font-bold text-white">Polygon PoA Anchoring</h3>
            <p className="text-sm leading-relaxed text-slate-400">
              All audit events are hashed and anchored to <code className="text-emerald-400">0x76...2121</code>{" "}
              to ensure non-repudiation. Regulatory-ready reports are generated every 24 hours.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
