import { useEffect } from "react";

// CobolBridge — the enterprise on-ramp (PLAY 7).
//
// Thesis: banks and insurers modernizing legacy COBOL must produce data-lineage
// and audit evidence for DORA, Basel III/IV, SOX and Solvency II. The migration
// itself GENERATES those artifacts. cobolbridge.ai (a Council-of-AI-estate product)
// modernizes the code AND emits audit-ready lineage; Council of AI turns that
// lineage into an independent, Ed25519-signed measurement pack — so a one-off
// migration becomes continuous measurement snapshots.
//
// Rules honoured: no public prices; "we do not certify"; UNMEASURED marked;
// domain cobolbridge.ai stays 522 unattached; never certify;
// external scale figures cited as widely reported (Communications of the ACM),
// never presented as our measurement.

type Card = { glyph: string; title: string; body: string };

// Section 2 — what the bridge emits.
const BRIDGE: Card[] = [
  { glyph: "▤", title: "Copybook → schema mapping", body: "Field-level mapping from COBOL copybooks to modern schemas, captured as data — not left implicit in a rewrite." },
  { glyph: "▦", title: "Data-lineage export", body: "A record of what moved where: source record, transformation, destination — the lineage regulators ask for during a migration." },
  { glyph: "◇", title: "Transformation trace", body: "Each transformation step is traceable, so control continuity can be shown across the cutover rather than asserted." },
  { glyph: "▥", title: "Mainframe surface", body: "CICS, IMS, JCL and VSAM surfaced as documented, callable interfaces — the boundary the evidence is drawn around." },
];

// Section 1 — the evidence regimes, with real dates.
const REGIMES: { name: string; detail: string }[] = [
  { name: "DORA — Regulation (EU) 2022/2554", detail: "Fully applicable since 17 January 2025. ICT risk management, resilience testing, and a register of critical functions — all needing traceability through a migration." },
  { name: "Basel III / IV · BCBS 239", detail: "Principles for effective risk-data aggregation and reporting: complete, accurate, and traceable data lineage across the systems being modernized." },
  { name: "SOX", detail: "Controls and traceability over financial reporting — which a change to the core ledger systems must not silently break." },
  { name: "Solvency II — amending Directive (EU) 2025/2", detail: "Member States transpose by January 2027. Governance and data-quality expectations for insurers, reaching into the legacy systems that hold the book." },
];

