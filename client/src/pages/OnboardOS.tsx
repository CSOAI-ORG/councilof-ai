import { useEffect } from "react";
import { setMetaDescription } from "@/lib/utils";

// /start (and /onboard) — inspect published evidence, then request scoped work.
// This public page must not promise instant model inference, new measurement,
// mandatory signing or a delivered artifact before source/contract verification.
// Verification of existing published signed cards stays free.

const STEPS: { n: string; t: string; d: string }[] = [
  { n: "1", t: "Find an existing record", d: "Explore the public GSPC board and select a dated result, subject or evidence card." },
  { n: "2", t: "Inspect and verify", d: "Read the measurement date, instrument, coverage and limitations. Verify a signed card for free; unsigned results remain labelled." },
  { n: "3", t: "Request scoped evidence", d: "For an existing Article 50 or evidence service, agree the named subject, scope and delivery before purchase. A receipt is not a fresh measurement." },
];

export default function OnboardOS() {
  useEffect(() => {
    document.title = "Explore verifiable AI evidence | Council of AI";
    setMetaDescription("Explore dated GSPC measurements and evidence from CSOAI Ltd. Verify existing signed cards free; request scoped evidence separately. Measurement, not certification.");
  }, []);
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="relative overflow-hidden mx-auto max-w-4xl px-6 pt-20 pb-10 text-center">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(800px 380px at 50% -10%, rgba(16,185,129,.20), transparent 60%)" }} />
        <p className="relative font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">Council of AI — start here</p>
        <h1 className="relative mt-3 text-4xl sm:text-5xl font-black tracking-tight">
          Start with evidence<br />
          <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">you can verify.</span>
        </h1>
        <p className="relative mt-4 mx-auto max-w-2xl text-emerald-100/80">
          Read an existing, dated measurement and its limitations. Verify signed cards free in your browser;
          not every published record is signed. For a named subject or AI-generated output, explore
          existing evidence services and request a written scope. Paying for a receipt does not
          create a new measured result or guarantee a fresh AI run. A grade is never sold.
        </p>
        <div className="relative mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="/gspc-verify" className="rounded-xl bg-emerald-500 px-7 py-3.5 text-base font-bold text-[#03110b] hover:bg-emerald-400">
            Verify a published card →
          </a>
          <a href="/assess" className="rounded-xl border border-emerald-400/40 px-7 py-3.5 text-base font-bold text-emerald-100 hover:bg-white/5">
            Inspect evidence services
          </a>
          <a href="/contact/?arm=data" className="rounded-xl border border-emerald-400/40 px-7 py-3.5 text-base font-bold text-emerald-100 hover:bg-white/5">
            Request a scoped quote
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 font-black text-[#03110b]">{s.n}</div>
              <div className="mt-3 text-base font-bold text-emerald-100">{s.t}</div>
              <p className="mt-1 text-sm text-emerald-100/75">{s.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-emerald-500/15 bg-black/20 p-5 text-sm text-emerald-100/75">
          Council of AI publishes measurements, not certifications. Published signed cards can be
          checked for integrity, while unsigned or unmeasured records remain explicitly labelled.
          Verification stays free and loginless. A grade is never sold. <a href="/gspc-verify" className="font-semibold text-emerald-300 underline hover:text-emerald-200">Verify a card →</a>
          {" "}Preparing for EU AI Act Article 50 marking? <a href="/art50" className="font-semibold text-emerald-300 underline hover:text-emerald-200">Verification services →</a>
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-500/15 bg-black/20 p-5 text-sm text-emerald-100/75">
          See the method on live public data: RLUSD supply on XRPL and Ethereum, read from public
          endpoints in your browser with a labeled fallback snapshot.{" "}
          <a href="/rlusd" className="font-semibold text-emerald-300 underline hover:text-emerald-200">RLUSD supply, measured live →</a>
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-500/15 bg-black/20 p-5 text-sm text-emerald-100/75">
          See how we measure what labs publish: the <a href="/frameworks" className="font-semibold text-emerald-300 underline hover:text-emerald-200">frontier framework presence register</a> —
          a bounded, source-verified record of published frontier-safety frameworks. Presence and provenance, never quality.
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-500/15 bg-black/20 p-5 text-sm text-emerald-100/75">
          Wrapped-asset parity: on-chain supply for each bridged stablecoin, read from public endpoints.{" "}
          <a href="/wrappers" className="font-semibold text-emerald-300 underline hover:text-emerald-200">Wrapped-asset parity ledger →</a>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-bold text-emerald-100">Explore the estate</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { href: "/quickstart", label: "Quickstart", desc: "One-page guide to the measurement stack" },
              { href: "/gspc-scoreboard", label: "Scoreboard", desc: "Live board — every axis, every model" },
              { href: "/leaderboard", label: "Leaderboard", desc: "Benchmark corpus — not a single best AI" },
              { href: "/countdown", label: "Countdown", desc: "Regulatory deadlines and Art 50 readiness" },
              { href: "/owasp-asi", label: "OWASP mapping", desc: "Board axes → OWASP AI Exchange categories" },
              { href: "/evaluator-access", label: "Evaluator access", desc: "Conditions for independent evaluation" },
              { href: "/press", label: "Press", desc: "Corrections, root, signed index, FAQs" },
              { href: "/products", label: "Products", desc: "Existing verification, evidence services and enquiry routes" },
              { href: "/methodology", label: "Methodology", desc: "The frozen rules every number is computed under" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg border border-emerald-500/15 bg-black/20 px-4 py-3 hover:border-emerald-400/40"
              >
                <span className="text-sm font-semibold text-emerald-200">{link.label}</span>
                <span className="mt-0.5 block text-xs text-emerald-100/60">{link.desc}</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
