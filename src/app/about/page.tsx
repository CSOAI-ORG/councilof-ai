import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About CSOAI",
  description:
    "Learn about CSOAI's mission, vision, leadership team, 8-layer ecosystem, and commitment to institutional AI governance and safety.",
  openGraph: {
    title: "About CSOAI",
    description: "CSOAI mission and vision for global AI safety and governance.",
    images: ["/api/og?title=About%20CSOAI&desc=Mission%2C%20vision%2C%20and%20ecosystem"],
  },
  alternates: { canonical: "/about" },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CSOAI",
  url: "https://csoai.org",
  description: "The global standard for institutional AI governance and safety",
  foundingDate: "2026-01-04",
  founder: {
    "@type": "Person",
    name: "Nicholas Templeman",
  },
};

const mission = [
  {
    title: "Mission",
    text: "Establish institutional governance frameworks that ensure safe, trustworthy, and beneficial deployment of artificial intelligence systems globally.",
  },
  {
    title: "Vision",
    text: "A world where all AI systems operate transparently under Byzantine consensus governance, certified for safety and alignment with institutional values.",
  },
  {
    title: "Values",
    text: "Safety, transparency, accountability, institutional governance, Byzantine consensus, international cooperation, and continuous improvement in AI oversight.",
  },
];

const ecosystem = [
  { number: "1", title: "Standards", text: "CSOAI 52-article charter and governance framework" },
  { number: "2", title: "Security Testing", text: "AIdome red teaming and vulnerability assessment" },
  { number: "3", title: "Infrastructure", text: "Palantir classified, secure testing infrastructure" },
  { number: "4", title: "Frontier AI", text: "Anthropic safety-first AI systems development" },
  { number: "5", title: "Distribution", text: "DSRB certified system distribution" },
  { number: "6", title: "Finance", text: "Proof of AI tokenization for transparent verification" },
  { number: "7", title: "Workforce", text: "CASA, BMCC training and professional certification" },
  { number: "8", title: "Recognition", text: "BSI mutual recognition and international standards alignment" },
];

