import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "WIMSE",
  description:
    "Workload Identity in Multi-Service Environments (WIMSE) for AI agents. CSOAI monitors WIMSE developments for workload-to-workload authentication in the agentic economy.",
  openGraph: { title: "CSOAI WIMSE", description: "Workload identity for multi-service agent environments." },
  alternates: { canonical: "/wimse" },
};

const FAQ = [
  { q: "What is WIMSE?", a: "WIMSE is an IETF effort to standardise workload identity — how software workloads authenticate to each other in multi-service environments without human credentials." },
  { q: "Why does it matter for AI agents?", a: "Agents are workloads that call other workloads. WIMSE provides a standard way for these workloads to prove identity and establish secure sessions." },
  { q: "Is WIMSE supported today?", a: "WIMSE is on the CSOAI watch-list. We track the IETF drafts and will add native support as the standard stabilises." },
];

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "Protocols", item: "https://csoai.org/protocols" },
    { "@type": "ListItem", position: 3, name: "WIMSE", item: "https://csoai.org/wimse" },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

export default function WimsePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="mx-auto max-w-4xl px-4 py-20">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-500/20 bg-slate-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Watch-list</div>
        <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">WIMSE</h1>
        <p className="mb-12 max-w-2xl text-lg text-slate-400">Workload Identity in Multi-Service Environments. CSOAI is tracking this IETF standard for workload-to-workload authentication as agent ecosystems scale.</p>

        <div className="mb-16 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-2 text-lg font-bold text-emerald-400">On the roadmap</h3>
          <p className="text-sm text-slate-400">WIMSE is not yet finalised. CSOAI will integrate it into Layer 0 once the IETF drafts mature and reference implementations stabilise.</p>
        </div>

        <div className="flex gap-4">
          <Link href="/protocols" className="rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-600">All protocols →</Link>
        </div>

        <section className="mt-16"><h2 className="mb-6 text-2xl font-bold">Frequently asked questions</h2><div className="space-y-3">{FAQ.map((f) => (<details key={f.q} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm"><summary className="cursor-pointer font-bold">{f.q}</summary><p className="mt-2 leading-relaxed text-slate-400">{f.a}</p></details>))}</div></section>
      </div>
    </div>
  );
}
