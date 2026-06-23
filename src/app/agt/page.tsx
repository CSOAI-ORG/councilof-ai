import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Microsoft AGT",
  description:
    "Microsoft Agent Gateway Transfer (AGT) governance for AI agents. CSOAI tracks AGT as an emerging enterprise gateway protocol and will bridge it to the Layer 0 council.",
  openGraph: { title: "CSOAI Microsoft AGT", description: "Agent gateway transfer governance and bridge." },
  alternates: { canonical: "/agt" },
};

const FAQ = [
  { q: "What is Microsoft AGT?", a: "Agent Gateway Transfer (AGT) is Microsoft&apos;s emerging protocol for securely transferring agents and their context across gateway boundaries in enterprise environments." },
  { q: "How does CSOAI bridge AGT?", a: "CSOAI will provide an AGT gateway adapter that verifies agent identity, checks council policy, and signs a transfer attestation before the gateway allows passage." },
  { q: "Is AGT production-ready?", a: "AGT is on the CSOAI watch-list. We monitor Microsoft&apos;s announcements and will ship a bridge when the protocol specification is public and stable." },
];

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "Protocols", item: "https://csoai.org/protocols" },
    { "@type": "ListItem", position: 3, name: "Microsoft AGT", item: "https://csoai.org/agt" },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

export default function AgtPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="mx-auto max-w-4xl px-4 py-20">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-500/20 bg-slate-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Watch-list</div>
        <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">Microsoft AGT</h1>
        <p className="mb-12 max-w-2xl text-lg text-slate-400">Agent Gateway Transfer. CSOAI is tracking Microsoft&apos;s enterprise agent transfer protocol and will bridge it to the Layer 0 council when specifications stabilise.</p>

        <div className="mb-16 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-2 text-lg font-bold text-emerald-400">Enterprise bridge planned</h3>
          <p className="text-sm text-slate-400">The bridge will verify agent identity, evaluate council policy, and sign a transfer attestation before allowing gateway passage.</p>
        </div>

        <div className="flex gap-4">
          <Link href="/protocols" className="rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-600">All protocols →</Link>
        </div>

        <section className="mt-16"><h2 className="mb-6 text-2xl font-bold">Frequently asked questions</h2><div className="space-y-3">{FAQ.map((f) => (<details key={f.q} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm"><summary className="cursor-pointer font-bold">{f.q}</summary><p className="mt-2 leading-relaxed text-slate-400">{f.a}</p></details>))}</div></section>
      </div>
    </div>
  );
}
