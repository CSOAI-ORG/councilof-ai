import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Council of Experts",
  description:
    "Meet the people behind CSOAI and the independent advisory council that guides our governance, standards, and research.",
  openGraph: {
    title: "CSOAI Council of Experts",
    description: "Experience, expertise, authoritativeness, and trustworthiness behind the Layer 0 standard.",
    images: ["/api/og?title=CSOAI%20Council%20of%20Experts&desc=Experience%2C%20expertise%2C%20authoritativeness%2C%20and%20trustworthiness%20behind%20the%20Layer%200%20standard."],
  },
  alternates: { canonical: "/council-of-experts" },
};

const founder = {
  name: "Nick Templeman",
  role: "Founder & CEO",
  bio: "Nick is the founder of CSOAI and the architect of the Layer 0 trust infrastructure for the agentic economy. A solo builder with deep experience in open-source compliance tooling, he has spent the last several years mapping AI governance across dozens of frameworks and jurisdictions so that organisations can certify AI safety without rebuilding their stack.",
  linkedin: "https://www.linkedin.com/in/nicktempleman",
  github: "https://github.com/CSOAI-ORG",
};

const advisoryDomains = [
  {
    title: "AI Safety & Robustness",
    description: "Evaluates model risk, red-teaming methodology, and safety-critical deployment practices.",
  },
  {
    title: "EU & International Regulation",
    description: "Advises on EU AI Act, NIS2, DORA, eIDAS 2.0, and cross-border regulatory convergence.",
  },
  {
    title: "Cybersecurity & Cryptography",
    description: "Guides Ed25519 attestation design, key management, and runtime enforcement architecture.",
  },
  {
    title: "AI Ethics & Society",
    description: "Reviews fairness, transparency, and human-in-the-loop safeguards across certification workflows.",
  },
  {
    title: "Enterprise Risk & Assurance",
    description: "Brings audit, SOC 2, ISO 42001, and NIST AI RMF practice into CSOAI templates and mappings.",
  },
];

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
        { "@type": "ListItem", position: 2, name: "Council of Experts", item: "https://csoai.org/council-of-experts" },
      ],
    },
    {
      "@type": "Organization",
      name: "CSOAI",
      url: "https://csoai.org",
      founder: {
        "@type": "Person",
        name: founder.name,
        jobTitle: founder.role,
        url: founder.linkedin,
        sameAs: [founder.linkedin, founder.github],
      },
    },
  ],
};

export default function CouncilOfExpertsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="mx-auto max-w-5xl px-4 py-20">
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            EAT
          </div>
          <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">Council of Experts</h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            CSOAI is built and guided by people with demonstrated expertise in AI safety, governance, cryptography, and
            regulatory assurance.
          </p>
        </div>

        <section className="mb-20">
          <h2 className="mb-8 text-center text-sm font-black uppercase tracking-widest text-slate-500">Leadership</h2>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="grid md:grid-cols-[280px_1fr]">
              <div className="flex items-center justify-center border-b border-white/10 bg-emerald-500/10 p-8 md:border-b-0 md:border-r">
                <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-emerald-500/30 bg-slate-900 text-4xl font-black text-emerald-400">
                  NT
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold">{founder.name}</h3>
                <p className="mb-4 text-sm font-bold text-emerald-400">{founder.role}</p>
                <p className="mb-6 text-slate-300">{founder.bio}</p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={founder.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
                  >
                    LinkedIn ↗
                  </a>
                  <a
                    href={founder.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
                  >
                    GitHub ↗
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-20">
          <h2 className="mb-8 text-center text-sm font-black uppercase tracking-widest text-slate-500">Advisory Council</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {advisoryDomains.map((d) => (
              <div
                key={d.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              >
                <h3 className="mb-2 text-lg font-bold text-white">{d.title}</h3>
                <p className="mb-4 text-sm text-slate-400">{d.description}</p>
                <span className="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Seat open
                </span>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center">
            <p className="mb-4 text-slate-300">
              We are recruiting independent advisors who want to shape the Layer 0 standard for AI safety.
            </p>
            <Link
              href="/contact"
              className="inline-flex rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              Apply to the Council
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <h2 className="mb-6 text-center text-2xl font-bold">Why EAT matters</h2>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            {[
              { title: "Experience", desc: "Hands-on building of governance tooling, audit workflows, and production AI systems." },
              { title: "Expertise", desc: "Deep knowledge across 30+ frameworks, 6 jurisdictions, and agentic infrastructure." },
              { title: "Authoritativeness", desc: "Publicly verifiable certificates, open protocols, and cited regulatory sources." },
              { title: "Trustworthiness", desc: "Signed attestations, transparent subprocessors, and independent council review." },
            ].map((e) => (
              <div key={e.title} className="text-center">
                <h3 className="mb-2 font-bold text-emerald-400">{e.title}</h3>
                <p className="text-sm text-slate-400">{e.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
