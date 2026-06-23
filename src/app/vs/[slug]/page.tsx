import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COMPETITORS, getCompetitorBySlug } from "@/lib/competitors";
import { PAIN_QUOTES } from "@/lib/pain-quotes";

export function generateStaticParams() {
  return COMPETITORS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getCompetitorBySlug(slug);
  if (!c) notFound();
  return {
    title: `CSOAI vs ${c.name}`,
    description: `Why teams switch from ${c.name} to CSOAI. ${c.weakness}`,
    openGraph: {
      title: `CSOAI vs ${c.name}`,
      description: c.killMove,
      images: [`/api/og?title=CSOAI%20vs%20${encodeURIComponent(c.name)}&desc=${encodeURIComponent(c.killMove)}`],
    },
    alternates: { canonical: `/vs/${c.slug}` },
  };
}

export default async function VsCompetitorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCompetitorBySlug(slug);
  if (!c) notFound();

  const painQuote = PAIN_QUOTES.find(
    (q) =>
      q.topic.toLowerCase().includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(q.topic.toLowerCase().split(" ")[0])
  );

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
          { "@type": "ListItem", position: 2, name: "Transfer", item: "https://csoai.org/transfer" },
          { "@type": "ListItem", position: 3, name: `vs ${c.name}`, item: `https://csoai.org/vs/${c.slug}` },
        ],
      },
      {
        "@type": "ClaimReview",
        claimReviewed: `${c.name} ${c.weakness}`,
        reviewAspect: "Competitive comparison",
        reviewBody: c.killMove,
        author: { "@type": "Organization", name: "CSOAI" },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="mx-auto max-w-5xl px-4 py-20">
        <div className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Head-to-head
          </div>
          <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">
            CSOAI <span className="text-emerald-400">vs</span> {c.name}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">{c.weakness}</p>
        </div>

        <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Category", value: c.category },
            { label: "Pricing", value: c.pricing },
            c.funding ? { label: "Funding", value: c.funding } : null,
            c.g2 ? { label: "G2 rating", value: c.g2 } : null,
          ]
            .filter(Boolean)
            .map((item) => (
              <div key={item!.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">{item!.label}</p>
                <p className="text-lg font-bold text-white">{item!.value}</p>
              </div>
            ))}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Threat level</p>
            <p
              className={`text-lg font-bold ${
                c.threat === "CRITICAL" ? "text-red-400" : c.threat === "HIGH" ? "text-amber-400" : "text-slate-300"
              }`}
            >
              {c.threat}
            </p>
          </div>
        </div>

        <div className="mb-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8">
            <h2 className="mb-4 text-2xl font-bold text-red-400">Their fatal weakness</h2>
            <p className="text-slate-300">{c.weakness}</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8">
            <h2 className="mb-4 text-2xl font-bold text-emerald-400">Your kill move</h2>
            <p className="text-slate-300">{c.killMove}</p>
          </div>
        </div>

        {c.churnTriggers.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Common churn triggers</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {c.churnTriggers.map((t) => (
                <div key={t} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-amber-400" />
                  <span className="text-sm text-slate-300">{t}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {c.cves.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Reported CVEs</h2>
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-slate-300">
                  <tr>
                    <th className="px-6 py-3 font-bold">CVE</th>
                    <th className="px-6 py-3 font-bold">CVSS</th>
                    <th className="px-6 py-3 font-bold">Impact</th>
                    <th className="px-6 py-3 font-bold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {c.cves.map((cve) => (
                    <tr key={cve.id} className="bg-white/[0.02]">
                      <td className="px-6 py-3 font-mono text-white">{cve.id}</td>
                      <td className="px-6 py-3 text-red-400">{cve.cvss}</td>
                      <td className="px-6 py-3 text-slate-400">{cve.description}</td>
                      <td className="px-6 py-3 text-slate-400">{cve.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {painQuote && (
          <blockquote className="mb-12 border-l-4 border-emerald-500 pl-6 italic text-slate-300">
            “{painQuote.quote}”
            <footer className="mt-2 text-sm not-italic text-slate-500">— {painQuote.source}</footer>
          </blockquote>
        )}

        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center sm:flex-row">
          <Link
            href="/contact"
            className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            Start a free transfer assessment
          </Link>
          <Link
            href="/transfer"
            className="rounded-lg border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
          >
            See all supported platforms
          </Link>
        </div>

        <p className="mt-8 text-center text-xs text-slate-600">
          Competitive claims are based on public research, customer reports, and composite analysis. Verify all data
          independently before contractual use.
        </p>
      </div>
    </div>
  );
}
