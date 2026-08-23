import { useEffect } from "react";
import EnforcementTimeline from "../components/EnforcementTimeline";

// /crosswalk — the single most citable public asset CSOAI owns: an open,
// crawlable map of how 13 global AI-governance frameworks align to 8 universal
// controls. schema.org Dataset + FAQPage JSON-LD so answer engines can cite it.
// Indicative references — the signed, article-level crosswalk runs in the OS.

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

const FAQ = [
  { q: "What is an AI governance framework crosswalk?", a: "A crosswalk maps the overlapping requirements of different regulations and standards to a single set of controls, so that implementing one control satisfies the equivalent obligation in every framework it maps to — you comply once and evidence everywhere." },
  { q: "Which frameworks does the CSOAI crosswalk cover?", a: "13+ including the EU AI Act, NIST AI RMF, ISO/IEC 42001, DORA, NIS2, GDPR, ISO 27001, SOC 2, HIPAA, MiCA, PCI DSS, the Cyber Resilience Act (CRA), and China TC260 — mapped to 8 universal AI-governance controls." },
  { q: "How does a crosswalk save time on EU AI Act compliance?", a: "Most EU AI Act obligations (risk management, data governance, transparency, oversight, documentation) already overlap with ISO 42001 and NIST AI RMF. Mapping them means existing controls can be reused as evidence rather than rebuilt, cutting duplicate work ahead of the 2 August 2026 enforcement date." },
  { q: "Is the CSOAI crosswalk verifiable?", a: "Yes — the signed, article-level crosswalk runs as a governed MCP tool inside the CSOAI OS and every output can be sealed to Layer 0 (Ed25519) for an auditable, reproducible record." },
];

function days(to: string) { return Math.max(0, Math.ceil((new Date(to + "T00:00:00Z").getTime() - Date.now()) / 86400000)); }

export default function Crosswalk() {
  useEffect(() => { document.title = "AI governance framework crosswalk — 13 frameworks × 8 controls | CSOAI"; }, []);
  const fwParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("fw") : null;
  const SLUG_MAP: Record<string, string> = { "eu-ai-act": "EU AI Act", "eu-ai-act-gpai": "EU AI Act", "eu-ai-act-highrisk": "EU AI Act", "nist-ai-rmf": "NIST AI RMF", "iso-42001": "ISO/IEC 42001", "dora": "DORA", "nis2": "NIS2", "gdpr": "GDPR", "gdpr-uk": "GDPR", "iso-27001": "ISO 27001", "soc-2": "SOC 2", "hipaa": "HIPAA", "mica": "MiCA", "pci-dss": "PCI DSS", "cra": "CRA", "tc260": "TC260" };
  const hi = new Set((fwParam ? fwParam.split(",") : []).map((s) => SLUG_MAP[s.trim().toLowerCase()]).filter(Boolean) as string[]);
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Dataset", name: "CSOAI AI Governance Framework Crosswalk", description: "Open crosswalk mapping 13 global AI-governance frameworks (EU AI Act, NIST AI RMF, ISO 42001, DORA, NIS2, GDPR, and more) to 8 universal controls.", keywords: ["EU AI Act", "NIST AI RMF", "ISO 42001", "AI governance", "compliance crosswalk", "DORA", "NIS2"], creator: { "@type": "Organization", name: "CSOAI", url: "https://csoai.org" }, license: "https://opensource.org/licenses/MIT", url: "https://csoai.org/crosswalk" },
      { "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    ],
  };

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="mx-auto max-w-5xl px-6 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">Open · crawlable · citable</p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">The AI governance <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">framework crosswalk.</span></h1>
        <p className="mt-4 max-w-3xl text-lg text-emerald-100/80">How published AI-governance and adjacent frameworks map to shared controls. Comply once, evidence everywhere. The signed, article-level version runs inside <a href="/?lobby=home" className="text-emerald-300 underline">Council OS</a>.</p>

        {/* EU AI Act staggered-application timeline (branded, date-accurate) */}
        <div className="mt-5 rounded-2xl border border-emerald-500/15 bg-[#03110b]/60 p-3">
          <p className="mb-1 px-2 font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/70">EU AI Act — staggered application</p>
          <EnforcementTimeline className="w-full" />
        </div>

        {hi.size > 0 && (
          <div className="mt-5 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm">
            <span className="font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/70">Tailored view · frameworks in scope for this account</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">{[...hi].map((f) => <span key={f} className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-bold text-[#03110b]">{f}</span>)}</div>
            <p className="mt-1.5 text-[11px] text-emerald-300/60">Comply once across these → evidence everywhere. Highlighted columns below.</p>
          </div>
        )}

        {/* the crosswalk matrix */}
        <div tabIndex={0} role="region" aria-label="Framework crosswalk matrix (scrollable)" className="mt-8 overflow-x-auto rounded-2xl border border-emerald-500/20">
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
          <a href="/assess" className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-[#03110b] hover:bg-emerald-400">Get your signed assessment →</a>
          <a href="/classifier" className="rounded-xl border border-emerald-500/30 px-5 py-3 text-sm font-semibold text-emerald-100 hover:bg-white/5">Classify your AI system →</a>
          <a href="/tool-commons" className="rounded-xl border border-emerald-500/30 px-5 py-3 text-sm font-semibold text-emerald-100 hover:bg-white/5">Run the live crosswalk tool →</a>
          <a href="/compare" className="rounded-xl border border-emerald-500/30 px-5 py-3 text-sm font-semibold text-emerald-100 hover:bg-white/5">CSOAI vs Vanta / Drata / Credo →</a>
        </div>

        {/* FAQ (matches JSON-LD) */}
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
