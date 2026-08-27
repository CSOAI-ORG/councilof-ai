import { useEffect } from "react";
import EnforcementTimeline from "../components/EnforcementTimeline";

// /crosswalk — East-West v1 canon: open, crawlable map of published AI-governance
// frameworks to a shared control set. schema.org Dataset + FAQPage JSON-LD.
// Determination stays with authorities; mapping is not certification.

const FRAMEWORKS = ["EU AI Act", "NIST AI RMF", "ISO/IEC 42001", "DORA", "NIS2", "GDPR", "ISO 27001", "SOC 2", "HIPAA", "MiCA", "PCI DSS", "CRA", "TC260"];
const CONTROLS: { c: string; refs: Record<string, string> }[] = [
  { c: "Risk management", refs: { "EU AI Act": "Art. 9", "NIST AI RMF": "MAP/MEASURE", "ISO/IEC 42001": "6.1 / 8.2", "DORA": "Art. 5–6", "NIS2": "Art. 21", "CRA": "Annex I" } },
  { c: "Data governance", refs: { "EU AI Act": "Art. 10", "NIST AI RMF": "MAP 2", "ISO/IEC 42001": "Annex A (data)", "GDPR": "Art. 5–6", "HIPAA": "164.514", "TC260": "5.x" } },
  { c: "Transparency & disclosure", refs: { "EU AI Act": "Art. 13 / 50", "NIST AI RMF": "GOVERN 4", "ISO/IEC 42001": "Annex A (transparency)", "GDPR": "Art. 13–14", "TC260": "labelling" } },
  { c: "Human oversight", refs: { "EU AI Act": "Art. 14", "NIST AI RMF": "GOVERN 2", "ISO/IEC 42001": "Annex A (oversight)", "DORA": "Art. 5" } },
  { c: "Accountability & governance", refs: { "EU AI Act": "Art. 17", "NIST AI RMF": "GOVERN 1", "ISO/IEC 42001": "5.1–5.3", "SOC 2": "CC1", "NIS2": "Art. 20" } },
  { c: "Security & resilience", refs: { "EU AI Act": "Art. 15", "NIST AI RMF": "MANAGE 4", "ISO 27001": "A.5–A.8", "DORA": "Art. 9", "NIS2": "Art. 21", "PCI DSS": "Req. 6", "CRA": "Annex I", "MiCA": "Art. 68" } },
  { c: "Bias & fairness", refs: { "EU AI Act": "Art. 10 / Annex III", "NIST AI RMF": "MEASURE 2.11", "ISO/IEC 42001": "Annex A (impact)", "GDPR": "Art. 22" } },
  { c: "Documentation & records", refs: { "EU AI Act": "Art. 11–12 / Annex IV", "NIST AI RMF": "GOVERN 1.4", "ISO/IEC 42001": "7.5", "SOC 2": "CC2", "DORA": "Art. 28 (RoI)" } },
];

const EU_ROWS = [
  { ref: "Art. 9", control: "Risk management system", mapped: "Risk management" },
  { ref: "Art. 10", control: "Data and data governance", mapped: "Data governance" },
  { ref: "Art. 11", control: "Technical documentation", mapped: "Documentation & records" },
  { ref: "Art. 12", control: "Record-keeping", mapped: "Documentation & records" },
  { ref: "Art. 13", control: "Transparency and provision of information", mapped: "Transparency & disclosure" },
  { ref: "Art. 14", control: "Human oversight", mapped: "Human oversight" },
  { ref: "Art. 15", control: "Accuracy, robustness and cybersecurity", mapped: "Security & resilience" },
];

const UK_ROWS = [
  { ref: "DRCF 1", control: "Safety & security", mapped: "Security & resilience" },
  { ref: "DRCF 2", control: "Transparency & explainability", mapped: "Transparency & disclosure" },
  { ref: "DRCF 3", control: "Fairness", mapped: "Bias & fairness" },
  { ref: "DRCF 4", control: "Accountability & governance", mapped: "Accountability & governance" },
  { ref: "DRCF 5", control: "Contestability & redress", mapped: "Human oversight" },
];

const IL_ROWS = [
  { ref: "SB 315", control: "Impact assessment", mapped: "Risk management", clock: "Audits from 1 Jan 2028" },
  { ref: "SB 315", control: "Documentation of AI systems", mapped: "Documentation & records", clock: "Audits from 1 Jan 2028" },
  { ref: "SB 315", control: "Bias & discrimination testing", mapped: "Bias & fairness", clock: "Audits from 1 Jan 2028" },
  { ref: "SB 315", control: "Cybersecurity controls", mapped: "Security & resilience", clock: "Audits from 1 Jan 2028" },
];

