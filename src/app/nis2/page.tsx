import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "NIS2 Compliance",
  description:
    "CSOAI NIS2 compliance infrastructure: entity inventory, supply-chain attestations, incident reporting, and governance for essential and important entities.",
  openGraph: {
    title: "CSOAI NIS2 Compliance",
    description: "NIS2 entity inventory, supply-chain attestations, and incident reporting.",
    images: ["/api/og?title=NIS2%20Compliance&desc=NIS2%20entity%20inventory%2C%20supply-chain%20attestations%2C%20and%20incident%20reporting."],
  },
  alternates: { canonical: "/nis2" },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "NIS2 Compliance", item: "https://csoai.org/nis2" },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Who is in scope for NIS2?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Essential and important entities across energy, transport, banking, finance, health, drinking water, wastewater, digital infrastructure, public administration, and more.",
      },
    },
    {
      "@type": "Question",
      name: "What are the key NIS2 obligations?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Risk management, incident reporting, supply-chain security, business continuity, cryptography use, and cooperation with competent authorities.",
      },
    },
    {
      "@type": "Question",
      name: "How does CSOAI help with supply-chain security?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CSOAI issues signed attestations for ICT suppliers, maintains a verifiable inventory of AI systems, and automates incident evidence packs.",
      },
    },
  ],
};

export default function Nis2Page() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="mx-auto max-w-4xl px-4 py-20">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-400">
          Audits underway
        </div>
        <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">NIS2 Compliance</h1>
        <p className="mb-12 text-lg text-slate-400">
          The NIS2 Directive is now national law across the EU. Essential and important entities must prove risk management,
          supply-chain security, and incident reporting. CSOAI turns those obligations into signed, verifiable artifacts.
        </p>

        <div className="mb-12 grid gap-6 sm:grid-cols-2">
          {[
            { title: "Entity inventory", desc: "Maintain a live inventory of AI systems, APIs, and critical ICT services mapped to NIS2 categories." },
            { title: "Supplier attestations", desc: "Require and verify Ed25519-signed attestations from every critical supplier." },
            { title: "Incident reporting", desc: "Generate early-warning and final incident reports with evidence packs and timelines." },
            { title: "Cryptography & access", desc: "Enforce identity, encryption, and least-privilege policies through the PDCA runtime." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="mb-2 font-bold text-emerald-400">{item.title}</h3>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mb-12 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8">
          <h2 className="mb-4 text-2xl font-bold">Prepare for NIS2 audit</h2>
          <p className="mb-6 text-slate-300">
            Our NIS2 readiness scan identifies entity classification, supplier gaps, and missing incident workflows — then
            produces a signed readiness attestation.
          </p>
          <Link href="/pricing" className="inline-block rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-600">
            See NIS2 pricing →
          </Link>
        </div>

        <h2 className="mb-6 text-2xl font-bold">Frequently asked questions</h2>
        <div className="space-y-3">
          {faqSchema.mainEntity.map((f) => (
            <details key={f.name} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <summary className="cursor-pointer font-bold">{f.name}</summary>
              <p className="mt-2 leading-relaxed text-slate-400">{f.acceptedAnswer.text}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
