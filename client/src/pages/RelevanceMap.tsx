import { useEffect, useState } from "react";

// RelevanceMap — the topology of what governs what. Each CSOAI bridge/MCP maps to
// the frameworks (and industries/regions) it is relevant to. Pick your industry and
// the map renders: relevant bridges -> their frameworks, plus the coverage gaps.
// Pure SVG, rendered only on click — no always-on force-graph dependency on the
// zero-dep OS. Data model aligned with the M4 -> M2 relevance-maps pass-over.

type Bridge = { id: string; label: string; industries: string[]; frameworks: string[] };
const BRIDGES: Bridge[] = [
  { id: "iso20022", label: "iso20022-bridge", industries: ["Finance"], frameworks: ["DORA", "NIS2", "GDPR"] },
  { id: "swift", label: "swift-bridge", industries: ["Finance"], frameworks: ["DORA", "AML/CFT", "GDPR"] },
  { id: "fix", label: "fix-bridge", industries: ["Finance"], frameworks: ["MiFID II", "DORA"] },
  { id: "cobol", label: "cobol-bridge", industries: ["Finance", "Government"], frameworks: ["DORA", "SOX"] },
  { id: "hl7", label: "hl7-fhir-bridge", industries: ["Healthcare"], frameworks: ["HIPAA", "EU AI Act Annex III", "GDPR"] },
  { id: "dicom", label: "dicom-bridge", industries: ["Healthcare"], frameworks: ["HIPAA", "MDR"] },
  { id: "scada", label: "scada-bridge", industries: ["Energy & Infrastructure", "Manufacturing"], frameworks: ["NIS2", "IEC 62443"] },
  { id: "modbus", label: "modbus-bridge", industries: ["Energy & Infrastructure", "Manufacturing"], frameworks: ["IEC 62443", "NIS2"] },
  { id: "opcua", label: "opcua-bridge", industries: ["Manufacturing"], frameworks: ["IEC 62443", "EU AI Act"] },
  { id: "xroad", label: "x-road-bridge", industries: ["Government"], frameworks: ["eIDAS", "GDPR"] },
  { id: "ldap", label: "ldap-bridge", industries: ["Government", "Enterprise"], frameworks: ["GDPR", "NIS2"] },
  { id: "edi", label: "edifact-bridge", industries: ["Manufacturing", "Enterprise"], frameworks: ["GDPR", "Customs/UCC"] },
];

const INDUSTRIES = ["Finance", "Healthcare", "Energy & Infrastructure", "Government", "Manufacturing", "Enterprise"];
// frameworks every high-risk deployer should also expect, surfaced as gaps if no bridge covers them
const BASELINE = ["EU AI Act", "NIST AI RMF", "ISO 42001"];

const REGION_TAGS: Record<string, string[]> = {
  EU: ["EU AI Act", "GDPR", "DORA", "NIS2", "MDR", "eIDAS", "CRA", "Data Act", "MiCA", "PSD2", "CSRD", "MiFID"],
  US: ["SEC", "HIPAA", "NIST", "FDA", "CCPA", "GLBA", "SOX", "FERPA", "COPPA", "FTC", "NAIC", "CFTC"],
  Global: ["ISO", "IEC", "OECD", "UNESCO", "Basel", "SWIFT", "PCI"],
};

const REGIONS = ["All", "EU", "US", "Global"];

function inRegion(frameworks: string[], region: string) {
  if (region === "All") return true;
  const tags = REGION_TAGS[region] || [];
  return frameworks.some(function (f) {
    return tags.some(function (t) { return f.toUpperCase().indexOf(t.toUpperCase()) > -1; });
  });
}

