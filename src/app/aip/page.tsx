import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "IETF AIP",
  description:
    "IETF Agent Identity Protocol (AIP) governance for AI agents. CSOAI provides signed agent credentials, attestation tokens, and cross-domain identity verification.",
  openGraph: { title: "CSOAI IETF AIP", description: "Agent identity protocol with signed credentials and attestations." },
  alternates: { canonical: "/aip" },
};

const FAQ = [
  { q: "What is IETF AIP?", a: "The IETF Agent Identity Protocol is an emerging standard for representing, issuing, and verifying agent identity credentials in a way that works across vendors and platforms." },
  { q: "How does CSOAI use AIP?", a: "CSOAI issues AIP-compatible credentials for every certified agent. These credentials include the agent&apos;s DID, capability claims, and current certification status." },
  { q: "Can AIP credentials be revoked?", a: "Yes. CSOAI maintains a revocation registry tied to the council audit chain. Verifiers can check revocation status without contacting CSOAI directly." },
];

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "Protocols", item: "https://csoai.org/protocols" },
    { "@type": "ListItem", position: 3, name: "IETF AIP", item: "https://csoai.org/aip" },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

export default function AipPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="mx-auto max-w-4xl px-4 py-20">
        <div className="mb-6 inline-block rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">Layer 0 Protocol</div>
        <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">IETF Agent Identity Protocol</h1>
        <p className="mb-12 max-w-2xl text-lg text-slate-400">Cross-platform agent identity credentials. CSOAI issues AIP-compatible identity tokens bound to did:csoai and signed by the BFT council.</p>

        <div className="mb-16 grid gap-4 md:grid-cols-3">
          {[{ t: "Issue", d: "CSOAI issues signed credentials for certified agents." }, { t: "Verify", d: "Any party can verify the credential against the public council key." }, { t: "Revoke", d: "Revocation status is published to the audit chain." }].map((x) => (
            <div key={x.t} className="rounded-2xl border border-white/10 bg-white/5 p-6"><h3 className="mb-2 text-lg font-bold text-emerald-400">{x.t}</h3><p className="text-sm text-slate-400">{x.d}</p></div>
          ))}
        </div>

        <div className="flex gap-4">
          <Link href="/verify" className="rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-600">Verify a credential →</Link>
          <Link href="/protocols" className="rounded-xl border border-white/10 px-6 py-3 font-medium transition hover:bg-white/5">All protocols</Link>
        </div>

        <section className="mt-16"><h2 className="mb-6 text-2xl font-bold">Frequently asked questions</h2><div className="space-y-3">{FAQ.map((f) => (<details key={f.q} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm"><summary className="cursor-pointer font-bold">{f.q}</summary><p className="mt-2 leading-relaxed text-slate-400">{f.a}</p></details>))}</div></section>
      </div>
    </div>
  );
}
