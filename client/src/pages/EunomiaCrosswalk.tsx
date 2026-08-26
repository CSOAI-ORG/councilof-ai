import { FINES, DEADLINES, FFW } from "@/data/enforcement";

/**
 * EUNOMIA cross-reference watch — statute → axis → requirement → exposure.
 * Live watch: EU AI Act (GPAI 3%/€15M, high-risk 7%/€35M, Art 73 windows),
 * CRA (11 Sep 2026), plus the signed enforcement corpus + deadline calendar.
 * A cross-reference, not certification. Article numbers are canonical public facts.
 */
type Art = { art: string; title: string; axis: string; requirement: string; exposure: string; live: string };
const ARTS: Art[] = [
  { art: "art5", title: "Prohibited practices", axis: "trust-verification", requirement: "The practices banned outright (Art 5 list)", exposure: "Prohibited", live: "2 Aug 2026" },
  { art: "art6", title: "High-risk classification", axis: "bond-router / insurance", requirement: "Annex III systems in scope of the high-risk regime", exposure: "7% / €35M", live: "2 Aug 2026" },
  { art: "art13", title: "Transparency & information", axis: "privacy-risk", requirement: "Instructions for use, interpretability, logging", exposure: "High-risk", live: "2 Aug 2026" },
  { art: "art14", title: "Human oversight", axis: "insurance", requirement: "Natural-person oversight of the system in operation", exposure: "High-risk", live: "2 Aug 2026" },
  { art: "art50", title: "GPAI transparency", axis: "east-west", requirement: "Output marking for synthetic content; grace ends 2 Dec 2026", exposure: "GPAI", live: "2 Aug 2026" },
  { art: "art53", title: "GPAI model duties", axis: "data-dao", requirement: "Technical documentation, training-data summary, copyright policy", exposure: "GPAI", live: "2 Aug 2026" },
  { art: "art55", title: "Post-market monitoring", axis: "climate-transition", requirement: "Obligations on deployers for Annex III systems", exposure: "High-risk", live: "2 Aug 2026" },
  { art: "art73", title: "Surveillance windows", axis: "enforcement", requirement: "15d conformity issue · 10d non-conformity · 2d partial/ambiguous", exposure: "Enforcement", live: "2 Aug 2026" },
  { art: "art101", title: "GPAI fines", axis: "enforcement", requirement: "Fines for GPAI providers", exposure: "3% / €15M", live: "FIRST-FINE WATCH" },
];
const CRA = [
  { name: "CRA applies to products with digital elements", date: "2026-09-11", note: "incl. SBOM + vulnerability reporting duties" },
];

export default function EunomiaCrosswalk() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">EUNOMIA — EU AI Act × CRA cross-reference watch</h1>
      <p className="mt-1 text-sm text-emerald-300/80">statute → axis → requirement → exposure · live sources linked · measurement, not certification</p>
      <p className="mt-2 text-xs text-slate-400">
        Article numbers and dates are canonical public facts. Live sources:{" "}
        <a href="https://eur-lex.europa.eu/eli/reg/2024/1689/oj" target="_blank" rel="noreferrer" className="text-emerald-300 underline">EUR-Lex AI Act (2024/1689)</a> ·{" "}
        <a href="https://www.federalregister.gov" target="_blank" rel="noreferrer" className="text-emerald-300 underline">Federal Register</a> ·{" "}
        <a href="https://www.ecfr.gov" target="_blank" rel="noreferrer" className="text-emerald-300 underline">eCFR</a> ·{" "}
        <a href="https://eur-lex.europa.eu/eli/reg/2024/2847/oj" target="_blank" rel="noreferrer" className="text-emerald-300 underline">CRA (2024/2847)</a>
      </p>

      <h2 className="mt-8 text-lg font-semibold">EU AI Act → axis cross-reference</h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-emerald-400/20">
        <table className="w-full border-collapse text-sm">
          <thead><tr className="border-b border-slate-600 bg-[#0d241b] text-left text-xs uppercase text-slate-400">
            <th className="px-3 py-2">article</th><th>what it requires</th><th>maps to axis</th><th>exposure</th><th>in force</th></tr></thead>
          <tbody>{ARTS.map((a) => (
            <tr key={a.art} className="border-b border-slate-700/50">
              <td className="px-3 py-2 font-mono text-emerald-200">{a.art}</td>
              <td className="text-slate-300">{a.title} — {a.requirement}</td>
              <td className="font-mono text-slate-400">{a.axis}</td>
              <td className="font-mono text-slate-300">{a.exposure}</td>
              <td className="text-slate-400">{a.live}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Cyber Resilience Act watch (next live date)</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">{CRA.map((c) => (
        <div key={c.name} className="rounded-lg border border-emerald-400/20 bg-[#0d241b] p-3 text-sm">
          <div className="font-mono text-emerald-300">{c.date}</div>
          <div className="text-slate-200">{c.name}</div>
          <div className="text-xs text-slate-400">{c.note}</div>
        </div>
      ))}</div>

      <h2 className="mt-8 text-lg font-semibold">Enforcement corpus (signed, systematic coverage)</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">{FINES.map((f) => (
        <div key={f.actor} className="rounded-lg border border-slate-600/40 bg-[#0d241b] p-3 text-sm">
          <div className="text-slate-200">{f.actor}</div>
          <div className="text-xs text-slate-400">{f.regime} · {f.status}</div>
          <div className="font-mono text-emerald-300">{f.amount}</div>
        </div>
      ))}</div>

      <h2 className="mt-8 text-lg font-semibold">Deadline calendar (data)</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">{DEADLINES.map((d) => (
        <div key={d.name} className="rounded-lg border border-slate-600/40 bg-[#0d241b] p-3 text-sm">
          <div className="font-mono text-emerald-300">{d.date}</div><div className="text-slate-200">{d.name}</div>
          <div className="text-xs text-slate-400">{d.note}</div>
        </div>
      ))}</div>

      <p className="mt-8 text-xs text-slate-400">
        {FFW.counter} · signed by {FFW.signer} · {FFW.note} · commercial x402 data at <a href="/eunomia-data" className="text-emerald-300 underline">/eunomia-data</a>
      </p>
    </div>
  );
}
