/**
 * Council · Law — region-aware AI law crosswalk.
 *
 * CSOAI maintains a live crosswalk of every major AI governance regime.
 * An agent governed to the Charter can be mapped to whichever framework
 * a region demands — and re-mapped when it crosses a border.
 */

import { motion } from "framer-motion";
import CouncilNav from "@/components/CouncilNav";

const REGIONS = [
  {
    code: "EU",
    name: "European Union",
    flag: "🇪🇺",
    primary: "EU AI Act (Reg 2024/1689)",
    deadline: "2 Aug 2026 (Art 50), 2 Dec 2026 (legacy generative), 2 Dec 2027 (Annex III)",
    key_articles: [
      "Art 9 (risk mgmt)",
      "Art 13 (transparency)",
      "Art 14 (human oversight)",
      "Art 50 (AI content labelling)",
    ],
    penalty: "€35M or 7% of global turnover",
    color: "blue",
  },
  {
    code: "UK",
    name: "United Kingdom",
    flag: "🇬🇧",
    primary: "AI Bill (in Parliament)",
    deadline: "2026 (anticipated)",
    key_articles: [
      "Frontier model evaluations",
      "Cybersecurity duties",
      "Transparency",
    ],
    penalty: "TBD",
    color: "indigo",
  },
  {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    primary: "NIST AI RMF + state laws (Colorado, California)",
    deadline: "Colorado ADMT: 1 Jan 2027",
    key_articles: [
      "NIST AI RMF Govern/Map/Measure/Manage",
      "Colorado SB24-205 (high-risk AI)",
    ],
    penalty: "State-level: varies; FTC: $50K+ per violation",
    color: "red",
  },
  {
    code: "CA",
    name: "Canada",
    flag: "🇨🇦",
    primary: "AIDA (Artificial Intelligence Data Act)",
    deadline: "TBD (in legislative process)",
    key_articles: [
      "High-impact AI system obligations",
      "Bias mitigation",
    ],
    penalty: "TBD (administrative monetary penalties)",
    color: "rose",
  },
  {
    code: "APAC",
    name: "Asia-Pacific",
    flag: "🌏",
    primary:
      "Singapore Agentic AI Guidance + China Interim Measures + Japan AI Promotion Act + Korea AI Basic Act",
    deadline: "various",
    key_articles: [
      "Singapore: Model AI Governance Framework v2",
      "China: Algorithm Recommendation Provisions",
    ],
    penalty: "varies by jurisdiction",
    color: "amber",
  },
  {
    code: "GLOBAL",
    name: "Global / Cross-border",
    flag: "🌐",
    primary: "ISO/IEC 42001 + UNESCO AI Ethics + OECD AI Principles + Council of Europe AI Convention",
    deadline: "ongoing",
    key_articles: [
      "AIMS controls (ISO)",
      "Human rights + dignity (UNESCO)",
      "Trustworthy AI (OECD)",
    ],
    penalty: "Cert revocation; treaty obligations",
    color: "emerald",
  },
];

const COLOR_CLASSES: Record<string, string> = {
  blue: "from-blue-500/20 to-blue-600/5 border-blue-500/30",
  indigo: "from-indigo-500/20 to-indigo-600/5 border-indigo-500/30",
  red: "from-red-500/20 to-red-600/5 border-red-500/30",
  rose: "from-rose-500/20 to-rose-600/5 border-rose-500/30",
  amber: "from-amber-500/20 to-amber-600/5 border-amber-500/30",
  emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/30",
};

export default function CouncilLaw() {
  return (
    <>
      <CouncilNav />
      <main className="max-w-7xl mx-auto px-4 py-16">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className="text-amber-400 text-xs font-bold tracking-widest uppercase mb-3">
            Council · Law
          </p>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tighter mb-4">
            Region-aware AI law
          </h1>
          <p className="text-slate-400 max-w-3xl">
            CSOAI maintains a live crosswalk of every major AI governance
            regime. An agent governed to the Charter can be mapped to
            whichever framework a region demands — and re-mapped when it
            crosses a border.
          </p>
        </motion.header>

        {/* Charter callout */}
        <div className="mb-12 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/5 border border-emerald-500/30">
          <h2 className="text-2xl font-bold mb-2">The 52-Article Partnership Charter</h2>
          <p className="text-sm text-slate-300">
            The hub that connects all 6 regions. CSOAI&apos;s Charter is the
            pivot — 22 articles shared between EU AI Act and NIST AI RMF, 18
            between EU and UK, 15 between EU and APAC, 8 between every region.
            When in doubt, default to the Charter.
          </p>
        </div>

        {/* Region cards */}
        <h2 className="text-2xl font-bold mb-6">6 regions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {REGIONS.map((region) => (
            <div
              key={region.code}
              className={`p-6 rounded-2xl bg-gradient-to-br ${COLOR_CLASSES[region.color]} border hover:scale-[1.02] transition`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{region.flag}</span>
                <div>
                  <h3 className="text-xl font-bold">{region.name}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {region.code}
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold text-white mb-1">{region.primary}</p>
              <p className="text-xs text-slate-400 mb-3">⏰ {region.deadline}</p>
              <div className="space-y-1 mb-3">
                {region.key_articles.map((art, i) => (
                  <p key={i} className="text-xs text-slate-300 font-mono">
                    · {art}
                  </p>
                ))}
              </div>
              <p className="text-xs">
                <span className="text-slate-500">Penalty:</span>{" "}
                <span className="text-rose-400 font-mono">{region.penalty}</span>
              </p>
            </div>
          ))}
        </div>

        {/* Charter article link */}
        <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20">
          <p className="text-sm text-slate-300">
            The MEOK LAW MCP exposes these as{" "}
            <code className="font-mono text-xs">law_overview()</code>,{" "}
            <code className="font-mono text-xs">law_applicable(region, entity)</code>,{" "}
            <code className="font-mono text-xs">law_crosswalk(from, to)</code>,{" "}
            <code className="font-mono text-xs">law_social_contract(entity, region)</code>,
            and{" "}
            <code className="font-mono text-xs">law_register(name, type, region, operator)</code>.
            {" "}Full bundle at{" "}
            <a className="text-amber-400 hover:underline" href="https://meok.ai/law">
              meok.ai/law
            </a>
            .
          </p>
        </div>
      </main>
    </>
  );
}
