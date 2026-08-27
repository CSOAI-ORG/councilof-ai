import { useEffect } from "react";

// AltPage - data-driven "CSOAI alternative to X" page (vanta / onetrust / credo).
import SovereignSpot from "../components/SovereignSpot";
// Positioning reflects public market positioning as of June 2026; fair + defensible,
// not disparaging. FAQPage JSON-LD for answer engines. Zero external deps.

type Row = { dim: string; csoai: string; them: string };
type Comp = { key: string; name: string; their: string; rows: Row[]; faqs: { q: string; a: string }[] };
const COMPS: Record<string, Comp> = {
  vanta: {
    key: "vanta", name: "Vanta", their: "Security-compliance automation (SOC 2 / ISO 27001), with AI features added on top",
    rows: [
      { dim: "Primary origin", csoai: "AI-governance-native", them: "Security + SOC 2 compliance" },
      { dim: "EU AI Act (2 Aug 2026)", csoai: "Built around it: checklist, GPAI, penalties, sector pages", them: "Covered as one framework among many" },
      { dim: "Decision governance", csoai: "Council of AI - multi-agent consensus, Ed25519-signed verdicts", them: "Control monitoring + automation" },
      { dim: "Multi-framework evidence", csoai: "EU AI Act + NIST + ISO 42001 + FedRAMP, one crosswalked base", them: "Broad security/privacy framework library" },
      { dim: "Openness", csoai: "Open-patent at openpatent.ai - forkable", them: "Proprietary SaaS" },
    ],
    faqs: [
      { q: "Is CSOAI an alternative to Vanta?", a: "For AI governance specifically, yes. Vanta excels at security-compliance automation (SOC 2, ISO 27001); CSOAI is purpose-built for AI governance - EU AI Act readiness, multi-framework crosswalks, and multi-agent decision governance." },
      { q: "Can CSOAI and Vanta be used together?", a: "Yes. Many teams keep a security-compliance tool for SOC 2 and add CSOAI for AI-specific obligations like the EU AI Act, GPAI documentation, and model-decision governance." },
    ],
  },
  onetrust: {
    key: "onetrust", name: "OneTrust", their: "Privacy, GRC, and data-governance platform, with AI governance modules",
    rows: [
      { dim: "Primary origin", csoai: "AI-governance-native", them: "Privacy + GRC + data governance" },
      { dim: "EU AI Act (2 Aug 2026)", csoai: "Built around it: checklist, GPAI, penalties, sector pages", them: "Part of a broad GRC suite" },
      { dim: "Decision governance", csoai: "Council of AI - multi-agent consensus, Ed25519-signed verdicts", them: "Policy + assessment workflows" },
      { dim: "Multi-framework evidence", csoai: "EU AI Act + NIST + ISO 42001 + FedRAMP, one crosswalked base", them: "Extensive privacy + GRC framework coverage" },
      { dim: "Openness", csoai: "Open-patent at openpatent.ai - forkable", them: "Proprietary SaaS" },
    ],
    faqs: [
      { q: "Is CSOAI an alternative to OneTrust?", a: "For AI governance, yes. OneTrust is a broad privacy/GRC platform; CSOAI is focused on AI-specific governance - EU AI Act readiness, multi-framework crosswalks, and consensus-based decision governance." },
      { q: "Does CSOAI replace a privacy program?", a: "No. CSOAI complements privacy/GRC tooling by adding AI-specific obligations and model-decision governance on top of your existing data-protection program." },
    ],
  },
  credo: {
    key: "credo", name: "Credo AI", their: "AI-governance-native platform focused on policy, oversight, and reporting",
    rows: [
      { dim: "Primary origin", csoai: "AI-governance-native", them: "AI-governance-native" },
      { dim: "EU AI Act (2 Aug 2026)", csoai: "Checklist, GPAI, penalties, sector pages, live countdown", them: "AI-Act policy + assessment coverage" },
      { dim: "Decision governance", csoai: "Council of AI - multi-agent consensus, Ed25519-signed verdicts", them: "Policy packs + governance reporting" },
      { dim: "Multi-framework evidence", csoai: "EU AI Act + NIST + ISO 42001 + FedRAMP, one crosswalked base", them: "AI-governance frameworks + policy" },
      { dim: "Openness", csoai: "Open-patent at openpatent.ai - forkable", them: "Proprietary SaaS" },
    ],
    faqs: [
      { q: "Is CSOAI an alternative to Credo AI?", a: "Yes - both are AI-governance-native. CSOAI differentiates with a designed multi-agent Council (measured status on our public Refutation Ledger), Ed25519-signed verdicts, and an open-patent model." },
      { q: "What makes CSOAI different from other AI-governance tools?", a: "The Council of AI: instead of a single model deciding, a configurable multi-agent council reaches consensus and signs every verdict - and the topology is published open-patent at openpatent.ai." },
    ],
  },
};

export default function AltPage({ comp }: { comp: string }) {
  const c = COMPS[comp] || COMPS.vanta;
  useEffect(() => { document.title = "CSOAI: the " + c.name + " alternative for AI governance | CSOAI"; }, [c.name]);
  useEffect(() => {
    const sc = document.createElement("script");
    sc.type = "application/ld+json";
    sc.text = JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": c.faqs.map((f) => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })) });
    document.head.appendChild(sc);
    return () => { document.head.removeChild(sc); };
  }, [c.key]);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-5xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - the {c.name} alternative</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Looking for a {c.name} alternative for AI governance?</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">{c.name} is known for {c.their}. CSOAI is purpose-built for AI governance - EU AI Act readiness, multi-framework crosswalks, and consensus-based decision governance. Here is the honest comparison.</p>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="overflow-hidden rounded-2xl border border-gray-200">
          <div className="grid grid-cols-3 bg-slate-50 text-xs font-bold uppercase tracking-wide text-gray-500">
            <div className="px-4 py-3">Dimension</div><div className="px-4 py-3">CSOAI</div><div className="px-4 py-3">{c.name}</div>
          </div>
          {c.rows.map((r, i) => (
            <div key={r.dim} className={"grid grid-cols-3 text-sm " + (i % 2 ? "bg-white" : "bg-gray-50/50")}>
              <div className="px-4 py-3 font-semibold text-gray-900">{r.dim}</div>
              <div className="px-4 py-3 text-emerald-800">{r.csoai}</div>
              <div className="px-4 py-3 text-gray-600">{r.them}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-3">
          {c.faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-gray-200 p-5">
              <div className="font-bold text-gray-900">{f.q}</div>
              <p className="mt-1 text-sm text-gray-600">{f.a}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-gray-400">Comparison reflects each vendor's public market positioning as of June 2026. Verify current capabilities directly with each provider. Not affiliated with or endorsed by {c.name}.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/compare" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">Full comparison matrix -&gt;</a>
          <a href="/try" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Try the Council -&gt;</a>
          <a href="/eu-ai-act-checklist" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">2 Aug 2026 checklist -&gt;</a>
        </div>
      </section>
      <section className="bg-[#03110b] py-10"><div className="mx-auto max-w-5xl px-6">
        <SovereignSpot topic={"choosing CSOAI vs " + c.name} layer="regulators" suggest={"Where does " + c.name + " fall short and how does CSOAI cover it?"} />
      </div></section>
    </div>
  );
}
