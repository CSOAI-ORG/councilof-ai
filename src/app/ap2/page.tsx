import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AP2",
  description:
    "Agent Payments Protocol (AP2) governance for AI agents. CSOAI supports AP2 mandates and cross-platform payment compliance for agentic commerce.",
  openGraph: { title: "CSOAI AP2", description: "Agent Payments Protocol compliance and governance." },
  alternates: { canonical: "/ap2" },
};

const FAQ = [
  { q: "What is AP2?", a: "AP2 is the Agent Payments Protocol led by Google and a coalition of over 60 organisations. It aims to standardise how agents initiate, authorise, and settle payments across platforms." },
  { q: "How does CSOAI support AP2?", a: "CSOAI provides partial support today through payment pre-checks, policy enforcement, and signed receipts. Full AP2 mandate support is on the roadmap." },
  { q: "How does AP2 relate to x402 and Stripe ACP?", a: "AP2 is a broader protocol for agent payments. x402 handles per-call HTTP payments, Stripe ACP handles ChatGPT-style agent commerce, and AP2 ties them into a common authorisation framework." },
];

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "Protocols", item: "https://csoai.org/protocols" },
    { "@type": "ListItem", position: 3, name: "AP2", item: "https://csoai.org/ap2" },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

export default function Ap2Page() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="mx-auto max-w-4xl px-4 py-20">
        <div className="mb-6 inline-block rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-400">Partial support</div>
        <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">AP2</h1>
        <p className="mb-12 max-w-2xl text-lg text-slate-400">Agent Payments Protocol. CSOAI provides payment pre-checks, policy enforcement, and signed receipts for AP2-style agent commerce today, with full mandate support coming.</p>

        <div className="mb-16 grid gap-4 md:grid-cols-3">
          {[{ t: "Authorise", d: "Agent payment intent is authorised against policy." }, { t: "Settle", d: "Settlement occurs via AP2, x402, or Stripe ACP rails." }, { t: "Attest", d: "A signed receipt is recorded on the audit chain." }].map((x) => (
            <div key={x.t} className="rounded-2xl border border-white/10 bg-white/5 p-6"><h3 className="mb-2 text-lg font-bold text-emerald-400">{x.t}</h3><p className="text-sm text-slate-400">{x.d}</p></div>
          ))}
        </div>

        <div className="flex gap-4">
          <Link href="/mcp-packs" className="rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-600">Agentic Finance Pack →</Link>
          <Link href="/protocols" className="rounded-xl border border-white/10 px-6 py-3 font-medium transition hover:bg-white/5">All protocols</Link>
        </div>

        <section className="mt-16"><h2 className="mb-6 text-2xl font-bold">Frequently asked questions</h2><div className="space-y-3">{FAQ.map((f) => (<details key={f.q} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm"><summary className="cursor-pointer font-bold">{f.q}</summary><p className="mt-2 leading-relaxed text-slate-400">{f.a}</p></details>))}</div></section>
      </div>
    </div>
  );
}