const stats = [
  { value: "207", label: "MCP Servers" },
  { value: "1,050+", label: "Compliance Tools" },
  { value: "30", label: "Framework Crosswalks" },
  { value: "10", label: "PyPI Packages" },
  { value: "108", label: "Days to EU AI Act" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <section className="mx-auto max-w-6xl px-4 py-20">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
          Organization
        </span>

        {/* Hero */}
        <div className="mb-24 grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">
              <span className="gradient-text">About CSOAI</span>
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-slate-300">
              The Council for the Safety of AI (CSOAI) is the institutional governance standard for AI safety.
              Founded January 4, 2026 by Nicholas Templeman, CSOAI Ltd delivers 207 MCP servers, a 30-framework
              compliance crosswalk, the Care Membrane safety framework, and the 52-article Partnership Charter. Our
              commercial arm is MEOK AI Labs (meok.ai).
            </p>
            <Link
              href="/contact"
              className="inline-flex rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              Learn More
            </Link>
          </div>

          <div className="flex justify-center">
            <svg
              width="400"
              height="400"
              viewBox="0 0 400 400"
              fill="none"
              className="drop-shadow-[0_0_30px_rgba(16,185,129,0.25)]"
            >
              <defs>
                <linearGradient id="aboutNodeFill" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
              <circle cx="200" cy="200" r="30" fill="url(#aboutNodeFill)" opacity="0.9">
                <animate attributeName="r" values="30;35;30" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="200" cy="200" r="80" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.3" />
              <g>
                <circle cx="200" cy="120" r="18" fill="#10b981" opacity="0.7" />
                <circle cx="280" cy="140" r="18" fill="#10b981" opacity="0.7" />
                <circle cx="280" cy="260" r="18" fill="#10b981" opacity="0.7" />
                <circle cx="200" cy="280" r="18" fill="#10b981" opacity="0.7" />
                <circle cx="120" cy="260" r="18" fill="#10b981" opacity="0.7" />
                <circle cx="120" cy="140" r="18" fill="#10b981" opacity="0.7" />
                <line x1="200" y1="200" x2="200" y2="120" stroke="#10b981" strokeWidth="1" opacity="0.4" />
                <line x1="200" y1="200" x2="280" y2="140" stroke="#10b981" strokeWidth="1" opacity="0.4" />
                <line x1="200" y1="200" x2="280" y2="260" stroke="#10b981" strokeWidth="1" opacity="0.4" />
                <line x1="200" y1="200" x2="200" y2="280" stroke="#10b981" strokeWidth="1" opacity="0.4" />
                <line x1="200" y1="200" x2="120" y2="260" stroke="#10b981" strokeWidth="1" opacity="0.4" />
                <line x1="200" y1="200" x2="120" y2="140" stroke="#10b981" strokeWidth="1" opacity="0.4" />
              </g>
              <circle cx="200" cy="200" r="130" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.2" />
              <g>
                <circle cx="200" cy="70" r="14" fill="#10b981" opacity="0.5" />
                <circle cx="296" cy="96" r="14" fill="#10b981" opacity="0.5" />
                <circle cx="330" cy="170" r="14" fill="#10b981" opacity="0.5" />
                <circle cx="296" cy="304" r="14" fill="#10b981" opacity="0.5" />
                <circle cx="200" cy="330" r="14" fill="#10b981" opacity="0.5" />
                <circle cx="104" cy="304" r="14" fill="#10b981" opacity="0.5" />
                <circle cx="70" cy="230" r="14" fill="#10b981" opacity="0.5" />
                <circle cx="104" cy="96" r="14" fill="#10b981" opacity="0.5" />
              </g>
              <circle cx="200" cy="200" r="170" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.15" />
              <g opacity="0.6">
                <circle cx="200" cy="200" r="20" fill="none" stroke="#10b981" strokeWidth="0.5" opacity="0.3" />
                <circle cx="200" cy="200" r="50" fill="none" stroke="#10b981" strokeWidth="0.5" opacity="0.2" />
                <circle cx="200" cy="200" r="100" fill="none" stroke="#10b981" strokeWidth="0.5" opacity="0.15" />
                <circle cx="200" cy="200" r="150" fill="none" stroke="#10b981" strokeWidth="0.5" opacity="0.1" />
              </g>
            </svg>
          </div>
        </div>

        {/* Mission & Vision */}
        <h2 className="mb-8 text-3xl font-black tracking-tight sm:text-4xl">
          <span className="gradient-accent">Mission & Vision</span>
        </h2>
        <div className="mb-24 grid gap-6 md:grid-cols-3">
          {mission.map((m) => (
            <div
              key={m.title}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-8 transition hover:-translate-y-2 hover:border-emerald-500/30 hover:bg-white/[0.05]"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-transparent opacity-0 transition group-hover:opacity-100" />
              <h3 className="mb-4 text-xl font-bold text-emerald-400">{m.title}</h3>
              <p className="leading-relaxed text-slate-300">{m.text}</p>
            </div>
          ))}
        </div>

        {/* Founder */}
        <h2 className="mb-8 text-3xl font-black tracking-tight sm:text-4xl">
          <span className="gradient-accent">Founder</span>
        </h2>
        <div className="mb-24 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center transition hover:-translate-y-2 hover:border-emerald-500/30">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-300 text-2xl font-bold text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              NT
            </div>
            <h3 className="text-lg font-bold text-white">Nicholas Templeman</h3>
            <p className="mb-4 text-sm font-semibold text-emerald-400">Founder & CEO, CSOAI Ltd</p>
            <p className="text-sm leading-relaxed text-slate-400">
              Sole founder of CSOAI and MEOK AI Labs. Built 207 MCP servers, the 30-framework compliance crosswalk,
              and the Care Membrane safety framework. Shipping the infrastructure that makes EU AI Act compliance
              achievable for organisations of every size.
            </p>
          </div>
        </div>

        {/* 8-Layer Ecosystem */}
        <div className="mb-24 rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-12">
          <h2 className="mb-4 text-center text-3xl font-black tracking-tight sm:text-4xl">
            <span className="gradient-accent">The 8-Layer CSOAI Ecosystem</span>
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-slate-400">
            CSOAI&apos;s comprehensive framework encompasses all aspects of AI governance from standards to certification
            to recognition:
          </p>

          <div className="mb-12 flex justify-center">
            <svg width="300" height="300" viewBox="0 0 300 300" fill="none">
              <defs>
                <linearGradient id="aboutRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <circle cx="150" cy="150" r="25" fill="#10b981" opacity="0.8" />
              <circle cx="150" cy="150" r="50" fill="none" stroke="url(#aboutRingGradient)" strokeWidth="8" />
              <circle cx="150" cy="150" r="75" fill="none" stroke="url(#aboutRingGradient)" strokeWidth="8" />
              <circle cx="150" cy="150" r="100" fill="none" stroke="url(#aboutRingGradient)" strokeWidth="8" />
              <circle cx="150" cy="150" r="125" fill="none" stroke="url(#aboutRingGradient)" strokeWidth="8" />
              <circle cx="150" cy="20" r="10" fill="#10b981" />
              <circle cx="256" cy="44" r="10" fill="#10b981" />
              <circle cx="280" cy="150" r="10" fill="#10b981" />
              <circle cx="256" cy="256" r="10" fill="#10b981" />
              <circle cx="150" cy="280" r="10" fill="#10b981" />
              <circle cx="44" cy="256" r="10" fill="#10b981" />
              <circle cx="20" cy="150" r="10" fill="#10b981" />
              <circle cx="44" cy="44" r="10" fill="#10b981" />
              <line x1="150" y1="150" x2="150" y2="20" stroke="#10b981" strokeWidth="1" opacity="0.3" />
              <line x1="150" y1="150" x2="256" y2="44" stroke="#10b981" strokeWidth="1" opacity="0.3" />
              <line x1="150" y1="150" x2="280" y2="150" stroke="#10b981" strokeWidth="1" opacity="0.3" />
              <line x1="150" y1="150" x2="256" y2="256" stroke="#10b981" strokeWidth="1" opacity="0.3" />
              <line x1="150" y1="150" x2="150" y2="280" stroke="#10b981" strokeWidth="1" opacity="0.3" />
              <line x1="150" y1="150" x2="44" y2="256" stroke="#10b981" strokeWidth="1" opacity="0.3" />
              <line x1="150" y1="150" x2="20" y2="150" stroke="#10b981" strokeWidth="1" opacity="0.3" />
              <line x1="150" y1="150" x2="44" y2="44" stroke="#10b981" strokeWidth="1" opacity="0.3" />
            </svg>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ecosystem.map((item) => (
              <div
                key={item.number}
                className="rounded-xl border-l-4 border-emerald-500 bg-white/[0.02] p-5 transition hover:translate-x-2 hover:bg-emerald-500/10"
              >
                <div className="mb-2 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-300 text-xs font-bold text-slate-950">
                    {item.number}
                  </span>
                  <h3 className="font-bold text-white">{item.title}</h3>
                </div>
                <p className="text-sm text-slate-400">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What We Have Built */}
        <div className="mb-24 rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.05] p-8 sm:p-12">
          <h2 className="mb-4 text-3xl font-black tracking-tight sm:text-4xl">
            <span className="gradient-accent">What We Have Built</span>
          </h2>
          <p className="mb-8 text-slate-300">CSOAI delivers real infrastructure for AI safety compliance:</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-emerald-500/20 bg-white/[0.02] p-6 text-center transition hover:-translate-y-1 hover:border-emerald-500/50 hover:bg-emerald-500/10"
              >
                <div className="mb-1 text-3xl font-black text-white">{s.value}</div>
                <div className="text-sm font-semibold text-emerald-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-8 sm:flex-row sm:p-10">
          <p className="text-lg font-medium text-slate-200">
            Learn more about CSOAI&apos;s mission and leadership.
          </p>
          <Link
            href="/contact"
            className="inline-flex rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            Get in Touch →
          </Link>
        </div>
      </section>
    </div>
  );
}
