import type { Metadata } from "next";
import Link from "next/link";
import { COMPETITORS } from "@/lib/competitors";
import { MARKET_GAPS, TOTAL_WHITE_SPACE } from "@/lib/market-gaps";
import { PAIN_QUOTES } from "@/lib/pain-quotes";

export const metadata: Metadata = {
  title: "Intelligence",
  description:
    "CSOAI competitive intelligence: 150+ competitors, 25 market gaps, CVE data, customer pain, and the EAT absorption strategy.",
  openGraph: {
    title: "CSOAI Competitive Intelligence",
    description: "150+ competitors, 25 market gaps, CVE data, and customer pain signals.",
    images: ["/api/og?title=CSOAI%20Competitive%20Intelligence&desc=150%2B%20competitors%2C%2025%20market%20gaps%2C%20CVE%20data%2C%20and%20customer%20pain%20signals."],
  },
  alternates: { canonical: "/intelligence" },
};

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
        { "@type": "ListItem", position: 2, name: "Intelligence", item: "https://csoai.org/intelligence" },
      ],
    },
    {
      "@type": "WebPage",
      name: "CSOAI Competitive Intelligence",
      description: "EAT master intelligence: competitors, market gaps, CVEs, and customer pain.",
    },
    {
      "@type": "Dataset",
      name: "CSOAI EAT Master Dataset",
      description: "Structured competitive intelligence derived from the EAT master report.",
      url: "https://csoai.org/whitepapers/csoai-eat-master.md",
    },
  ],
};

export default function IntelligencePage() {
  const criticalCount = COMPETITORS.filter((c) => c.threat === "CRITICAL").length;
  const cveCount = COMPETITORS.reduce((acc, c) => acc + c.cves.length, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            EAT Master
          </div>
          <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">Competitive Intelligence</h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            150+ competitors analyzed. 25 market gaps worth {TOTAL_WHITE_SPACE}. The incumbents are bleeding — here is the
            map.
          </p>
        </div>

        <div className="mb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Competitors tracked", value: "150+" },
            { label: "Critical threats", value: criticalCount.toString() },
            { label: "Reported CVEs", value: cveCount.toString() },
            { label: "White space", value: TOTAL_WHITE_SPACE },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <p className="text-3xl font-black text-emerald-400">{s.value}</p>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        <section className="mb-20 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <h2 className="mb-4 text-2xl font-bold">The simulation advantage</h2>
              <p className="mb-4 text-slate-300">
                Every competitor in this report sells static compliance. CSOAI is building the only living governance
                simulation — 47 agents across 12 industries generating behavioural evidence no one else has.
              </p>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>• Test EU AI Act scenarios before the August 2026 deadline.</li>
                <li>• Run DORA resilience for 22,000 EU financial entities.</li>
                <li>• Produce investor demos and white papers from live simulation output.</li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "47", label: "Agents" },
                { value: "12", label: "Industries" },
                { value: "1,000+", label: "Scenarios" },
                { value: "0", label: "Competitors" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center aspect-square"
                >
                  <p className="text-2xl font-black text-emerald-400">{s.value}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 text-center">
            <Link href="/town" className="inline-flex rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400">
              Read the town vision →
            </Link>
          </div>
        </section>

        <section className="mb-20">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-2xl font-bold">Head-to-head kill sheet</h2>
            <Link href="/transfer" className="text-sm font-bold text-emerald-400 hover:underline">
              Transfer from any of them →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {COMPETITORS.map((c) => (
              <Link
                key={c.slug}
                href={`/vs/${c.slug}`}
                className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-emerald-500/30 hover:bg-white/[0.05]"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-400">{c.name}</h3>
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest ${
                      c.threat === "CRITICAL" ? "text-red-400" : c.threat === "HIGH" ? "text-amber-400" : "text-slate-500"
                    }`}
                  >
                    {c.threat}
                  </span>
                </div>
                <p className="mb-3 text-xs text-slate-500">{c.category} · {c.pricing}</p>
                <p className="mb-4 flex-1 text-sm text-slate-400">{c.weakness}</p>
                <span className="text-sm font-bold text-emerald-400 group-hover:underline">{c.killMove} →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-20">
          <h2 className="mb-8 text-2xl font-bold">Market gaps</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MARKET_GAPS.map((g) => (
              <div key={g.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{g.id}</span>
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest ${
                      g.urgency === "CRITICAL" ? "text-red-400" : g.urgency === "High" ? "text-amber-400" : "text-slate-500"
                    }`}
                  >
                    {g.urgency}
                  </span>
                </div>
                <h3 className="mb-1 font-bold text-white">{g.title}</h3>
                <p className="mb-2 text-xs text-slate-500">TAM: {g.tam} · Fit: {g.fit}</p>
                <p className="text-sm text-slate-400">{g.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-20">
          <h2 className="mb-8 text-2xl font-bold">Customer pain signals</h2>
          <div className="space-y-4">
            {PAIN_QUOTES.map((q) => (
              <blockquote key={q.topic} className="border-l-4 border-emerald-500 pl-6 italic text-slate-300">
                “{q.quote}”
                <footer className="mt-1 text-sm not-italic text-slate-500">— {q.source}</footer>
              </blockquote>
            ))}
          </div>
        </section>

        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center sm:flex-row">
          <a
            href="/whitepapers/csoai-eat-master.md"
            download
            className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            Download full EAT report (.md)
          </a>
          <Link
            href="/contact"
            className="rounded-lg border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Discuss strategy
          </Link>
        </div>

        <p className="mt-8 text-center text-xs text-slate-600">
          Intelligence is derived from public research, customer reports, and composite analysis. Verify independently
          before contractual use.
        </p>
      </div>
    </div>
  );
}
