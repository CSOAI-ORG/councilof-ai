import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Guides",
  description:
    "Step-by-step how-to guides for AI governance, EU AI Act compliance, CSOAI Watchdog Certification, risk registers, Byzantine consensus, and safety testing.",
  openGraph: { title: "CSOAI How-To Guides", description: "Step-by-step AI governance and compliance guides." },
  alternates: { canonical: "/guides" },
};

const GUIDES = [
  { href: "/guide-eu-ai-act", title: "EU AI Act compliance", desc: "Map your system to the EU AI Act, classify risk, and prepare technical documentation." },
  { href: "/guide-casa-certification", title: "CASA certification", desc: "Get your first CSOAI Agent Safety Attestation." },
  { href: "/guide-framework-selection", title: "Framework selection", desc: "Choose between ISO 42001, NIST AI RMF, SOC 2, and EU AI Act." },
  { href: "/guide-risk-register", title: "AI risk register", desc: "Build and maintain a risk register for AI systems." },
  { href: "/guide-cmmc-ai", title: "CMMC for AI", desc: "Apply CMMC controls to AI workloads in defence supply chains." },
  { href: "/guide-audit-checklist", title: "Audit checklist", desc: "Self-assess before the auditor arrives." },
  { href: "/guide-byzantine-consensus", title: "Byzantine consensus", desc: "Run an agent governance council with BFT-style voting for high-stakes decisions." },
  { href: "/guide-safety-testing", title: "Safety testing", desc: "Red-team, evaluate, and document AI safety tests." },
];

const HOWTO = {
  name: "How to get CSOAI Watchdog Certification",
  steps: [
    { name: "Run the free scorecard", text: "Start with the 90-second readiness scorecard at proofof.ai to identify gaps." },
    { name: "Choose a tier", text: "Select Pro (£199/mo), Article 50 Kit (£999), or Watchdog Cert (£4,950) based on urgency and scope." },
    { name: "Connect your systems", text: "Install the relevant CSOAI MCP servers and run the audit tools against your AI pipeline." },
    { name: "Review the report", text: "CSOAI generates a gap analysis and remediation plan signed by the council." },
    { name: "Receive your attestation", text: "Once remediated, receive an Ed25519-signed Watchdog Cert with a public verify URL." },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "Guides", item: "https://csoai.org/guides" },
  ],
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: HOWTO.name,
  description: "Step-by-step guide to obtaining CSOAI Watchdog Certification.",
  totalTime: "P14D",
  step: HOWTO.steps.map((s, i) => ({
    "@type": "HowToStep",
    position: i + 1,
    name: s.name,
    text: s.text,
  })),
};

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <div className="mx-auto max-w-5xl px-4 py-20">
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-black tracking-tighter sm:text-6xl">How-To Guides</h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            Step-by-step playbooks for AI governance, compliance, and certification.
          </p>
        </div>

        <div className="mb-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((g) => (
            <Link
              key={g.href}
              href={g.href}
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-emerald-500/30"
            >
              <h3 className="mb-2 text-lg font-bold group-hover:text-emerald-400">{g.title}</h3>
              <p className="text-sm text-slate-400">{g.desc}</p>
            </Link>
          ))}
        </div>

        <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8 sm:p-12">
          <h2 className="mb-8 text-3xl font-bold">Get certified in 5 steps</h2>
          <div className="space-y-4">
            {HOWTO.steps.map((s, i) => (
              <div key={s.name} className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-bold text-emerald-400">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-bold">{s.name}</h3>
                  <p className="text-sm text-slate-400">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