export default function CobolBridge() {
  useEffect(() => { document.title = "CobolBridge — legacy system to signed evidence | CSOAI"; }, []);
  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-20">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(720px 380px at 82% -12%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">Evidence rail · legacy system → signed evidence — not a market</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">From a COBOL copybook to signed evidence — not a bond</h1>
          <p className="mt-5 max-w-3xl text-lg text-emerald-50/90">
            Banks and insurers modernizing legacy COBOL still need lineage they can show a supervisor. The migration can emit that lineage. The sidecar is <strong>SPEC only</strong> — <code>cobolbridge.ai</code> is parked (HTTP 522). Read <a href="https://github.com/CSOAI-ORG/cobol-bridge-mcp/blob/main/SPEC.md" target="_blank" rel="noopener" className="underline decoration-emerald-400/60 underline-offset-2 hover:text-white">SPEC.md</a>. Council of AI turns published lineage into an independent, Ed25519-signed measurement pack. Empty financial cells on the board stay empty. This is not a tokenized market and not a rating. We do not certify.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="https://github.com/CSOAI-ORG/cobol-bridge-mcp/blob/main/SPEC.md" target="_blank" rel="noopener" className="rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-bold text-[#03110b] hover:bg-emerald-300">Open SPEC.md (domain parked) →</a>
            <a href="/contact" className="rounded-xl border border-emerald-300/40 px-5 py-2.5 text-sm font-semibold text-emerald-50 hover:bg-white/10">Talk to us — enterprise →</a>
          </div>
        </div>
      </section>

      {/* SECTION 1 — the problem */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-700/80">1 · the problem</p>
        <h2 className="mt-2 text-2xl font-bold text-gray-900">Legacy COBOL still runs the core — and the evidence burden is growing</h2>
        <p className="mt-3 max-w-3xl text-gray-600">
          Widely reported (per <span className="italic">Communications of the ACM</span>): around $3 trillion of daily commerce flows through COBOL systems, roughly 40% of US banking systems run on it, and an estimated 220 billion lines remain in active use. These are external figures — a description of the landscape, not a Council of AI measurement.
        </p>
        <p className="mt-3 max-w-3xl text-gray-600">
          Modernizing that core now runs straight into a widening set of duties that all ask the same thing: show the lineage, and show the controls held across the change.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {REGIMES.map((r) => (
            <div key={r.name} className="rounded-2xl border border-gray-200 p-5">
              <div className="font-bold text-gray-900">{r.name}</div>
              <p className="mt-1 text-sm text-gray-500 leading-snug">{r.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2 — the bridge */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-700/80">2 · the bridge</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">cobolbridge.ai modernizes the code — and emits audit-ready lineage as it goes</h2>
          <p className="mt-3 max-w-3xl text-gray-600">
            Instead of a rewrite that loses the paper trail, the migration is instrumented: every mapping and transformation is captured as data, so the lineage a supervisor asks for falls out of the work rather than being reconstructed after the fact. Domain <code>cobolbridge.ai</code> stays HTTP 522 unattached.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BRIDGE.map((c) => (
              <div key={c.title} className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-700">{c.glyph}</div>
                <div className="mt-3 font-bold text-gray-900">{c.title}</div>
                <p className="mt-1 text-sm text-gray-500 leading-snug">{c.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <a href="https://github.com/CSOAI-ORG/cobol-bridge-mcp/blob/main/SPEC.md" target="_blank" rel="noopener" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">Explore SPEC.md (domain parked) →</a>
          </div>
        </div>
      </section>

      {/* SECTION 3 — the on-ramp to signed measurement */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-700/80">3 · the on-ramp to signed measurement</p>
        <h2 className="mt-2 text-2xl font-bold text-gray-900">Lineage in, a signed measurement pack out — and it keeps running</h2>
        <p className="mt-3 max-w-3xl text-gray-600">
          The lineage and evidence a migration produces is the raw material for an independent Council of AI measurement pack: Ed25519-signed, three-state (UNMEASURED / measured / refused), and reproducible from a published method. A one-off migration becomes continuous measurement snapshots — re-run the measurement on a schedule and keep the signed snapshots. Not certification.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 font-mono text-gray-700">COBOL migration + lineage</span>
          <span className="text-emerald-500 font-bold">→</span>
          <span className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 font-semibold text-emerald-800">Council of AI signed measurement pack · Ed25519 · reproducible</span>
          <span className="text-emerald-500 font-bold">→</span>
          <span className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 font-mono text-gray-700">Continuous measurement snapshots</span>
        </div>

        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <span className="font-bold">Status: UNMEASURED.</span> This on-ramp is a described pathway. The cobolbridge.ai → signed-measurement pipeline is not yet a live, measured integration; it is presented as UNMEASURED until it is built and run, in keeping with our three-state honesty. Domain cobolbridge.ai stays 522 unattached. We do not certify.
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <a href="/methodology" className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-800 hover:bg-gray-50">How the measurement works — /methodology</a>
          <a href="/gspc-verify" className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-800 hover:bg-gray-50">Verify a signed pack — /gspc-verify</a>
          <a href="/cra-readiness" className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-800 hover:bg-gray-50">CRA Readiness Kit</a>
          <a href="/gpai-evidence" className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-800 hover:bg-gray-50">GPAI Evidence Pack</a>
        </div>
      </section>

      {/* SECTION 4 — honest boundary */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-700/80">4 · the honest boundary</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">What this is — and what it is not</h2>
          <ul className="mt-4 max-w-3xl space-y-3 text-gray-700">
            <li className="flex gap-3"><span className="mt-1 text-emerald-600">◆</span><span>We measure and attest. <span className="font-semibold">We do not certify.</span> A signed Council of AI measurement is independent evidence, never a conformity mark or a pass/fail badge.</span></li>
            <li className="flex gap-3"><span className="mt-1 text-emerald-600">◆</span><span>cobolbridge.ai is a modernization tool (domain parked, HTTP 522). The Council of AI measurement is <span className="font-semibold">independent of it</span> — the attestation is about the evidence, not an endorsement of the migration.</span></li>
            <li className="flex gap-3"><span className="mt-1 text-emerald-600">◆</span><span>The determination of compliance stays with the competent authorities — supervisors and regulators. Our pack is an input they can verify, not their decision.</span></li>
          </ul>
        </div>
      </section>

      {/* SECTION 5 — CTA */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-emerald-950">Bring us your migration</h2>
          <p className="mt-2 max-w-2xl text-emerald-900/90">
            If you are modernizing a COBOL core under DORA, Basel III/IV, SOX or Solvency II, the lineage you have to produce anyway can become continuous measurement snapshots. Talk to us about the on-ramp. Verify is free; a grade is never sold; there are no public prices. We do not certify.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/contact" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">Contact — enterprise →</a>
            <a href="https://github.com/CSOAI-ORG/cobol-bridge-mcp/blob/main/SPEC.md" target="_blank" rel="noopener" className="rounded-xl border border-emerald-400/50 px-5 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-white/60">Open SPEC.md (domain parked) →</a>
          </div>
        </div>
      </section>
    </div>
  );
}
