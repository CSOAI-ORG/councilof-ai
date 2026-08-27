import { useEffect, useState } from "react";

// Playbooks — the buyer's one-view answer. Pick your industry and see the whole
// governance picture: the AI scenario, its EU AI Act risk tier, the frameworks that
// apply, the CSOAI bridges that cover them, and the action steps. Ties the Council
// (/try), the relevance map (/map) and the temples (/temples) into one per-industry
// playbook — the surface that makes the fleet sellable.

type Tier = "Prohibited" | "High-risk" | "Limited" | "Minimal";
type Play = {
  id: string; name: string; glyph: string; scenario: string; tier: Tier;
  frameworks: string[]; bridges: string[]; steps: string[]; pitch: string;
};

const PLAYS: Play[] = [
  { id: "health", name: "Healthcare", glyph: "✚", scenario: "AI that triages, diagnoses, or recommends treatment from patient data.", tier: "High-risk",
    frameworks: ["EU AI Act Annex III", "HIPAA", "MDR/IVDR", "ISO 42001", "NIST AI RMF"],
    bridges: ["hl7-fhir-bridge", "dicom-bridge"],
    steps: ["Classify the system as High-Risk and open an Art. 9 risk file", "Bias-test across patient cohorts; document data governance (Art. 10)", "Wire human-oversight + logging via the HL7/FHIR bridge (Art. 12-14)", "Run a conformity assessment ahead of the Dec 2027 high-risk deadline (Digital Omnibus)"],
    pitch: "Govern clinical AI without re-platforming the EHR — the bridge carries the attestation." },
  { id: "finance", name: "Finance", glyph: "$", scenario: "AI for credit decisions, fraud detection, or insurance pricing.", tier: "High-risk",
    frameworks: ["EU AI Act Annex III", "DORA", "NIS2", "GDPR", "NIST AI RMF"],
    bridges: ["iso20022-bridge", "swift-bridge", "fix-bridge", "cobol-bridge"],
    steps: ["Treat credit/fraud models as High-Risk; map to Art. 9-15", "Stand up DORA ICT-risk governance + incident classification", "Bridge core/COBOL transactions with Ed25519 attestation", "Add contestability + meaningful human review for declines"],
    pitch: "DORA + EU AI Act in one pass — even the 1970s COBOL core gets governed, no rewrite." },
  { id: "gov", name: "Government", glyph: "⚑", scenario: "AI in public services, benefits, identity, or law enforcement.", tier: "High-risk",
    frameworks: ["EU AI Act Annex III", "eIDAS", "GDPR / LED", "NIS2"],
    bridges: ["x-road-bridge", "ldap-bridge"],
    steps: ["Map each citizen-facing system to Annex III high-risk uses", "Connect legacy registries via the X-Road pattern", "Enforce identity + access with did:csoai over LDAP/AD", "Publish transparency + appeal routes for affected citizens"],
    pitch: "The Estonia-proven X-Road pattern, governed end-to-end for the agentic era." },
  { id: "manufacturing", name: "Manufacturing", glyph: "⛭", scenario: "AI controlling or optimising industrial processes and safety systems.", tier: "High-risk",
    frameworks: ["IEC 62443", "NIS2", "EU AI Act", "ISO 42001"],
    bridges: ["scada-bridge", "modbus-bridge", "opcua-bridge"],
    steps: ["Segment OT/IT and map safety-relevant AI to High-Risk", "Bridge SCADA/Modbus/OPC-UA with policy gating before actuation", "Meet IEC 62443 zones + conduits; NIS2 incident reporting", "Log every machine-affecting decision, attested"],
    pitch: "OPC-UA/SCADA → governed actuation: the AI can't move a valve without passing the gate." },
  { id: "insurance", name: "Insurance", glyph: "☂", scenario: "AI for underwriting, pricing, and claims automation.", tier: "High-risk",
    frameworks: ["EU AI Act Annex III", "GDPR", "DORA", "NIST AI RMF"],
    bridges: ["iso20022-bridge", "edifact-bridge"],
    steps: ["Classify pricing/underwriting models as High-Risk", "Prove fairness across protected classes; document Art. 10 data", "Bridge policy/claims data with attestation", "Give policyholders a contestability path"],
    pitch: "Actuarial AI you can defend to a regulator — fairness evidence built in." },
  { id: "retail", name: "Retail & Consumer", glyph: "◐", scenario: "Recommendation engines, chatbots, and generative product content.", tier: "Limited",
    frameworks: ["EU AI Act Art. 50", "GDPR", "C2PA"],
    bridges: ["social-os", "edifact-bridge"],
    steps: ["Disclose AI interaction + label generated content (C2PA)", "Honour GDPR rights + easy opt-out of automated handling", "Cross-post governed content via the Social OS", "Re-assess tier if you add profiling or pricing AI"],
    pitch: "Ship the disclosure + provenance now — cheapest compliance insurance in retail." },
];

