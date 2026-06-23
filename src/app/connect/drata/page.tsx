import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Drata Connector",
  description:
    "CSOAI's Drata connector converts continuous control evidence into AI-specific attestations. Sync Drata results and issue Watchdog Certificates on demand or on schedule.",
  openGraph: {
    title: "CSOAI + Drata",
    description: "Convert continuous Drata control signals into regulator-checkable AI certificates.",
    images: ["/api/og?title=CSOAI%20%2B%20Drata&desc=Convert%20continuous%20Drata%20control%20signals%20into%20AI%20certificates."],
  },
  alternates: { canonical: "/connect/drata" },
};

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
        { "@type": "ListItem", position: 2, name: "Connectors", item: "https://csoai.org/connect" },
        { "@type": "ListItem", position: 3, name: "Drata", item: "https://csoai.org/connect/drata" },
      ],
    },
    {
      "@type": "SoftwareApplication",
      name: "CSOAI Drata Connector",
      applicationCategory: "SecurityApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
    },
  ],
};

const features = [
  "Read control status, tests, and evidence from Drata via API.",
  "Attach Drata evidence to AI risk registers and Article 50 records.",
  "Schedule recurring Watchdog Certificate renewals tied to passing controls.",
  "Export a public chain of signed evidence hashes for auditor review.",
  "Get Slack/email alerts when a control failure affects a certified AI system.",
];

const steps = [
  { n: 1, title: "Authorize", desc: "Create a read-only Drata API key and store it in your CSOAI vault." },
  { n: 2, title: "Match", desc: "Map Drata frameworks (SOC 2, ISO 27001, HIPAA) to CSOAI risk domains." },
  { n: 3, title: "Certify", desc: "Issue or renew Watchdog Certificates automatically when controls pass." },
];

export default function DrataConnectorPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="mx-auto max-w-5xl px-4 py-20">
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Connector
          </div>
          <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">CSOAI + Drata</h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            Drata keeps your controls healthy; CSOAI turns that health into AI governance proof that customers and
            regulators can verify instantly.
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
          <h2 className="mb-2 text-xl font-bold">Thinking of leaving Drata?</h2>
          <p className="mb-4 text-sm text-slate-400">
            Drata confirms connections but rarely maps them to AI risk. CSOAI cross-maps 13+ frameworks to your AI
            systems and turns passing controls into public Watchdog Certificates.
          </p>
          <Link href="/vs/drata" className="text-sm font-bold text-emerald-400 hover:underline">
            See CSOAI vs Drata →
          </Link>
        </section>
      </div>
    </div>
  );
}
