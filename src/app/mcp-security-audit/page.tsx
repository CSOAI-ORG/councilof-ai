import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MCP Security Audit",
  description:
    "Professional MCP server security audit: tool poisoning, confused deputy, prompt injection, and RCE surface review. Signed report in 48 hours.",
  openGraph: {
    title: "CSOAI MCP Security Audit",
    description: "Professional MCP server security audit with signed report in 48 hours.",
    images: ["/api/og?title=MCP%20Security%20Audit&desc=Professional%20MCP%20server%20security%20audit%20with%20signed%20report%20in%2048%20hours."],
  },
  alternates: { canonical: "/mcp-security-audit" },
};

const checks = [
  { name: "Tool poisoning", desc: "Verify no malicious tool descriptions or hidden parameters are injected into server manifests." },
  { name: "Confused deputy", desc: "Check that the server cannot be tricked into calling privileged tools on behalf of another agent." },
  { name: "Prompt injection", desc: "Test resource and prompt endpoints for indirect prompt injection vectors." },
  { name: "RCE surface", desc: "Review command execution, file system access, and network egress controls." },
  { name: "Transport security", desc: "Validate SSE/auth scopes, CORS, and secret handling across stdio and HTTP transports." },
  { name: "Supply chain", desc: "Inspect dependencies, SBOM coverage, and known CVE exposure." },
];

const deliverables = [
  "Executive summary",
  "Attack tree and risk ratings",
  "Per-find remediation steps",
  "Signed Ed25519 audit report",
  "Public verify URL",
  "Re-test option within 30 days",
];

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "MCP Security Audit", item: "https://csoai.org/mcp-security-audit" },
  ],
};

const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "CSOAI MCP Security Audit",
  description: "Professional MCP server security audit with signed report.",
  brand: { "@type": "Brand", name: "CSOAI" },
  offers: {
    "@type": "Offer",
    price: "999",
    priceCurrency: "GBP",
    availability: "https://schema.org/InStock",
  },
};

export default function McpSecurityAuditPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <div className="mx-auto max-w-5xl px-4 py-20">
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-red-400">
            New service
          </div>
          <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">
            MCP Security Audit
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            The MCP explosion brought tool poisoning, confused deputy attacks, and RCE risks. Get your server audited
            by CSOAI and publish a signed, verifiable security report.
          </p>
        </div>

        <div className="mb-16 grid gap-6 md:grid-cols-2">
          {checks.map((c) => (
            <div key={c.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="mb-2 font-bold text-emerald-400">{c.name}</h3>
              <p className="text-sm text-slate-400">{c.desc}</p>
            </div>
          ))}
        </div>

        <div className="mb-16 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Fixed-price audit</h2>
              <p className="text-slate-400">£999 per MCP server. Report delivered within 48 hours.</p>
            </div>
            <div className="text-4xl font-black text-emerald-400">£999</div>
          </div>
          <ul className="mb-8 grid gap-2 sm:grid-cols-2">
            {deliverables.map((d) => (
              <li key={d} className="flex items-center gap-2 text-sm text-slate-300">
                <span className="text-emerald-400">✓</span> {d}
              </li>
            ))}
          </ul>
          <Link
            href="mailto:security@csoai.org?subject=Book%20MCP%20Security%20Audit"
            className="inline-block rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-600"
          >
            Book an audit →
          </Link>
        </div>
      </div>
    </div>
  );
}
