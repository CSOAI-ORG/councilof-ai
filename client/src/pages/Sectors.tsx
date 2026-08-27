import { EUNOMIA_AXES } from "@/data/eunomia";

export default function Sectors() {
  const TILES = [
    { sector: "Regulator", axes: ["governance","provenance","conformance"], lane: "R8-free", anchor: "public watchdog", blurb: "Signed enforcement record + deadlines, free forever." },
    { sector: "Insurance", axes: ["insurance","privacy-risk"], lane: "x402-data", anchor: "underwriting / claims", blurb: "Underwriting + GDPR-privacy measurement, data-only." },
    { sector: "Bond market", axes: ["bond-router","climate-transition"], lane: "x402-data", anchor: "A2A settlement attestation", blurb: "COBOL COPYBOOK to A2A attestation + climate transition." },
    { sector: "COBOL legacy", axes: ["bond-router"], lane: "x402-data", anchor: "COPYBOOK->A2A", blurb: "Legacy settlement records signed for the machine." },
    { sector: "AI vendor", axes: ["governance","openness","care"], lane: "x402-data", anchor: "self-audit before contact", blurb: "Self-audit exposure before a regulator contacts you." },
  ];
  const axisName = (a: string) => (EUNOMIA_AXES.find((x) => x.axis === a)?.axis ?? a);
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">EUNOMIA Sectors — measurement tooling for every end party</h1>
      <p className="mt-1 text-sm text-emerald-300/80">white-label · they brand it, we sign it · trust root never white-labels</p>
      <p className="mt-2 text-xs text-slate-400">Each party gets the verifiable measurement surface mapped to ITS axis + EU AI Act exposure. Regulators free (R8); the commercial lane is data-only x402.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {TILES.map((t) => (
          <div key={t.sector} className="rounded-xl border border-emerald-400/20 bg-[#0d241b] p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-200">{t.sector}</span>
              <span className="rounded-full border border-slate-600/40 px-2 py-0.5 font-mono text-[10px] text-slate-400">{t.lane}</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">{t.anchor}</p>
            <div className="mt-2 flex flex-wrap gap-1">{t.axes.map((a) => (
              <span key={a} className="rounded bg-slate-700/40 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">{axisName(a)}</span>
            ))}</div>
            <p className="mt-2 text-xs text-slate-500">{t.blurb}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-slate-400">Signed by <a href="/first-fine-watch" className="text-emerald-300 underline">First-Fine Watch</a> · free for regulators (R8) · commercial x402 data at <a href="/eunomia-data" className="text-emerald-300 underline">/eunomia-data</a>.</p>
    </div>
  );
}