const TIER_TONE: Record<Tier, string> = {
  "Prohibited": "bg-red-100 text-red-800 border-red-300",
  "High-risk": "bg-amber-100 text-amber-800 border-amber-300",
  "Limited": "bg-sky-100 text-sky-800 border-sky-300",
  "Minimal": "bg-emerald-100 text-emerald-800 border-emerald-300",
};

export default function Playbooks() {
  useEffect(() => { document.title = "Industry Playbooks — for your sector, the whole picture · CSOAI"; }, []);
  const [open, setOpen] = useState("health");
  const p = PLAYS.find((x) => x.id === open) || PLAYS[0];

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI · industry playbooks</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">For your sector, the whole picture</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">Pick your industry. See the AI scenario, its risk tier, the frameworks that apply, the exact CSOAI bridges that cover them, and the steps to compliance — in one view.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {PLAYS.map((x) => (
              <button key={x.id} onClick={() => setOpen(x.id)} className={"rounded-full border px-4 py-2 text-sm font-semibold transition-colors " + (open === x.id ? "border-emerald-300 bg-emerald-400 text-[#03110b]" : "border-emerald-300/40 text-emerald-50 hover:bg-white/10")}>{x.glyph} {x.name}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-900 to-teal-800 p-6 text-white">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl">{p.glyph}</span>
              <div className="text-2xl font-black">{p.name}</div>
              <span className={"rounded-lg border px-3 py-1 text-xs font-bold " + TIER_TONE[p.tier]}>{p.tier}</span>
            </div>
            <p className="mt-3 max-w-3xl text-emerald-50/90">{p.scenario}</p>
          </div>
          <div className="p-6 grid gap-6 lg:grid-cols-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-gray-400">Frameworks that apply</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {p.frameworks.map((f) => <span key={f} className="rounded-md bg-gray-100 px-2.5 py-1 text-sm font-semibold text-gray-700">{f}</span>)}
              </div>
              <div className="mt-5 text-xs font-bold uppercase tracking-wide text-gray-400">CSOAI bridges that cover you</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {p.bridges.map((b) => <span key={b} className="rounded-md bg-emerald-50 px-2.5 py-1 text-sm font-mono font-semibold text-emerald-700">{b}</span>)}
              </div>
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{p.pitch}</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-gray-400">The action plan</div>
              <ol className="mt-2 space-y-2">
                {p.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 rounded-xl border border-gray-200 p-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">{i + 1}</span>
                    <span className="text-sm text-gray-700 leading-snug">{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="border-t border-gray-100 p-6 flex flex-wrap gap-2">
            <a href="/try" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">Run a {p.name} question past the Council →</a>
            <a href="/map" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">See {p.name} on the relevance map →</a>
            <a href="/temples" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Visit the framework temples →</a>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-5 text-xs text-gray-500 leading-relaxed">
          Each playbook is decision-support, not legal advice — it maps the most common sector scenario to its likely obligations and the CSOAI components that address them. The live version generates a tailored gap report and wires the bridges for your specific systems; it switches on with the Layer 0 backend. Start with the Council at <a href="/try" className="text-emerald-700 font-semibold">/try</a>.
        </div>
      </section>
    </div>
  );
}
