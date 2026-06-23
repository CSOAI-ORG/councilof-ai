import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "UCP",
  description:
    "Universal Commerce Protocol (UCP) governance for AI agents. CSOAI is on the roadmap to support UCP for standardised agent commerce across marketplaces and services.",
  openGraph: { title: "CSOAI UCP", description: "Universal Commerce Protocol for agent marketplaces." },
  alternates: { canonical: "/ucp" },
};

const FAQ = [
  { q: "What is UCP?", a: "The Universal Commerce Protocol is an industry-led effort to standardise how agents discover, negotiate, and transact for goods and services across marketplaces." },
  { q: "What is CSOAI&apos;s role in UCP?", a: "CSOAI will provide governance, identity, and attestation services so UCP transactions can be verified, compliant, and auditable by default." },
  { q: "When will UCP be supported?", a: "UCP is on the CSOAI roadmap. We will add native support once the protocol specification and initial implementations are available." },
];

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "Protocols", item: "https://csoai.org/protocols" },
    { "@type": "ListItem", position: 3, name: "UCP", item: "https://csoai.org/ucp" },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

export default function UcpPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="mx-auto max-w-4xl px-4 py-20">
        <div className="mb-6 inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-400">Roadmap</div>
        <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">UCP</h1>
        <p className="mb-12 max-w-2xl text-lg text-slate-400">Universal Commerce Protocol. CSOAI is on the roadmap to support UCP for standardised, governed, and auditable agent commerce across marketplaces.</p>

        <div className="mb-16 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-2 text-lg font-bold text-emerald-400">Governance layer planned</h3>
          <p className="text-sm text-slate-400">CSOAI will provide identity verification, policy enforcement, and signed transaction receipts for UCP marketplaces.</p>
        </div>

        <div className="flex gap-4">
          <Link href="/protocols" className="rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-600">All protocols →</Link>
        </div>

        <section className="mt-16"><h2 className="mb-6 text-2xl font-bold">Frequently asked questions</h2><div className="space-y-3">{FAQ.map((f) => (<details key={f.q} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm"><summary className="cursor-pointer font-bold">{f.q}</summary><p className="mt-2 leading-relaxed text-slate-400">{f.a}</p></details>))}</div></section>
      </div>
    </div>
  );
}
