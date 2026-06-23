import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "OneTrust Connector",
  description:
    "CSOAI's OneTrust connector imports AI inventories, risk records, and DPIA data so you can classify systems under the EU AI Act and publish signed Watchdog Certificates.",
  openGraph: {
    title: "CSOAI + OneTrust",
    description: "Close the AI governance gap between OneTrust and Layer 0 attestations.",
    images: ["/api/og?title=CSOAI%20%2B%20OneTrust&desc=Close%20the%20AI%20governance%20gap%20between%20OneTrust%20and%20Layer%200%20attestations."],
  },
  alternates: { canonical: "/connect/onetrust" },
};

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
        { "@type": "ListItem", position: 2, name: "Connectors", item: "https://csoai.org/connect" },
        { "@type": "ListItem", position: 3, name: "OneTrust", item: "https://csoai.org/connect/onetrust" },
      ],
    },
    {
      "@type": "SoftwareApplication",
      name: "CSOAI OneTrust Connector",
      applicationCategory: "SecurityApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
    },
  ],
};

const features = [
  "Import AI systems, models, and datasets from OneTrust AI Governance.",
  "Map OneTrust risk ratings to CSOAI high-risk / prohibited / limited classifications.",
  "Pull DPIA and conformity assessment records into Article 50 dossiers.",
  "Generate Watchdog Certificates that reference OneTrust evidence by stable ID.",
  "Keep both systems in sync with scheduled or webhook-based refreshes.",
];

const steps = [
  { n: 1, title: "Export", desc: "Connect OneTrust via API or accept its standard AI inventory export format." },
  { n: 2, title: "Classify", desc: "Run CSOAI's classifier over imported records to surface EU AI Act risk tiers." },
  { n: 3, title: "Publish", desc: "Issue signed attestations and a public verify URL for each in-scope system." },
];

export default function OneTrustConnectorPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="mx-auto max-w-5xl px-4 py-20">
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Connector
          </div>
          <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">CSOAI + OneTrust</h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            OneTrust holds your AI governance data. CSOAI turns it into transparent, regulator-checkable proof that
            builds trust at the speed of AI.
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
          <h2 className="mb-2 text-xl font-bold">Thinking of leaving OneTrust?</h2>
          <p className="mb-4 text-sm text-slate-400">
            OneTrust is powerful for privacy, but mid-contract uplifts of 22–80% and no AI runtime enforcement leave a
            gap. CSOAI closes it with predictable pricing and agent-level attestations.
          </p>
          <Link href="/vs/onetrust" className="text-sm font-bold text-emerald-400 hover:underline">
            See CSOAI vs OneTrust →
          </Link>
        </section>
      </div>
    </div>
  );
}
