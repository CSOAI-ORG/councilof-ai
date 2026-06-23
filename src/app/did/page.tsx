import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "W3C DID v1.1",
  description:
    "Decentralized Identifiers (DID) governance for AI agents. CSOAI issues did:csoai — a sovereign, cryptographically verifiable identity for every agent in the economy.",
  openGraph: { title: "CSOAI W3C DID v1.1", description: "Sovereign decentralized identifiers for AI agents." },
  alternates: { canonical: "/did" },
};

const FAQ = [
  { q: "What is a DID?", a: "A Decentralized Identifier (DID) is a self-sovereign identifier that does not require a central registry. It is controlled by the subject through cryptographic keys and can be resolved to a DID document." },
  { q: "What is did:csoai?", a: "did:csoai is CSOAI&apos;s DID method. Every agent, council node, and certification receives a did:csoai identifier with an Ed25519 keypair and a resolvable DID document." },
  { q: "How does DID relate to A2A and MCP?", a: "DIDs provide the identity layer. When an A2A agent handshakes or an MCP server is invoked, the DID proves which agent or tool is acting and lets the policy engine enforce rules." },
];

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "Protocols", item: "https://csoai.org/protocols" },
    { "@type": "ListItem", position: 3, name: "W3C DID v1.1", item: "https://csoai.org/did" },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

export default function DidPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="mx-auto max-w-4xl px-4 py-20">
        <div className="mb-6 inline-block rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">Layer 0 Protocol</div>
        <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">W3C DID v1.1</h1>
        <p className="mb-12 max-w-2xl text-lg text-slate-400">Decentralized Identifiers give every AI agent a sovereign, cryptographically verifiable identity. CSOAI issues did:csoai as the root identity for agents, councils, and certificates.</p>

        <div className="mb-16 grid gap-4 md:grid-cols-3">
          {[{ t: "Self-sovereign", d: "No central registry controls the identifier." }, { t: "Cryptographic", d: "Keys and proofs are bound to the DID document." }, { t: "Resolvable", d: "DID documents can be resolved offline or via CSOAI nodes." }].map((x) => (
            <div key={x.t} className="rounded-2xl border border-white/10 bg-white/5 p-6"><h3 className="mb-2 text-lg font-bold text-emerald-400">{x.t}</h3><p className="text-sm text-slate-400">{x.d}</p></div>
          ))}
        </div>

        <div className="flex gap-4">
          <Link href="/council" className="rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-600">Explore the Council →</Link>
          <Link href="/protocols" className="rounded-xl border border-white/10 px-6 py-3 font-medium transition hover:bg-white/5">All protocols</Link>
        </div>

        <section className="mt-16"><h2 className="mb-6 text-2xl font-bold">Frequently asked questions</h2><div className="space-y-3">{FAQ.map((f) => (<details key={f.q} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm"><summary className="cursor-pointer font-bold">{f.q}</summary><p className="mt-2 leading-relaxed text-slate-400">{f.a}</p></details>))}</div></section>
      </div>
    </div>
  );
}
