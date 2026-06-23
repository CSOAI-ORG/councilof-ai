import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Trust Center",
  description:
    "CSOAI Trust Center: security architecture, identity and revocation, audit anchoring, subprocessor list, and certifications roadmap.",
  openGraph: {
    title: "CSOAI Trust Center",
    description: "Security architecture, identity, audit anchoring, subprocessors, and certifications roadmap.",
    images: ["/api/og?title=Trust%20Center&desc=Security%20architecture%2C%20identity%2C%20audit%20anchoring%2C%20subprocessors%2C%20and%20certifications%20roadmap."],
  },
  alternates: { canonical: "/trust" },
};

const subprocessors = [
  { name: "Vercel", purpose: "Web hosting and edge functions", region: "EU / US" },
  { name: "Stripe", purpose: "Payment processing", region: "US" },
  { name: "GitHub", purpose: "Source code and open-source distribution", region: "US" },
  { name: "MongoDB Atlas", purpose: "Data persistence", region: "EU" },
  { name: "Polygon", purpose: "Audit anchor chain", region: "Global" },
];

const roadmap = [
  { cert: "SOC 2 Type II", status: "In progress", target: "Q4 2026" },
  { cert: "ISO 42001", status: "Roadmap", target: "Q1 2027" },
  { cert: "ISO 27001", status: "Roadmap", target: "Q2 2027" },
  { cert: "eIDAS QES timestamps", status: "Available on request", target: "Now" },
];

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "Trust Center", item: "https://csoai.org/trust" },
  ],
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CSOAI LTD",
  url: "https://csoai.org",
  sameAs: ["https://github.com/CSOAI-ORG"],
};

export default function TrustPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <div className="mx-auto max-w-4xl px-4 py-20">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
          Security & compliance
        </div>
        <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">Trust Center</h1>
        <p className="mb-12 text-lg text-slate-400">
          CSOAI is built to be verifiable. Here is how we handle identity, audit anchoring, subprocessors, and
          certifications.
        </p>

        <div className="mb-12 grid gap-6 sm:grid-cols-2">
          {[
            { title: "Identity & revocation", desc: "`did:csoai` uses Ed25519 keypairs. Revocation lists are published and verifiable without contacting CSOAI." },
            { title: "Audit anchoring", desc: "Compliance events are anchored on an immutable chain with optional RFC 3161 and eIDAS QES timestamps." },
            { title: "Encryption", desc: "Data in transit uses TLS 1.3. Data at rest is encrypted with AES-256." },
            { title: "Access control", desc: "Role-based access, MFA, and least-privilege infrastructure policies." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="mb-2 font-bold text-emerald-400">{item.title}</h3>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>

        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold">Subprocessors</h2>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-slate-300">
                <tr>
                  <th className="px-6 py-3 font-bold">Provider</th>
                  <th className="px-6 py-3 font-bold">Purpose</th>
                  <th className="px-6 py-3 font-bold">Region</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {subprocessors.map((s) => (
                  <tr key={s.name} className="bg-white/[0.02]">
                    <td className="px-6 py-3 text-white">{s.name}</td>
                    <td className="px-6 py-3 text-slate-400">{s.purpose}</td>
                    <td className="px-6 py-3 text-slate-400">{s.region}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold">Security whitepaper</h2>
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:flex-row sm:items-center">
            <div>
              <p className="mb-1 font-bold text-white">Download the CSOAI security whitepaper</p>
              <p className="text-sm text-slate-400">
                Architecture, threat model, key management, audit anchoring, subprocessors, and certifications roadmap.
              </p>
            </div>
            <a
              href="/whitepapers/csoai-security-whitepaper.md"
              download
              className="shrink-0 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              Download whitepaper
            </a>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold">Certifications roadmap</h2>
          <div className="space-y-3">
            {roadmap.map((r) => (
              <div key={r.cert} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                <span className="font-medium text-white">{r.cert}</span>
                <span className="text-sm text-slate-400">
                  {r.status} · {r.target}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8">
          <h2 className="mb-4 text-2xl font-bold">Need our security questionnaire?</h2>
          <p className="mb-6 text-slate-300">
            We provide RFI responses, architecture diagrams, and penetration-test summaries under NDA. Contact us for
            a security pack.
          </p>
          <Link href="mailto:security@csoai.org" className="inline-block rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-600">
            Contact security@csoai.org
          </Link>
        </div>
      </div>
    </div>
  );
}
