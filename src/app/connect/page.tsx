import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Connectors",
  description:
    "CSOAI connectors for Vanta, Drata, and OneTrust. Import evidence, sync AI BOMs, and issue Watchdog Certificates without replacing your existing GRC stack.",
  openGraph: {
    title: "CSOAI Connectors",
    description: "Bridge Vanta, Drata, and OneTrust into the CSOAI Layer 0 trust layer.",
    images: ["/api/og?title=CSOAI%20Connectors&desc=Bridge%20Vanta%2C%20Drata%2C%20and%20OneTrust%20into%20the%20CSOAI%20Layer%200%20trust%20layer."],
  },
  alternates: { canonical: "/connect" },
};

const connectors = [
  {
    slug: "vanta",
    name: "Vanta",
    tagline: "Turn audit prep into signed attestations",
    desc: "Pull Vanta evidence and control status into CSOAI, then issue public-verify Watchdog Certificates for your AI systems.",
  },
  {
    slug: "drata",
    name: "Drata",
    tagline: "Convert continuous control signals into certificates",
    desc: "Sync Drata control results and generate regulator-checkable attestations on a schedule or on demand.",
  },
  {
    slug: "onetrust",
    name: "OneTrust",
    tagline: "Close the AI governance gap",
    desc: "Export OneTrust AI BOMs and DPIA data into CSOAI for risk classification, Article 50 checks, and signed reports.",
  },
];

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "Connectors", item: "https://csoai.org/connect" },
  ],
};

export default function ConnectHubPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Integrations
          </div>
          <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">CSOAI Connectors</h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            You do not have to replace your GRC stack. Bridge Vanta, Drata, and OneTrust into CSOAI and upgrade their
            evidence into cryptographic, regulator-checkable attestations.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {connectors.map((c) => (
            <Link
              key={c.slug}
              href={`/connect/${c.slug}`}
              className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-emerald-500/30 hover:bg-white/[0.05]"
            >
              <h2 className="mb-2 text-2xl font-bold text-white group-hover:text-emerald-400">{c.name}</h2>
              <p className="mb-4 text-sm font-bold text-emerald-400">{c.tagline}</p>
              <p className="mb-6 flex-1 text-sm text-slate-400">{c.desc}</p>
              <span className="text-sm font-bold text-slate-300 group-hover:text-emerald-400">Learn more →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