const CN_ROWS = [
  { ref: "GB/T", control: "Algorithmic transparency / labelling", mapped: "Transparency & disclosure" },
  { ref: "GB/T", control: "Data security & cross-border transfer", mapped: "Data governance" },
  { ref: "GB/T", control: "Human-in-the-loop oversight", mapped: "Human oversight" },
  { ref: "GB/T", control: "Risk assessment & monitoring", mapped: "Risk management" },
];

const FAQ = [
  { q: "What is an AI governance framework crosswalk?", a: "A crosswalk maps the overlapping requirements of different regulations and standards to a single set of controls, so that implementing one control satisfies the equivalent obligation in every framework it maps to — you map once and evidence everywhere. Determination stays with authorities; the crosswalk is a map, not a certificate." },
  { q: "Which frameworks does the CSOAI crosswalk cover?", a: "Published frameworks including the EU AI Act (Art. 9–15), UK DRCF alignment, Illinois SB 315, China GB/T (TC260 alignment — honest mapping, not equivalence claims), NIST AI RMF, ISO/IEC 42001, DORA, NIS2, GDPR, and more — mapped to a shared control set." },
  { q: "How does a crosswalk save time on EU AI Act compliance?", a: "Most EU AI Act obligations (risk management, data governance, transparency, oversight, documentation) already overlap with ISO 42001 and NIST AI RMF. Mapping them means existing controls can be reused as evidence rather than rebuilt, cutting duplicate work ahead of enforcement dates." },
  { q: "Is the CSOAI crosswalk verifiable?", a: "Yes — the signed, article-level crosswalk runs as a governed MCP tool inside Council OS and every output can be sealed to Layer 0 (Ed25519) for an auditable, reproducible record. Machine-readable v1: /crosswalk/east-west-v1.json." },
];

