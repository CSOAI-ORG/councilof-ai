import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "x402",
  description:
    "x402 HTTP 402 payment protocol for AI agents. CSOAI provides compliance pre-checks, agent identity verification, and signed payment attestations before any autonomous transaction executes.",
  openGraph: {
    title: "CSOAI x402 Payments",
    description: "HTTP 402 pay-per-call with compliance pre-check and signed attestations.",
  },
  alternates: { canonical: "/x402" },
};

const FAQ = [
  {
    q: "What is x402?",
    a: "x402 is a protocol from Coinbase that uses HTTP 402 Payment Required responses to enable machines to pay machines per API call, with settlement on-chain or via traditional rails.",
  },
  {
    q: "Why do agents need x402 governance?",
    a: "Autonomous payments create regulatory and operational risk. CSOAI pre-checks each transaction against AML/KYC, region, and policy rules before the 402 handshake completes.",
  },
  {
    q: "Does x402 replace Stripe or traditional billing?",
    a: "No. x402 complements card and invoice billing by enabling granular, per-call machine payments. CSOAI also supports Stripe ACP and AP2 for broader agent commerce.",
  },
];

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "Protocols", item: "https://csoai.org/protocols" },
    { "@type": "ListItem", position: 3, name: "x402", item: "https://csoai.org/x402" },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function X402Page() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="mx-auto max-w-4xl px-4 py-20">
        <div className="mb-6 inline-block rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
          Layer 0 Protocol
        </div>
        <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">
          x402 Payments
        </h1>
        <p className="mb-12 max-w-2xl text-lg text-slate-400">
          Coinbase&apos;s HTTP 402 protocol for machine-to-machine payments. CSOAI adds compliance pre-checks, identity
          attestation, and signed transaction receipts so autonomous agents pay safely.
        </p>

        <div className="mb-16 space-y-4">
          {[
            { step: "1", title: "Request", desc: "Agent calls an API endpoint." },
            { step: "2", title: "402 Response", desc: "Server returns payment requirements." },
            { step: "3", title: "CSOAI Pre-check", desc: "AML/KYC, region, and policy rules are evaluated." },
            { step: "4", title: "Settle", desc: "Payment settles and a signed receipt is recorded." },
          ].map((s) => (
            <div key={s.step} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-bold text-emerald-400">
                {s.step}
              </div>
              <div>
                <h3 className="font-bold">{s.title}</h3>
                <p className="text-sm text-slate-400">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <Link
            href="/mcp-packs"
            className="rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-600"
          >
            Agentic Finance Pack
          </Link>
          <Link href="/protocols" className="rounded-xl border border-white/10 px-6 py-3 font-medium transition hover:bg-white/5">
            All protocols
          </Link>
        </div>

        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">Frequently asked questions</h2>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                <summary className="cursor-pointer font-bold">{f.q}</summary>
                <p className="mt-2 leading-relaxed text-slate-400">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
