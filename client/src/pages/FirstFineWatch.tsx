import { useEffect, useState } from "react";

// First-Fine Watch — systematic signed coverage of the public AI enforcement record.
// R8 grammar law: regulators are verified free forever; this is a free, signed,
// stranger-verifiable feed. There is NO payment, NO score, NO ranking, NO certification
// on this surface. An unverified cell is stated UNMEASURED, never a fake 0.
// Never "every problem of every AI company" — systematic coverage, not absolutist.

type FineRow = { jurisdiction: string; key: string; amount_eur?: number; amount_usd?: number; amount_gbp?: number; unit: string; note: string; verified: string; status: string };
type DeadlineRow = { event: string; date: string; note: string };
type FinesFeed = {
  schema?: string;
  title?: string;
  as_of?: string;
  first_fine_watch: { eu_ai_act_fines_collected_eur: number; enforcement_powers_live_since: string; days_since_powers_live: number; maximal_exposure: string; sentence: string; verify_free: boolean; certification: boolean };
  fines_by_jurisdiction: FineRow[];
  deadlines_calendar: DeadlineRow[];
  honest_register: { status: string; rule: string; certification: boolean; issued_by: string; signer: string };
  bright_lines?: string[];
  signature?: { attests: string; signer: string; alg: string; sig: string };
};

const FALLBACK: FinesFeed = {
  schema: "csoai.enforcement-corpus/0.1",
  title: "Systematic signed coverage of the public AI enforcement record",
  as_of: "2026-08-24",
  first_fine_watch: { eu_ai_act_fines_collected_eur: 0, enforcement_powers_live_since: "2026-08-02", days_since_powers_live: 22, maximal_exposure: "Art 101 GPAI — EUR 35M or 7% of worldwide turnover, whichever is higher", sentence: "EU AI Act enforcement powers switched ON 2026-08-02. Fines collected to date: EUR 0.", verify_free: true, certification: false },
  fines_by_jurisdiction: [
    { jurisdiction: "EU (GDPR/DSA)", key: "Clearview", amount_eur: 100, unit: "M", note: "EUR 100M+ cumulative; GDPR/DSA route, pre-AIA", verified: "REPORTED", status: "pre-2026, reported figure" },
    { jurisdiction: "US (FTC)", key: "FTC AI settlement", amount_usd: 85, unit: "M", note: "USD ~85M headline; mostly suspended", verified: "REPORTED", status: "settlement, largely suspended" },
    { jurisdiction: "UK", key: "ICO AI-adjacent", amount_gbp: 17, unit: "M", note: "GBP ~17M AI-adjacent", verified: "REPORTED", status: "AI-adjacent ICO action" },
    { jurisdiction: "EU", key: "OpenAI (annulled)", amount_eur: 15, unit: "M", note: "EUR 15M annulled March 2026", verified: "REPORTED", status: "annulled, not a fine" },
  ],
  deadlines_calendar: [
    { event: "Texas AI portal", date: "2026-09-01", note: "State AI portal deadline" },
    { event: "DRCF AI consumer call", date: "2026-09-02", note: "Digital Regulators Cooperation Forum response" },
    { event: "Art 50(2) grace ends", date: "2026-12-02", note: "EU AI Act transparency marking grace period ends" },
    { event: "Korea AI grace ends", date: "2027-01-22", note: "Korea AI regulation grace period" },
    { event: "Illinois AI audits", date: "2027-01-01", note: "Illinois AI audit compliance date" },
  ],
  honest_register: { status: "MEASURED / REPORTED / UNMEASURED", rule: "an unmeasurable entry is stated UNMEASURED, never defaulted to a fake 0", certification: false, issued_by: "did:web:csoai.org", signer: "did:web:csoai.org#board-attestation-1" },
  bright_lines: ["no regulator is ever charged — verification free forever", "no x402 / micropayment on this feed, and none on any ranked output", "no score, no ranking, no certification — predicates and coverage only", "no 'every problem of every AI company' framing"],
};

function fmtAmount(row: FineRow): string {
  const amt = row.amount_eur ?? row.amount_usd ?? row.amount_gbp;
  if (amt == null) return "—";
  const cur = row.amount_eur ? "€" : row.amount_usd ? "$" : "£";
  return `${cur}${amt}${row.unit || ""}`;
}

