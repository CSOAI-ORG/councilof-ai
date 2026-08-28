import { useEffect, useState } from "react";
import { fetchAxes, type AxesState } from "@/lib/gspcAxes";
import { FOCUS, MEASURE, SP, SURFACE, TYPE } from "./glass";

/**
 * LobbyMatrixPane — Industry × Regulation matrix inside Council OS.
 *
 * Wraps the leftover RelevanceMap visual ("INDUSTRY → CSOAI BRIDGES → FRAMEWORKS")
 * as the OS pane chrome. Archive honesty: leftover six industries / 12 bridges,
 * not the living 15. Living drivers (GET /api/gspc, GET /api/regulation) sit
 * beside it, not as a fork.
 *
 * Authority: GET /api/gspc. If this pane disagrees with the API, the API wins.
 * This is a printer of the living board, not a simulation, not certification.
 */

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

export default function LobbyMatrixPane({ onOpenSpace }: { onOpenSpace?: (axis: string) => void }) {
  const [industry, setIndustry] = useState<string | null>(null);
  const [region, setRegion] = useState<string>("All");
  const [state, setState] = useState<Pick<AxesState, "axes" | "source" | "loading" | "publicCount">>({
    axes: [],
    source: "snapshot",
    loading: true,
    publicCount: undefined,
  });

  useEffect(() => {
    const ac = new AbortController();
    fetchAxes(ac.signal).then((r) => setState({ ...r, loading: false }));
    return () => ac.abort();
  }, []);

  const bridges = industry ? BRIDGES.filter((b) => b.industries.includes(industry) && inRegion(b.frameworks, region)) : [];
  const frameworks = Array.from(new Set(bridges.flatMap((b) => b.frameworks)));

  const W = 920, rowH = 60, padTop = 40;
  const H = Math.max(bridges.length, frameworks.length, 1) * rowH + padTop + 40;
  const bx = 250, fx = 670, cx = 60;
  const by = (i: number) => padTop + 30 + i * ((H - padTop - 60) / Math.max(bridges.length, 1)) ;
  const fy = (i: number) => padTop + 30 + i * ((H - padTop - 60) / Math.max(frameworks.length, 1));
  const cyMid = H / 2;

  return (
    <section aria-labelledby="coai-matrix-h" className={`${SP.panel} h-full overflow-y-auto`}>
      <p className={TYPE.section}>Industry × Regulation</p>
      <h2 id="coai-matrix-h" className="mt-1 text-[22px] font-semibold tracking-tight text-slate-900">
        What governs what
      </h2>
      
      <p className={`mt-3 ${MEASURE} ${TYPE.body}`}>
        Printer of the living board. Not a simulation. Not certification.{" "}
        <span className="font-semibold">Cite GET /api/gspc as the authority.</span>{" "}
        If this page disagrees with the API, the API wins.
      </p>

      <p className={`mt-2 ${TYPE.muted}`}>
        {state.loading
          ? "Reading GET /api/gspc…"
          : state.source === "wire" && state.publicCount
            ? state.publicCount
            : state.source === "wire"
              ? "Live from the board"
              : "Offline fallback — this build's snapshot"}
      </p>

      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2">
        <p className="text-[11px] font-semibold text-amber-800">Archive visual</p>
        <p className="text-[10px] text-amber-700">
          This is the leftover relevance map — six industries / 12 bridges from the archive, not the living 15.
          The living board count is reported above from GET /api/gspc.
        </p>
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap gap-2">
          {INDUSTRIES.map((ind) => (
            <button
              key={ind}
              onClick={() => setIndustry(ind === industry ? null : ind)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                industry === ind
                  ? "border-emerald-400 bg-emerald-100 text-emerald-900"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {ind}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-400">Region</span>
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                region === r
                  ? "border-teal-300 bg-teal-100 text-teal-800"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-2">
        {!industry ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400 text-sm">
            Pick an industry above — the relevance map renders here on click.
          </div>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2 px-2">
              <span className="font-semibold text-slate-900 text-sm">{industry}</span>
              <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{bridges.length} bridges</span>
              <span className="rounded-lg bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">{frameworks.length} frameworks</span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 600 }}>
              {bridges.map((b, i) => (
                <line key={"l" + b.id} x1={cx + 80} y1={cyMid} x2={bx} y2={by(i)} stroke="#34d399" strokeWidth={1.5} opacity={0.5} />
              ))}
              {bridges.map((b, i) => b.frameworks.map((f) => {
                const fi = frameworks.indexOf(f);
                return <line key={"bl" + b.id + f} x1={bx + 150} y1={by(i)} x2={fx} y2={fy(fi)} stroke="#94a3b8" strokeWidth={1} opacity={0.4} />;
              }))}
              <g>
                <rect x={cx} y={cyMid - 22} width={150} height={44} rx={12} fill="#065f46" />
                <text x={cx + 75} y={cyMid + 5} textAnchor="middle" fill="#fff" fontSize={13} fontWeight={700}>{industry.length > 16 ? industry.slice(0, 15) + "…" : industry}</text>
              </g>
              {bridges.map((b, i) => (
                <g key={b.id}>
                  <rect x={bx} y={by(i) - 18} width={150} height={36} rx={9} fill="#ecfdf5" stroke="#34d399" />
                  <text x={bx + 75} y={by(i) + 4} textAnchor="middle" fill="#047857" fontSize={12} fontWeight={600}>{b.label}</text>
                </g>
              ))}
              {frameworks.map((f, i) => (
                <g key={f}>
                  <rect x={fx} y={fy(i) - 16} width={190} height={32} rx={8} fill="#f8fafc" stroke="#cbd5e1" />
                  <text x={fx + 95} y={fy(i) + 4} textAnchor="middle" fill="#334155" fontSize={11.5} fontWeight={600}>{f}</text>
                </g>
              ))}
              <text x={cx + 75} y={20} textAnchor="middle" fill="#64748b" fontSize={11} fontWeight={700}>INDUSTRY</text>
              <text x={bx + 75} y={20} textAnchor="middle" fill="#64748b" fontSize={11} fontWeight={700}>CSOAI BRIDGES</text>
              <text x={fx + 95} y={20} textAnchor="middle" fill="#64748b" fontSize={11} fontWeight={700}>FRAMEWORKS</text>
            </svg>
          </>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-sky-200 bg-sky-50/50 p-4">
        <p className={`${TYPE.section} text-sky-800`}>For regulators</p>
        <p className={`mt-2 ${TYPE.body}`}>
          Regulators can <strong>aim</strong> a draft rule against this matrix. They cannot get a verdict from it.
        </p>
        <ul className={`mt-3 space-y-2 ${TYPE.muted}`}>
          <li>
            <strong>Matrix cells</strong> — MEASURED / UNMEASURED / REPORTED from GET /api/gspc + existing crosswalk.
            Empty stays empty.
          </li>
          <li>
            <strong>Draft provisions</strong> — may open PRACTICE / unsigned sim only.
            <span className="mt-1 block rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-900">
              Unsigned training. Never quoted. Not a measurement. Not legal advice. Not a conformity mark.
            </span>
          </li>
          <li>
            <strong>When law changes</strong> — the living-law path is re-measure + delta card. The old card stays.
            The simulation is not that path.
          </li>
        </ul>
        <p className={`mt-3 ${TYPE.fine}`}>
          We do not certify. We do not predict. We do not tell a regulator what to write.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href="/map"
          className={`${SURFACE} rounded-lg px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-100 ${FOCUS}`}
        >
          Full relevance map →
        </a>
        <a
          href="/crosswalk"
          className={`${SURFACE} rounded-lg px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-100 ${FOCUS}`}
        >
          Open crosswalk →
        </a>
        <a
          href="/gspc-arena"
          className={`${SURFACE} rounded-lg px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-100 ${FOCUS}`}
        >
          Open Council Space →
        </a>
        <a
          href="/api/gspc"
          target="_blank"
          rel="noreferrer"
          className={`${SURFACE} rounded-lg px-4 py-2 text-[12px] font-semibold text-emerald-700 transition hover:bg-emerald-50 ${FOCUS}`}
        >
          GET /api/gspc ↗
        </a>
      </div>
    </section>
  );
}
