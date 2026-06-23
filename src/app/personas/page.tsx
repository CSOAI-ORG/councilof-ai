import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CSOAI for every AI leader",
  description:
    "CSOAI for Chief Compliance Officers, CISOs, CTOs, and Chief Risk Officers. Persona-specific AI governance, safety, and compliance infrastructure.",
  openGraph: {
    title: "CSOAI for every AI leader",
    description: "Persona-specific AI governance for CCOs, CISOs, CTOs, and CROs.",
    images: ["/api/og?title=CSOAI%20for%20every%20AI%20leader&desc=Persona-specific%20AI%20governance%20for%20CCOs%2C%20CISOs%2C%20CTOs%2C%20and%20CROs."],
  },
  alternates: { canonical: "/personas" },
};

const personas = [
  {
    slug: "compliance-officer",
    title: "For Chief Compliance Officers",
    name: "Regulatory Mara",
    pain: "EU AI Act deadlines, scattered audit evidence, board pressure, fear of personal liability",
    needs: "Article 50 kit, FRIA support, signed attestations, public verify URLs, 13-framework crosswalk, simulation evidence",
    hook: "Produce a 49-page EU AI Act audit pack — and stress-test it in a 47-agent simulation before the regulator arrives.",
    tools: "Risk classifier, audit pack generator, framework crosswalk viewer, governance simulator",
    cta: "Explore Article 50 Kit",
    href: "/article-50-kit",
    color: "#a78bfa",
  },
  {
    slug: "ciso",
    title: "For CISOs",
    name: "Security Victor",
    pain: "Shadow AI, agents accessing sensitive data, no runtime enforcement, vendor claims without proof",
    needs: "BFT council governance, PDCA runtime policy, Watchdog monitoring, DID-based agent identity, red-team simulation",
    hook: "Runtime policy enforcement for every agent call — and a simulation town that red-teams breaches before they reach production.",
    tools: "Watchdog dashboard, agent identity explorer, MCP security audit, governance simulator",
    cta: "See security tools",
    href: "/protocols",
    color: "#f87171",
  },
  {
    slug: "cto",
    title: "For CTOs & Engineering Leaders",
    name: "Engineering Priya",
    pain: "Compliance slows shipping, custom governance plumbing, vendor lock-in, integration pain",
    needs: "MCP packs, SDK, open standards, protocol bridges, GitHub repos, simulation APIs",
    hook: "Drop governance into your agent stack with one pip install — then test it inside a living AI town.",
    tools: "MCP Packs, coai SDK, protocol bridges, GitHub Actions, governance simulator",
    cta: "Browse MCP Packs",
    href: "/mcp-packs",
    color: "#38bdf8",
  },
  {
    slug: "cro",
    title: "For Chief Risk Officers",
    name: "Sovereign Sarah",
    pain: "Big Tech dependence, regulatory fragmentation, reputational risk, need independent certification",
    needs: "Watchdog Certification, 52-Article Charter, BFT council, NATO-friendly standards, scenario modelling",
    hook: "Independent certification authority for the agentic economy — backed by a simulation that predicts failures before they happen.",
    tools: "Strategic readiness assessment, council governance simulator, framework coverage map, governance simulator",
    cta: "Explore Watchdog Certification",
    href: "/pricing",
    color: "#fbbf24",
  },
];

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "Personas", item: "https://csoai.org/personas" },
  ],
};

export default function PersonasPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Buyer personas
          </div>
          <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">CSOAI for every AI leader</h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            Different roles face different AI governance pressures. Here is how CSOAI solves each one.
          </p>
        </div>

        <div className="space-y-12">
          {personas.map((p) => (
            <div
              key={p.slug}
              id={p.slug}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 transition hover:border-emerald-500/30"
            >
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-white">{p.title}</h2>
                <span
                  className="rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                  style={{ borderColor: `${p.color}40`, color: p.color, backgroundColor: `${p.color}15` }}
                >
                  {p.name}
                </span>
              </div>

              <div className="mb-6 grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-bold text-slate-500 uppercase tracking-widest">Pain points</h3>
                  <p className="text-slate-300">{p.pain}</p>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-bold text-slate-500 uppercase tracking-widest">What they need</h3>
                  <p className="text-slate-300">{p.needs}</p>
                </div>
              </div>

              <blockquote className="mb-6 border-l-4 border-emerald-500 pl-4 text-lg italic text-slate-300">
                &ldquo;{p.hook}&rdquo;
              </blockquote>

              <div className="mb-6">
                <h3 className="mb-2 text-sm font-bold text-slate-500 uppercase tracking-widest">Key tools</h3>
                <p className="text-slate-400">{p.tools}</p>
              </div>

              <Link
                href={p.href}
                className="inline-block rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-600"
              >
                {p.cta} →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