function JurisdictionTable({ title, subtitle, rows }: { title: string; subtitle?: string; rows: { ref: string; control: string; mapped: string; clock?: string }[] }) {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-black text-emerald-100">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-emerald-100/70">{subtitle}</p>}
      <div className="mt-3 overflow-x-auto rounded-xl border border-emerald-500/20">
        <table className="w-full border-collapse text-left text-[12px]">
          <thead>
            <tr className="bg-[#05140d]">
              <th className="px-3 py-2 font-bold">Reference</th>
              <th className="px-3 py-2 font-bold">Obligation</th>
              <th className="px-3 py-2 font-bold">Mapped control</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.ref + row.control} className={i % 2 ? "bg-white/[0.02]" : ""}>
                <td className="px-3 py-2 font-mono text-emerald-300/90 whitespace-nowrap">{row.ref}{row.clock ? ` · ${row.clock}` : ""}</td>
                <td className="px-3 py-2 text-emerald-100/85">{row.control}</td>
                <td className="px-3 py-2 text-emerald-200/70">{row.mapped}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Crosswalk() {
  useEffect(() => { document.title = "AI governance framework crosswalk | Council of AI"; }, []);
  const fwParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("fw") : null;
  const SLUG_MAP: Record<string, string> = { "eu-ai-act": "EU AI Act", "eu-ai-act-gpai": "EU AI Act", "eu-ai-act-highrisk": "EU AI Act", "nist-ai-rmf": "NIST AI RMF", "iso-42001": "ISO/IEC 42001", "dora": "DORA", "nis2": "NIS2", "gdpr": "GDPR", "gdpr-uk": "GDPR", "iso-27001": "ISO 27001", "soc-2": "SOC 2", "hipaa": "HIPAA", "mica": "MiCA", "pci-dss": "PCI DSS", "cra": "CRA", "tc260": "TC260" };
  const hi = new Set((fwParam ? fwParam.split(",") : []).map((s) => SLUG_MAP[s.trim().toLowerCase()]).filter(Boolean) as string[]);
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Dataset", name: "CSOAI AI Governance Framework Crosswalk", description: "Open crosswalk mapping published AI-governance frameworks (EU AI Act Art. 9–15, UK DRCF, Illinois SB 315, China GB/T, NIST AI RMF, ISO 42001, and more) to a shared control set.", keywords: ["EU AI Act", "NIST AI RMF", "ISO 42001", "AI governance", "East-West crosswalk", "DORA", "NIS2"], creator: { "@type": "Organization", name: "CSOAI", url: "https://councilof.ai" }, license: "https://opensource.org/licenses/MIT", url: "https://councilof.ai/crosswalk" },
      { "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    ],
  };

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="mx-auto max-w-5xl px-6 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">Open · crawlable · citable · East-West v1</p>
        <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">The AI governance <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">framework crosswalk.</span></h1>
        <p className="mt-4 max-w-3xl text-lg text-emerald-100/80">How published AI-governance and adjacent compliance frameworks map to a shared control set. Map once, evidence everywhere. The signed, article-level version runs inside <a href="/?lobby=home" className="text-emerald-300 underline">Council OS</a>.</p>

        <div className="mt-5 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <strong>Determination stays with authorities.</strong> This crosswalk maps obligations across regimes; it is not a conformity opinion, certificate, or legal verdict. Measurement, not certification.
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <a href="/east-west/" className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-emerald-500/20">East-West flagship →</a>
          <a href="/crosswalk/east-west-v1.json" className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-200/90 hover:bg-white/5">v1 JSON →</a>
          <a href="/challenge/" className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-200/90 hover:bg-white/5">Challenge a mapping →</a>
        </div>

        <div className="mt-5 rounded-2xl border border-emerald-500/15 bg-[#03110b]/60 p-3">
          <p className="mb-1 px-2 font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/70">EU AI Act — staggered application</p>
          <EnforcementTimeline className="w-full" />
        </div>

        {hi.size > 0 && (
          <div className="mt-5 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm">
            <span className="font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/70">Tailored view · frameworks in scope for this account</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">{[...hi].map((f) => <span key={f} className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-bold text-[#03110b]">{f}</span>)}</div>
            <p className="mt-1.5 text-[11px] text-emerald-300/60">Map once across these → evidence everywhere. Highlighted columns below.</p>
          </div>
        )}

        <JurisdictionTable title="EU — AI Act high-risk obligations (Art. 9–15)" rows={EU_ROWS} />
        <JurisdictionTable title="UK — DRCF AI alignment principles" subtitle="Roadmap alignment with EU AI Act; not a substitute for UK AI Bill obligations." rows={UK_ROWS} />
        <JurisdictionTable title="US — Illinois SB 315" subtitle="AI governance audit requirements — clocked for audits from 1 January 2028." rows={IL_ROWS} />
        <JurisdictionTable title="China — GB/T (TC260 alignment)" subtitle="Honest line: mapping to GB/T is measurement alignment, not equivalence to TC260 or MIIT certification." rows={CN_ROWS} />

        <div tabIndex={0} role="region" aria-label="Framework crosswalk matrix (scrollable)" className="mt-10 overflow-x-auto rounded-2xl border border-emerald-500/20">
          <p className="bg-[#05140d] px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-emerald-300/70">Shared control set — multi-framework matrix</p>
          <table className="w-full border-collapse text-left text-[12px]">
            <thead>
              <tr className="bg-[#05140d]">
                <th className="sticky left-0 z-10 bg-[#05140d] px-3 py-2 font-bold text-emerald-100">Control</th>
                {FRAMEWORKS.map((f) => <th key={f} className={"px-2 py-2 font-semibold whitespace-nowrap " + (hi.has(f) ? "bg-emerald-500/25 text-emerald-100" : "text-emerald-300/80")}>{f}</th>)}
              </tr>
            </thead>
            <tbody>
              {CONTROLS.map((row, i) => (
                <tr key={row.c} className={i % 2 ? "bg-white/[0.02]" : ""}>
                  <td className="sticky left-0 z-10 bg-[#03110b] px-3 py-2 font-semibold text-emerald-100 whitespace-nowrap">{row.c}</td>
                  {FRAMEWORKS.map((f) => <td key={f} className={"px-2 py-2 whitespace-nowrap " + (hi.has(f) ? "bg-emerald-500/10 text-emerald-100" : "text-emerald-200/70")}>{row.refs[f] || <span className="text-emerald-300/20">·</span>}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-emerald-300/70">References are indicative and for orientation — not legal advice. The signed, verifiable article-level mapping runs as a governed tool in the OS. Verify against primary sources.</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/east-west/" className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-[#03110b] hover:bg-emerald-400">East-West flagship →</a>
          <a href="/assess" className="rounded-xl border border-emerald-500/30 px-5 py-3 text-sm font-semibold text-emerald-100 hover:bg-white/5">Get your signed assessment →</a>
          <a href="/gspc-verify/" className="rounded-xl border border-emerald-500/30 px-5 py-3 text-sm font-semibold text-emerald-100 hover:bg-white/5">Verify measurements →</a>
          <a href="/compare" className="rounded-xl border border-emerald-500/30 px-5 py-3 text-sm font-semibold text-emerald-100 hover:bg-white/5">CSOAI vs Vanta / Drata / Credo →</a>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-black">Frequently asked</h2>
          <div className="mt-4 space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="rounded-xl border border-emerald-500/20 bg-[#05140d] p-4">
                <summary className="cursor-pointer font-semibold text-emerald-100">{f.q}</summary>
                <p className="mt-2 text-sm leading-relaxed text-emerald-100/75">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
