import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about CSOAI, Watchdog Certification, the EU AI Act, MCP governance, A2A, x402, and the Layer 0 protocol stack.",
  openGraph: { title: "CSOAI FAQ", description: "Answers to common questions about CSOAI and agent governance." },
  alternates: { canonical: "/faq" },
};

const FAQS = [
  {
    q: "What is CSOAI?",
    a: "CSOAI (Council for the Safety of AI) is an independent authority that certifies AI systems are safe and lets anyone verify those certifications offline through cryptographically signed attestations.",
  },
  {
    q: "What is Watchdog Certification?",
    a: "Watchdog Certification is a CSOAI attestation that an AI system has been audited against the MEOK 8 Layers of Trust. It includes an Ed25519 signature and a public verify URL.",
  },
  {
    q: "How does verification work?",
    a: "Anyone can pull the attestation, public key, and audit chain from csoai.org/verify and verify the signature offline with curl or standard cryptographic tools. No login or SDK is required.",
  },
  {
    q: "What is Layer 0?",
    a: "Layer 0 is the identity, certification, policy, payment, audit, human-loop, and legacy-integration foundation that AI agents share. It is protocol-agnostic and bridges MCP, A2A, x402, DID, and others.",
  },
  {
    q: "Do I need to replace my existing AI stack?",
    a: "No. CSOAI runs alongside your existing agents, models, and infrastructure. You install MCP servers, connect to the council, and receive signed attestations.",
  },
  {
    q: "What is the EU AI Act Article 50 deadline?",
    a: "Article 50 transparency obligations apply from 2 August 2026 for new AI systems. Pre-existing systems have until 2 December 2026.",
  },
  {
    q: "Which protocols does CSOAI support?",
    a: "MCP, A2A, x402, W3C DID v1.1, IETF AIP, and asqav are native. AP2 is partially supported. WIMSE, Microsoft AGT, UCP, and AgentMint are on the roadmap.",
  },
  {
    q: "How much does certification cost?",
    a: "Entry is free. Pro is £199/mo. The Article 50 Kit is £999 one-time. Watchdog Certification is £4,950 one-time.",
  },
];

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "FAQ", item: "https://csoai.org/faq" },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="mx-auto max-w-3xl px-4 py-20">
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-black tracking-tighter sm:text-6xl">FAQ</h1>
          <p className="text-lg text-slate-400">Answers to the most common questions about CSOAI and agent governance.</p>
        </div>

        <div className="space-y-4">
          {FAQS.map((f) => (
            <details key={f.q} className="rounded-xl border border-white/10 bg-white/5 p-5">
              <summary className="cursor-pointer text-lg font-bold">{f.q}</summary>
              <p className="mt-3 leading-relaxed text-slate-400">{f.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="mb-4 text-slate-400">Still have questions?</p>
          <Link
            href="mailto:nicholas@csoai.org"
            className="inline-flex rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-600"
          >
            Contact us
          </Link>
        </div>
      </div>
    </div>
  );
}
