import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Governance by Simulation",
  description:
    "CSOAI is building a 47-agent AI town that simulates governance before it becomes law. The world's first living, AI-governed digital sovereign state.",
  openGraph: {
    title: "Governance by Simulation — The 47-Agent Town",
    description: "Simulate compliance before it becomes law. 47 agents, 12 industries, one living governance engine.",
    images: ["/api/og?title=Governance%20by%20Simulation&desc=47%20agents%2C%2012%20industries%2C%20one%20living%20governance%20engine."],
  },
  alternates: { canonical: "/town" },
};

const industries = [
  "Finance",
  "Healthcare",
  "Manufacturing",
  "Energy",
  "Transport",
  "Education",
  "Legal",
  "Defence",
  "Retail",
  "Agriculture",
  "Government",
  "Research",
];

const stack = [
  { name: "a16z AI Town", role: "Agent behaviour engine", license: "MIT" },
  { name: "Unreal Engine 5.8", role: "Visual simulation layer", license: "Free" },
  { name: "DeepSeek API", role: "Cost-efficient reasoning", license: "API" },
  { name: "CARLA", role: "Autonomous vehicle physics", license: "MIT" },
  { name: "MuJoCo", role: "Humanoid + robotics simulation", license: "Apache 2.0" },
  { name: "CSOAI MCP Mesh", role: "290+ governance servers", license: "Open source" },
];

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
        { "@type": "ListItem", position: 2, name: "Town", item: "https://csoai.org/town" },
      ],
    },
    {
      "@type": "WebPage",
      name: "Governance by Simulation",
      description: "CSOAI's 47-agent AI town simulates governance before it becomes law.",
    },
  ],
};

export default function TownPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            The Simulation
          </div>
          <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">
            Governance by <span className="text-emerald-400">Simulation</span>
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-slate-400 sm:text-xl">
            Your competitors sell certificates. We are building a living, AI-governed digital sovereign state — 47
            autonomous agents across 12 industries, simulating compliance before it becomes law.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/town/3d"
              className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              Enter the 3D town
            </Link>
            <Link
              href="/simulation"
              className="rounded-lg border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              View live dashboard
            </Link>
          </div>
        </div>

        <div className="mb-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { value: "47", label: "Autonomous agents" },
            { value: "12", label: "Industry domains" },
            { value: "1,000+", label: "Scenarios" },
            { value: "0", label: "Competitors with this" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <p className="text-4xl font-black text-emerald-400">{s.value}</p>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        <section className="mb-20">
          <h2 className="mb-8 text-center text-2xl font-bold">What the town simulates</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "EU AI Act compliance",
                desc: "Agents deploy AI systems and the town measures whether they stay inside high-risk, limited-risk, or prohibited boundaries.",
              },
              {
                title: "DORA operational resilience",
                desc: "Financial agents experience outages and cyber events; the town records resilience evidence for all 22,000 EU entities.",
              },
              {
                title: "Cross-border handoffs",
                desc: "An agent trained in the EU crosses into US, UK, or CN jurisdiction. The town resolves conflicting framework requirements.",
              },
              {
                title: "Shadow AI detection",
                desc: "Ungoverned agents appear in the town. The BFT Council votes on containment and issues a public Watchdog Certificate.",
              },
              {
                title: "Autonomous vehicle safety",
                desc: "CARLA vehicles navigate the town while safety agents audit every decision against ISO 26262 and AI Act expectations.",
              },
              {
                title: "Humanoid worker governance",
                desc: "MuJoCo humanoids perform tasks; oversight agents enforce human-in-the-loop rules and log every action on-chain.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="mb-2 font-bold text-emerald-400">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-20">
          <h2 className="mb-8 text-center text-2xl font-bold">Industry domains</h2>
          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {industries.map((i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm font-medium text-slate-300"
              >
                {i}
              </div>
            ))}
          </div>
        </section>

        <section className="mb-20">
          <h2 className="mb-8 text-center text-2xl font-bold">Open stack</h2>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-slate-300">
                <tr>
                  <th className="px-6 py-3 font-bold">Component</th>
                  <th className="px-6 py-3 font-bold">Role</th>
                  <th className="px-6 py-3 font-bold">License</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stack.map((s) => (
                  <tr key={s.name} className="bg-white/[0.02]">
                    <td className="px-6 py-3 text-white">{s.name}</td>
                    <td className="px-6 py-3 text-slate-400">{s.role}</td>
                    <td className="px-6 py-3 text-slate-400">{s.license}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-20 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="mb-2 text-xl font-bold">Read the white paper</h2>
              <p className="text-sm text-slate-400">
                Governance by Simulation: How 47 Autonomous Agents Outperform Manual Compliance Assessment.
              </p>
            </div>
            <a
              href="/whitepapers/governance-by-simulation.md"
              download
              className="shrink-0 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              Download white paper
            </a>
          </div>
        </section>

        <div className="mb-20 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold">Run the scaffold</h2>
          <p className="mx-auto mb-6 max-w-2xl text-slate-300">
            The SOV Town engine is open source. Spawn 47 agents, run EU AI Act and DORA scenarios, and export signed
            attestations today.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="https://github.com/CSOAI-ORG/sov-town"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              View sov-town on GitHub ↗
            </a>
            <a
              href="/whitepapers/governance-by-simulation.md"
              download
              className="rounded-lg border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Download white paper
            </a>
          </div>
        </div>

        <div className="mb-20 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold">Why this changes everything</h2>
          <p className="mx-auto mb-6 max-w-2xl text-slate-300">
            Compliance platforms check boxes after the fact. CSOAI simulates the future — testing governance against
            thousands of scenarios before a single regulator writes a rule. That turns reactive audit prep into
            predictive sovereign infrastructure.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/contact"
              className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              Join the town waitlist
            </Link>
            <Link
              href="/intelligence"
              className="rounded-lg border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              See the intelligence
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600">
          The 47-agent town is in active development. This page describes the vision and the open stack. Demo videos and
          white papers will be published as milestones ship.
        </p>
      </div>
    </div>
  );
}