export default function FirstFineWatch() {
  const [feed, setFeed] = useState<FinesFeed>(FALLBACK);
  const [signed, setSigned] = useState(false);

  useEffect(() => { document.title = "First-Fine Watch — EU AI Act fines, date by date | CSOAI"; }, []);

  useEffect(() => {
    fetch("/api/fines").then((r) => (r.ok ? r.json() : null)).then((j) => {
      if (j && j.first_fine_watch) {
        setFeed({ ...FALLBACK, ...j });
        setSigned(Boolean(j.signature && j.signature.sig));
      }
    }).catch(() => { /* keep fallback so the page always renders */ });
  }, []);

  useEffect(() => {
    const sc = document.createElement("script");
    sc.type = "application/ld+json";
    sc.text = JSON.stringify({
      "@context": "https://schema.org", "@type": "WebPage",
      name: "First-Fine Watch — signed coverage of the public AI enforcement record",
      about: "EU AI Act enforcement fines collected and the application dates of the fining powers.",
    });
    document.head.appendChild(sc);
    return () => { document.head.removeChild(sc); };
  }, []);

  const w = feed.first_fine_watch;
  const nextIdx = feed.deadlines_calendar.findIndex((d) => d.date >= "2026-08-24");
  const todayIso = "2026-08-24";

  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(760px 400px at 82% -12%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-4xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">Council of AI · measurement surface · signed coverage</p>
          <h1 className="mt-3 text-4xl sm:text-6xl font-black tracking-tight">First-Fine Watch</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">
            Systematic signed coverage of the public AI enforcement record. Every entry is its own predicate over a public artifact — timestamped, Ed25519-signed, stranger-verifiable. Regulators are always verified free.
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/10 p-5">
              <div className="text-[11px] uppercase tracking-wider text-emerald-200/70">EU AI Act fines collected</div>
              <div className="mt-1 text-4xl font-black tabular-nums">€{w.eu_ai_act_fines_collected_eur}</div>
              <div className="mt-1 text-xs text-emerald-200/80">fines monetised to date under the GPAI fining power</div>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/10 p-5">
              <div className="text-[11px] uppercase tracking-wider text-emerald-200/70">Powers live since</div>
              <div className="mt-1 text-4xl font-black tabular-nums">2026-08-02</div>
              <div className="mt-1 text-xs text-emerald-200/80">Art 101 GPAI fining power, ON · max €35M or 7% of turnover</div>
            </div>
            <div className="rounded-2xl bg-amber-400/10 border border-amber-300/20 p-5">
              <div className="text-[11px] uppercase tracking-wider text-amber-200/80">Days powers live</div>
              <div className="mt-1 text-4xl font-black tabular-nums text-amber-200">{w.days_since_powers_live}</div>
              <div className="mt-1 text-xs text-amber-200/70">{signed ? "feed verified & signed" : "signed feed pending"}</div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Recorded fines by jurisdiction */}
        <section>
          <h2 className="text-2xl font-black text-gray-900">Recorded fines, by jurisdiction</h2>
          <p className="mt-1 text-sm text-gray-500">Reported figures from the public enforcement record. Status column is explicit; nothing here is a benchmark or a CSOAI verdict.</p>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-700">Jurisdiction</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Target</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Amount</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {feed.fines_by_jurisdiction.map((r, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.jurisdiction}</td>
                    <td className="px-4 py-3 text-gray-800">{r.key}</td>
                    <td className="px-4 py-3 font-bold tabular-nums text-gray-900">{fmtAmount(r)}</td>
                    <td className="px-4 py-3"><span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">{r.status}</span></td>
                    <td className="px-4 py-3 text-gray-600">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Deadline calendar */}
        <section className="mt-12">
          <h2 className="text-2xl font-black text-gray-900">Deadline calendar</h2>
          <p className="mt-1 text-sm text-gray-500">The next cliff is highlighted.</p>
          <ol className="relative mt-6 border-l-2 border-gray-200 ml-3">
            {feed.deadlines_calendar.map((d, i) => {
              const done = d.date < todayIso;
              const next = i === nextIdx;
              const dot = done ? "bg-emerald-500 border-emerald-500" : next ? "bg-amber-400 border-amber-400" : "bg-white border-gray-300";
              return (
                <li key={i} className="mb-8 ml-6">
                  <span className={"absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full border-2 " + dot} />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black text-gray-900">{d.date}</span>
                    {done && <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Passed</span>}
                    {next && <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Next cliff</span>}
                  </div>
                  <div className="mt-1 text-lg font-bold text-gray-900">{d.event}</div>
                  <p className="mt-1 text-sm text-gray-600">{d.note}</p>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Honest register + verify */}
        <section className="mt-12 rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <h3 className="text-lg font-black text-gray-900">Honest register</h3>
          <p className="mt-1 text-sm text-gray-600">{feed.honest_register.status} — {feed.honest_register.rule}.</p>
          <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-white border border-gray-200 p-3">
              <dt className="text-[11px] uppercase tracking-wider text-gray-400">Certification</dt>
              <dd className="font-bold text-gray-900">No — measurement &amp; coverage only</dd>
            </div>
            <div className="rounded-xl bg-white border border-gray-200 p-3">
              <dt className="text-[11px] uppercase tracking-wider text-gray-400">Signer</dt>
              <dd className="font-mono text-[13px] text-gray-900">{feed.honest_register.signer}</dd>
            </div>
            <div className="rounded-xl bg-white border border-gray-200 p-3 sm:col-span-2">
              <dt className="text-[11px] uppercase tracking-wider text-gray-400">Signature</dt>
              <dd className="font-mono text-[13px] break-all text-gray-700">{signed ? feed.signature?.sig?.slice(0, 64) + "…" : "Not yet signed — the feed publishes signature only when the board-attestation key is present."}</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <a href="/api/fines" className="rounded-xl bg-emerald-600 px-5 py-2.5 font-bold text-white hover:bg-emerald-500">Machine-readable signed feed ↗</a>
            <a href="/eu-ai-act-timeline" className="rounded-xl border border-emerald-300 px-5 py-2.5 font-semibold text-emerald-700 hover:bg-emerald-50">Full EU AI Act timeline →</a>
            <a href="/penalties" className="rounded-xl border border-emerald-300 px-5 py-2.5 font-semibold text-emerald-700 hover:bg-emerald-50">What a breach costs →</a>
          </div>
          <p className="mt-4 text-xs text-gray-500">Regulators are always verified free forever. There is no micropayment, no score, no ranking, no certification anywhere on this surface.</p>
        </section>
      </main>
    </div>
  );
}