export default function RelevanceMap() {
  useEffect(() => { document.title = "Relevance Map — what governs what · CSOAI"; }, []);
  const [industry, setIndustry] = useState<string | null>(null);
  const [region, setRegion] = useState<string>("All");

  const bridges = industry ? BRIDGES.filter((b) => b.industries.includes(industry) && inRegion(b.frameworks, region)) : [];
  const frameworks = Array.from(new Set(bridges.flatMap((b) => b.frameworks)));
  const gaps = BASELINE.filter((f) => !frameworks.includes(f));

  // svg layout
  const W = 920, rowH = 60, padTop = 40;
  const H = Math.max(bridges.length, frameworks.length, 1) * rowH + padTop + 40;
  const bx = 250, fx = 670, cx = 60;
  const by = (i: number) => padTop + 30 + i * ((H - padTop - 60) / Math.max(bridges.length, 1)) ;
  const fy = (i: number) => padTop + 30 + i * ((H - padTop - 60) / Math.max(frameworks.length, 1));
  const cyMid = H / 2;

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI · the relevance map</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">What governs what</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">Every CSOAI bridge maps to the frameworks it makes you compliant with. Pick your industry and the map renders the relevant components — and the gaps. The visual that makes the fleet legible and sellable.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {INDUSTRIES.map((ind) => (
              <button key={ind} onClick={() => setIndustry(ind)} className={"rounded-full border px-4 py-2 text-sm font-semibold transition-colors " + (industry === ind ? "border-emerald-300 bg-emerald-400 text-[#03110b]" : "border-emerald-300/40 text-emerald-50 hover:bg-white/10")}>{ind}</button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-emerald-200/70">Region</span>
            {REGIONS.map((r) => (
              <button key={r} onClick={() => setRegion(r)} className={"rounded-full border px-3 py-1 text-xs font-semibold transition-colors " + (region === r ? "border-teal-300 bg-teal-400 text-[#03110b]" : "border-teal-300/40 text-teal-50 hover:bg-white/10")}>{r}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
        {!industry && (
          <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
            Pick an industry above — the relevance map renders here on click (nothing loads until you do).
          </div>
        )}
        {industry && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">{industry}</h2>
              <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{bridges.length} relevant bridges</span>
              <span className="rounded-lg bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">{frameworks.length} frameworks covered</span>
              {gaps.length > 0 && <span className="rounded-lg bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{gaps.length} baseline gaps</span>}
            </div>

            <div className="mt-5 overflow-x-auto rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-50 to-white p-2">
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 720 }}>
                {/* lines: industry -> bridge */}
                {bridges.map((b, i) => (
                  <line key={"l" + b.id} x1={cx + 80} y1={cyMid} x2={bx} y2={by(i)} stroke="#34d399" strokeWidth={1.5} opacity={0.5} />
                ))}
                {/* lines: bridge -> framework */}
                {bridges.map((b, i) => b.frameworks.map((f) => {
                  const fi = frameworks.indexOf(f);
                  return <line key={"bl" + b.id + f} x1={bx + 150} y1={by(i)} x2={fx} y2={fy(fi)} stroke="#94a3b8" strokeWidth={1} opacity={0.4} />;
                }))}
                {/* industry node */}
                <g>
                  <rect x={cx} y={cyMid - 22} width={150} height={44} rx={12} fill="#065f46" />
                  <text x={cx + 75} y={cyMid + 5} textAnchor="middle" fill="#fff" fontSize={13} fontWeight={700}>{industry.length > 16 ? industry.slice(0, 15) + "…" : industry}</text>
                </g>
                {/* bridge nodes */}
                {bridges.map((b, i) => (
                  <g key={b.id}>
                    <rect x={bx} y={by(i) - 18} width={150} height={36} rx={9} fill="#ecfdf5" stroke="#34d399" />
                    <text x={bx + 75} y={by(i) + 4} textAnchor="middle" fill="#047857" fontSize={12} fontWeight={600}>{b.label}</text>
                  </g>
                ))}
                {/* framework nodes */}
                {frameworks.map((f, i) => (
                  <g key={f}>
                    <rect x={fx} y={fy(i) - 16} width={190} height={32} rx={8} fill="#f8fafc" stroke="#cbd5e1" />
                    <text x={fx + 95} y={fy(i) + 4} textAnchor="middle" fill="#334155" fontSize={11.5} fontWeight={600}>{f}</text>
                  </g>
                ))}
                {/* column labels */}
                <text x={cx + 75} y={20} textAnchor="middle" fill="#64748b" fontSize={11} fontWeight={700}>INDUSTRY</text>
                <text x={bx + 75} y={20} textAnchor="middle" fill="#64748b" fontSize={11} fontWeight={700}>CSOAI BRIDGES</text>
                <text x={fx + 95} y={20} textAnchor="middle" fill="#64748b" fontSize={11} fontWeight={700}>FRAMEWORKS</text>
              </svg>
            </div>

            {gaps.length > 0 && (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="font-bold text-amber-900">Coverage gaps — baseline frameworks not yet bridged for {industry}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {gaps.map((g) => <span key={g} className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-amber-800 border border-amber-200">{g}</span>)}
                </div>
                <p className="mt-2 text-xs text-amber-800/80">These apply to almost every AI deployer regardless of sector. The Council of AI + Layer 0 cover them at the policy layer; a dedicated bridge is the roadmap.</p>
              </div>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {bridges.map((b) => (
                <div key={b.id} className="rounded-2xl border border-gray-200 p-5">
                  <div className="font-mono font-bold text-emerald-700">{b.label}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {b.frameworks.map((f) => <span key={f} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{f}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-5 text-xs text-gray-500 leading-relaxed">
          The relevance map renders client-side as pure SVG on demand — no graph library loads until you pick an industry, keeping the OS zero-dependency. The full force-directed version (347-MCP fleet topology) and live gap-to-roadmap links switch on with the Layer 0 backend. Explore the fleet at <a href="/mcp-fleet" className="text-emerald-700 font-semibold">/mcp-fleet</a> or try the Council at <a href="/try" className="text-emerald-700 font-semibold">/try</a>.
        </div>
      </section>
    </div>
  );
}
