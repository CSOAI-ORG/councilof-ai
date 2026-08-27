import { useEffect } from "react";

// AiGovernanceHub - pillar page that links the whole AI-governance cluster.
// Concentrates internal-link authority and gives answer engines a topic map.
import SovereignSpot from "../components/SovereignSpot";
type Link = { label: string; href: string };
type Group = { title: string; blurb: string; links: Link[] };
const GROUPS: Group[] = [
  { title: "Start here", blurb: "The big picture in five minutes.", links: [
    { label: "EU AI Act, explained", href: "/ai-act-summary" },
    { label: "Enforcement timeline", href: "/eu-ai-act-timeline" },
    { label: "Am I ready? (checklist)", href: "/eu-ai-act-checklist" },
  ]},
  { title: "What applies to you", blurb: "Scope, risk tiers, and obligations.", links: [
    { label: "What counts as high-risk", href: "/high-risk-ai-systems" },
    { label: "GPAI / model providers", href: "/gpai" },
    { label: "Penalty estimator", href: "/penalties" },
  ]},
  { title: "By sector", blurb: "Sector-specific high-risk uses.", links: [
    { label: "Healthcare AI", href: "/healthcare-ai-act" },
    { label: "Financial services AI", href: "/finance-ai-act" },
    { label: "Hiring + HR AI", href: "/hr-ai-act" },
  ]},
  { title: "Compare frameworks", blurb: "How the regimes line up.", links: [
    { label: "NIST AI RMF vs EU AI Act", href: "/nist-vs-eu-ai-act" },
    { label: "ISO 42001 vs EU AI Act", href: "/iso-42001-vs-eu-ai-act" },
    { label: "EU AI Act vs GDPR", href: "/eu-ai-act-vs-gdpr" },
  ]},
  { title: "US state laws", blurb: "The fast-moving US patchwork.", links: [
    { label: "Colorado AI Act", href: "/colorado-ai-act" },
    { label: "Texas TRAIGA", href: "/texas-ai-act" },
    { label: "California AI laws", href: "/california-ai-law" },
  ]},
  { title: "Tooling + alternatives", blurb: "Choosing an AI-governance platform.", links: [
    { label: "vs Vanta", href: "/vanta-alternative" },
    { label: "vs OneTrust", href: "/onetrust-alternative" },
    { label: "vs Credo AI", href: "/credo-ai-alternative" },
  ]},
  { title: "The CSOAI OS", blurb: "Put governance to work.", links: [
    { label: "Your Council assistant identity", href: "/sovereign" },
    { label: "The Council Globe", href: "/globe" },
    { label: "Choose your council", href: "/bft" },
    { label: "The Registry", href: "/registry" },
    { label: "Ask the Council", href: "/try" },
  ]},
];
export default function AiGovernanceHub() {
  useEffect(() => { document.title = "AI governance - the complete guide | CSOAI"; }, []);
  useEffect(() => {
    const sc = document.createElement("script");
    sc.type = "application/ld+json";
    sc.text = JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
      { "@type": "Question", "name": "What is AI governance?", "acceptedAnswer": { "@type": "Answer", "text": "AI governance is the set of policies, controls, and oversight an organisation uses to build and deploy AI responsibly and in line with laws and standards like the EU AI Act, NIST AI RMF, and ISO 42001." } },
      { "@type": "Question", "name": "What AI regulations do I need to comply with?", "acceptedAnswer": { "@type": "Answer", "text": "It depends on where you operate and what your AI does. Common regimes include the EU AI Act, US state laws (Colorado, Texas, California), and standards such as NIST AI RMF and ISO 42001. A single crosswalked program can cover many at once." } },
      { "@type": "Question", "name": "How do I get started with AI governance?", "acceptedAnswer": { "@type": "Answer", "text": "Start by mapping which laws apply, classifying your AI systems by risk, and running a readiness assessment. Then build the evidence - risk assessments, documentation, and oversight - once and crosswalk it across frameworks." } },
    ] });
    document.head.appendChild(sc);
    return () => { document.head.removeChild(sc); };
  }, []);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - the complete guide</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">AI governance, end to end</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">Every regulation, framework, sector, and tool in one map - from the EU AI Act to US state laws, NIST, and ISO 42001. Start anywhere; everything connects.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/ai-act-summary" className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-400">Start with the 5-minute guide -&gt;</a>
            <a href="/readiness" className="rounded-xl border border-emerald-300/60 px-5 py-2.5 text-sm font-semibold text-emerald-50 hover:bg-white/10">Run a readiness scan -&gt;</a>
          </div>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {GROUPS.map((g) => (
            <div key={g.title} className="rounded-2xl border border-gray-200 p-6">
              <div className="text-lg font-bold text-gray-900">{g.title}</div>
              <p className="mt-1 text-sm text-gray-500">{g.blurb}</p>
              <ul className="mt-4 space-y-2">
                {g.links.map((l) => (
                  <li key={l.href}><a href={l.href} className="text-sm font-semibold text-emerald-700 hover:underline">{l.label} -&gt;</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-[#03110b] py-10"><div className="mx-auto max-w-5xl px-6">
        <SovereignSpot topic="AI governance — which frameworks apply and how to comply" layer="frameworks" suggest="Where do I start with AI governance for my organisation?" />
      </div></section>
    </div>
  );
}
