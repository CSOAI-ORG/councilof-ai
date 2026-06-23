import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "eIDAS 2.0 & EUDI Wallet",
  description:
    "CSOAI eIDAS 2.0 infrastructure: W3C DID identity, EUDI wallet integration, and qualified electronic signatures for AI agent attestations.",
  openGraph: {
    title: "CSOAI eIDAS 2.0 & EUDI Wallet",
    description: "W3C DID identity, EUDI wallet integration, and qualified signatures for AI agent attestations.",
    images: ["/api/og?title=eIDAS%202.0%20%26%20EUDI%20Wallet&desc=W3C%20DID%20identity%2C%20EUDI%20wallet%20integration%2C%20and%20qualified%20signatures%20for%20AI%20agent%20attestations."],
  },
  alternates: { canonical: "/eidas2" },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "eIDAS 2.0", item: "https://csoai.org/eidas2" },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is eIDAS 2.0?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The updated EU electronic identification and trust services regulation, introducing the European Digital Identity Wallet (EUDIW) for storing and sharing identity credentials and attestations.",
      },
    },
    {
      "@type": "Question",
      name: "How does CSOAI align with eIDAS 2.0?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CSOAI uses W3C DID v1.1 and Ed25519 signatures today and is building EUDI wallet attribution for Watchdog Certificates and agent identity credentials.",
      },
    },
    {
      "@type": "Question",
      name: "Can Watchdog Certificates become eIDAS attestations?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The roadmap includes optional QES and EUDI wallet binding so regulators and contracting parties can verify CSOAI attestations under eIDAS 2.0 rules.",
      },
    },
  ],
};

export default function Eidas2Page() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="mx-auto max-w-4xl px-4 py-20">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-400">
          December 2026
        </div>
        <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">eIDAS 2.0 & EUDI Wallet</h1>
        <p className="mb-12 text-lg text-slate-400">
          The European Digital Identity Wallet arrives in 2026. CSOAI is aligning `did:csoai`, Watchdog Certificates,
          and agent attestations with EUDI wallet standards so your AI compliance proofs are portable and legally binding.
        </p>

        <div className="mb-12 grid gap-6 sm:grid-cols-2">
          {[
            { title: "W3C DID identity", desc: "`did:csoai` is designed to interoperate with EUDI wallet identity schemas and W3C Verifiable Credentials." },
            { title: "Attestation wallet binding", desc: "Watchdog Certificates can be issued as EUDI wallet attestations for portability across EU member states." },
            { title: "Qualified signatures", desc: "Optional QES and RFC 3161 timestamping give CSOAI receipts stronger evidentiary value in EU courts." },
            { title: "Regulator verify API", desc: "Competent authorities can verify wallet-bound CSOAI attestations via public API without trusting CSOAI directly." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="mb-2 font-bold text-emerald-400">{item.title}</h3>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mb-12 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8">
          <h2 className="mb-4 text-2xl font-bold">Get EUDI-ready</h2>
          <p className="mb-6 text-slate-300">
            Join the CSOAI eIDAS 2.0 early-access program. We will map your identity and attestation flows to the EUDI
            wallet architecture and provide a migration path from legacy credentials.
          </p>
          <Link href="/pricing" className="inline-block rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-600">
            Join early access →
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
