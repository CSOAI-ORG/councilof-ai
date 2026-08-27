import { useEffect, useState } from "react";

// SectorsAtlas - maps the full CASA / CSOAI sector taxonomy onto the OS. Every sector
// resolves to its binding frameworks and the MEOK-law layers that reach it. Pick a
// domain, click a sector, see what governs it - the 47-industry classifier made visible.

type Sector = { name: string; frameworks: string[]; tier: "High" | "Limited" | "Minimal" };
type Domain = { id: string; name: string; sectors: Sector[] };

const DOMAINS: Domain[] = [
  { id: "health", name: "Health & Life Sciences", sectors: [
    { name: "Clinical diagnosis AI", frameworks: ["EU AI Act (high-risk)", "FDA SaMD", "HIPAA", "ISO 42001"], tier: "High" },
    { name: "Medical devices", frameworks: ["EU MDR", "FDA 510(k)", "IEC 62304"], tier: "High" },
    { name: "Drug discovery", frameworks: ["GxP", "NIST AI RMF", "ISO 42001"], tier: "Limited" },
    { name: "Health insurance underwriting", frameworks: ["EU AI Act (high-risk)", "NAIC Model Bulletin", "GDPR"], tier: "High" },
  ]},
  { id: "finance", name: "Financial Services", sectors: [
    { name: "Credit scoring", frameworks: ["EU AI Act (high-risk)", "ECOA / Reg B", "SR 11-7", "GDPR"], tier: "High" },
    { name: "Algorithmic trading", frameworks: ["MiFID II", "SEC Reg SCI", "NIST AI RMF"], tier: "Limited" },
    { name: "AML / fraud detection", frameworks: ["BSA/AML", "EU AI Act", "FATF"], tier: "Limited" },
    { name: "Robo-advice", frameworks: ["SEC IA Act", "MiFID II suitability", "FINRA"], tier: "Limited" },
  ]},
  { id: "public", name: "Public Sector & Justice", sectors: [
    { name: "Benefits eligibility", frameworks: ["EU AI Act (high-risk)", "Admin law / due process", "GDPR"], tier: "High" },
    { name: "Predictive policing", frameworks: ["EU AI Act (high-risk)", "Civil rights law", "CoE AI Treaty"], tier: "High" },
    { name: "Immigration / border", frameworks: ["EU AI Act (high-risk)", "Human rights law"], tier: "High" },
    { name: "Court risk assessment", frameworks: ["EU AI Act (high-risk)", "Due process", "State AI laws"], tier: "High" },
  ]},
  { id: "work", name: "Employment & HR", sectors: [
    { name: "Resume screening", frameworks: ["EU AI Act (high-risk)", "NYC LL 144", "EEOC", "GDPR"], tier: "High" },
    { name: "Performance / promotion", frameworks: ["EU AI Act (high-risk)", "EEOC", "Worker-AI directives"], tier: "High" },
    { name: "Workforce scheduling", frameworks: ["Labor law", "GDPR", "NIST AI RMF"], tier: "Limited" },
  ]},
  { id: "infra", name: "Critical Infrastructure", sectors: [
    { name: "Energy grid control", frameworks: ["NERC CIP", "EU AI Act", "IEC 62443"], tier: "High" },
    { name: "Water systems", frameworks: ["EPA rules", "EU AI Act", "NIST CSF"], tier: "High" },
    { name: "Telecom routing", frameworks: ["NIST CSF", "ENISA", "ISO 27001"], tier: "Limited" },
    { name: "Autonomous vehicles", frameworks: ["UNECE WP.29", "EU AI Act (high-risk)", "ISO 21448"], tier: "High" },
  ]},
  { id: "consumer", name: "Consumer & Media", sectors: [
    { name: "Recommender systems", frameworks: ["DSA", "EU AI Act (transparency)", "GDPR"], tier: "Limited" },
    { name: "Generative content", frameworks: ["EU AI Act (transparency)", "Copyright law", "C2PA"], tier: "Limited" },
    { name: "Chatbots / agents", frameworks: ["EU AI Act (transparency)", "FTC Act", "CCPA"], tier: "Limited" },
    { name: "Biometric ID", frameworks: ["EU AI Act (high-risk/banned)", "BIPA", "GDPR Art 9"], tier: "High" },
  ]},
  { id: "industry", name: "Industrial & Education", sectors: [
    { name: "Predictive maintenance", frameworks: ["ISO 42001", "NIST AI RMF", "IEC 62443"], tier: "Minimal" },
    { name: "Quality inspection", frameworks: ["ISO 9001", "ISO 42001"], tier: "Minimal" },
    { name: "Education / grading", frameworks: ["EU AI Act (high-risk)", "FERPA", "Student-data laws"], tier: "High" },
    { name: "Proctoring", frameworks: ["EU AI Act (high-risk)", "GDPR", "Disability law"], tier: "High" },
  ]},
  { id: "insurance", name: "Insurance & Actuarial", sectors: [
    { name: "Life & health underwriting", frameworks: ["EU AI Act (high-risk)", "NAIC Model Bulletin", "State insurance codes"], tier: "High" },
    { name: "Pricing & rating models", frameworks: ["NAIC Model Bulletin", "Colorado SB21-169", "Unfair trade practice law"], tier: "High" },
    { name: "Claims triage", frameworks: ["EU AI Act (limited)", "NAIC Model Bulletin", "Claims-handling rules"], tier: "Limited" },
    { name: "Fraud detection", frameworks: ["GDPR", "NIST AI RMF", "State insurance codes"], tier: "Limited" },
    { name: "Policyholder chat", frameworks: ["EU AI Act (transparency)", "ISO 42001"], tier: "Minimal" },
  ]},
  { id: "agri", name: "Agriculture & Food", sectors: [
    { name: "Crop yield prediction", frameworks: ["ISO 42001", "NIST AI RMF"], tier: "Minimal" },
    { name: "Precision spraying", frameworks: ["EU Machinery Regulation", "ISO 42001", "Pesticide-use law"], tier: "Limited" },
    { name: "Livestock monitoring", frameworks: ["ISO 42001", "Animal welfare law"], tier: "Minimal" },
    { name: "Food safety inspection", frameworks: ["HACCP", "FDA FSMA", "EU General Food Law"], tier: "Limited" },
    { name: "Supply-chain traceability", frameworks: ["EU Deforestation Regulation", "ISO 22005", "FSMA Rule 204"], tier: "Limited" },
    { name: "Commodity trading models", frameworks: ["MiFID II", "CFTC rules", "ISO 42001"], tier: "Limited" },
  ]},
];

