import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Vanta Connector",
  description:
    "CSOAI's Vanta connector pulls audit evidence and control status into Layer 0, then issues public Ed25519-signed Watchdog Certificates for your AI systems.",
  openGraph: {
    title: "CSOAI + Vanta",
    description: "Turn Vanta evidence into AI-specific, regulator-checkable attestations.",
    images: ["/api/og?title=CSOAI%20%2B%20Vanta&desc=Turn%20Vanta%20evidence%20into%20AI-specific%20attestations."],
  },
  alternates: { canonical: "/connect/vanta" },
};

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
        { "@type": "ListItem", position: 2, name: "Connectors", item: "https://csoai.org/connect" },
        { "@type": "ListItem", position: 3, name: "Vanta", item: "https://csoai.org/connect/vanta" },
      ],
    },
    {
      "@type": "SoftwareApplication",
      name: "CSOAI Vanta Connector",
      applicationCategory: "SecurityApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
    },
  ],
};

const features = [
  "Import SOC 2 / ISO 27001 evidence and control status from Vanta.",
  "Map each finding to an AI system in your CSOAI BOM.",
  "Generate Ed25519-signed Watchdog Certificates for customers or regulators.",
  "Auto-refresh attestations when Vanta evidence is updated.",
  "Publish a public verify URL that anyone can check without login.",
];

const steps = [
  { n: 1, title: "Connect", desc: "Authorize the CSOAI OAuth app inside Vanta with read-only evidence scope." },
  { n: 2, title: "Map", desc: "Link Vanta controls to the AI systems and agents recorded in your CSOAI Layer 0 ledger." },
  { n: 3, title: "Attest", desc: "Issue a Watchdog Certificate in one click. The certificate hashes evidence IDs and signs them with your org key." },
];

export default function VantaConnectorPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="mx-auto max-w-5xl px-4 py-20">
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Connector
          </div>
          <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">CSOAI + Vanta</h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            Bridge Vanta into the CSOAI Layer 0 trust layer. Turn your audit evidence into AI-specific, public-verify
            Watchdog Certificates.
          </p>
        </div>

        <div className="mb-16 grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
            <h2 className="mb-4 text-2xl font-bold">What it does</h2>
            <ul className="space-y-3">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-slate-300">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-sm leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
            <h2 className="mb-4 text-2xl font-bold">How it works</h2>
            <div className="space-y-6">
              {steps.map((s) => (
                <div key={s.n} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 font-mono text-sm font-bold text-emerald-400">
                    {s.n}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{s.title}</h3>
                    <p className="text-sm text-slate-400">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center sm:flex-row">
          <Link
            href="/contact"
            className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            Request beta access
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
          >
            View pricing
          </Link>
        </div>

        <section className="mt-12 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <h2 className="mb-2 text-xl font-bold">Thinking of leaving Vanta?</h2>
          <p className="mb-4 text-sm text-slate-400">
            Teams switch when renewals jump 30–500% or when a data exposure breaks trust. CSOAI imports your Vanta
            evidence in minutes and issues signed AI attestations at a fraction of the cost.
          </p>
          <Link href="/vs/vanta" className="text-sm font-bold text-emerald-400 hover:underline">
            See CSOAI vs Vanta →
          </Link>
        </section>
      </div>
    </div>
  );
}