const TONE: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Limited: "bg-amber-100 text-amber-700",
  Minimal: "bg-emerald-100 text-emerald-700",
};

export default function SectorsAtlas() {
  useEffect(() => { document.title = "Sector Atlas - 47 industries mapped onto the OS | CSOAI"; }, []);
  const [d, setD] = useState("health");
  const [open, setOpen] = useState<string | null>(null);
  const domain = DOMAINS.find((x) => x.id === d) || DOMAINS[0];
  const total = DOMAINS.reduce((a, x) => a + x.sectors.length, 0);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - sector atlas</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Every sector, mapped onto the OS</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">The 47-industry classifier made visible. Pick a domain, click a sector, and see the frameworks that bind it and the risk tier it carries. From clinical AI to predictive policing to recommender systems - the whole CASA taxonomy in one place.</p>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-wrap gap-2">
          {DOMAINS.map((x) => (
            <button key={x.id} onClick={() => { setD(x.id); setOpen(null); }} className={"rounded-full border px-4 py-2 text-sm font-semibold transition-colors " + (d === x.id ? "border-emerald-400 bg-emerald-600 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>{x.name}</button>
          ))}
        </div>
        <div className="mt-2 text-xs text-gray-400">{domain.sectors.length} sectors in this domain - {total}+ mapped across the OS</div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {domain.sectors.map((s) => {
            const isOpen = open === s.name;
            return (
              <div key={s.name} className="rounded-2xl border border-gray-200 overflow-hidden">
                <button onClick={() => setOpen(isOpen ? null : s.name)} className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-slate-50">
                  <span className="font-bold text-gray-900">{s.name}</span>
                  <span className={"shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold " + (TONE[s.tier] || "bg-gray-100 text-gray-600")}>{s.tier} risk</span>
                </button>
                {isOpen && (
                  <div className="border-t border-gray-100 px-5 py-4">
                    <div className="text-xs font-bold uppercase tracking-wide text-gray-400">Binding frameworks</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {s.frameworks.map((f) => <span key={f} className="rounded-md bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-800">{f}</span>)}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-sm">
                      <a href="/try" className="font-bold text-emerald-700 hover:text-emerald-600">Ask the Council -&gt;</a>
                      <a href="/meok-law" className="font-semibold text-emerald-700 hover:text-emerald-600">Law by jurisdiction -&gt;</a>
                      <a href="/temples" className="font-semibold text-emerald-700 hover:text-emerald-600">Framework temples -&gt;</a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          This atlas shows representative sectors per domain. The live classifier resolves any product description to its exact tier and full framework set, then routes it through the Council of AI. Bring yours at <a href="/try" className="font-semibold underline">/try</a> or find your full sector playbook at <a href="/playbooks" className="font-semibold underline">/playbooks</a>.
        </div>
      </section>
    </div>
  );
}
