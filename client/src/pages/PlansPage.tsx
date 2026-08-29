import { useEffect } from "react";
import { setMetaDescription } from "@/lib/utils";

// Free-rail posture (owner decision): the rail is free, verification is free forever.
// CSOAI is a MEASUREMENT body — never a certification body, never a SaaS access tier.
// Every call and every account ends in the same 3KB Ed25519-signed, hash-chained
// measurement card. Where evidence is sold, it is a signed artefact on its own page —
// never access to the rail.

// What each usage level includes — no prices, the rail is free.
type Row = { name: string; desc: string; highlight?: boolean };

const INCLUDED: Row[] = [
  { name: "Measurement cards", desc: "Standard measurement card on every published instrument, Ed25519-signed and hash-chained. Free to run." },
  { name: "Verify any card", desc: "Recompute the published hash chain in your browser. No account, no charge — verification is free forever.", highlight: true },
  { name: "Deep bundles", desc: "Full instrument batteries — governance, safety + provenance, full spectrum — each returned as one signed card." },
  { name: "Re-attestation", desc: "AI changes, regulation changes. We re-measure on schedule and issue delta cards so your evidence stays current." },
  { name: "Evidence export", desc: "Export your signed cards as JSON, CSV or Parquet. Your data is yours to own and take with you." },
];

// Capability matrix across usage levels — every column is free.
const MATRIX: [string, string, string, string, string][] = [
  ["Cards", "✓", "✓", "✓", "✓"],
  ["Re-attestation", "On schedule", "On schedule", "Monthly", "Continuous"],
  ["Credential wallet + alerts", "✓", "✓", "✓", "✓"],
  ["All published instruments (4 control-sets)", "✓", "✓", "✓", "✓ + custom"],
  ["Evidence export", "JSON · CSV", "JSON · CSV", "JSON · CSV", "+ Parquet"],
  ["Seats", "Unlimited", "Unlimited", "Unlimited", "Unlimited"],
  ["SSO / SAML, audit log", "—", "✓", "✓", "✓"],
];

export default function PlansPage() {
  useEffect(() => {
    document.title = "The rail is free — one signed card | Council of AI";
    setMetaDescription("Council of AI plans: the measurement rail is free — one signed card, and verification is free forever. Where evidence is sold it is a signed artefact on its own page, never access to the rail.");
  }, []);
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-emerald-500/15 mx-auto max-w-6xl px-6 pt-16 pb-10 text-center">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(800px 380px at 50% -10%, rgba(16,185,129,.20), transparent 60%)" }} />
        <p className="relative font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">Council of AI — the rail is free</p>
        <h1 className="relative mt-3 text-4xl sm:text-5xl font-black tracking-tight">
          The rail is free. <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">Verification is free forever.</span>
        </h1>
        <p className="relative mt-4 mx-auto max-w-3xl text-emerald-100/80">
          The product is the evidence. Every measurement ends in a 3KB card — Ed25519-signed,
          hash-chained, verifiable by anyone without asking us. Running it costs nothing;
          verifying it costs nothing. Where we sell evidence, it is a signed artefact on its own
          page — never access to the rail.
        </p>
        <div className="relative mt-6 flex flex-wrap justify-center gap-3">
          <a href="/os?lobby=assess&task=get-measured" className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#03110b] hover:bg-emerald-400">Get measured →</a>
          <a href="/gspc-verify" className="rounded-xl border border-emerald-400/40 px-5 py-2.5 text-sm font-bold text-emerald-100 hover:bg-white/5">Verify a card →</a>
          <a href="/products" className="rounded-xl border border-emerald-400/40 px-5 py-2.5 text-sm font-bold text-emerald-100 hover:bg-white/5">Four SKUs →</a>
        </div>
      </section>

      {/* What you get — free */}
      <section className="mx-auto max-w-6xl px-6 pt-14 pb-10">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/70">What you get</p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-black">Everything on the rail — free</h2>
          <p className="mt-1 text-sm text-emerald-100/70">No subscription, no per-seat tier, no checkout. Measurement, not access.</p>
        </div>
        <div className="mt-6 space-y-3">
          {INCLUDED.map((r) => (
            <div key={r.name} className={"flex flex-col gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between " + (r.highlight ? "border-emerald-400/50 bg-emerald-500/[0.06]" : "border-emerald-500/20 bg-[#05140d]")}>
              <div className="sm:max-w-3xl">
                <div className="text-base font-bold text-emerald-100">{r.name}</div>
                <p className="mt-1 text-sm text-emerald-100/75">{r.desc}</p>
              </div>
              <div className="flex items-baseline gap-1 sm:justify-end">
                <span className="text-2xl font-black text-emerald-300">Free</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-xl border border-emerald-500/15 bg-black/20 px-4 py-3 text-sm text-emerald-100/70">
          Every response IS the signed card — your auditor verifies independently of us.
        </p>
      </section>

      {/* Capability matrix — all free */}
      <section className="mx-auto max-w-6xl px-6 pt-6 pb-14">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/70">Usage levels</p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-black">Same signed card at every level</h2>
          <p className="mt-1 text-sm text-emerald-100/70">Levels differ by cadence and controls, not by price. You own your data.</p>
        </div>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-emerald-500/15 bg-black/20">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-emerald-500/20 text-left">
                <th className="px-4 py-3 font-semibold text-emerald-200/80"></th>
                <th className="px-4 py-3 text-center font-bold text-emerald-100">Individual</th>
                <th className="px-4 py-3 text-center font-bold text-emerald-100">Team</th>
                <th className="px-4 py-3 text-center font-bold text-emerald-100">Organisation</th>
                <th className="px-4 py-3 text-center font-bold text-emerald-100">Public sector</th>
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((row) => (
                <tr key={row[0]} className="border-b border-emerald-500/10">
                  <td className="px-4 py-3 text-emerald-100/80">{row[0]}</td>
                  <td className="px-4 py-3 text-center text-emerald-100/90">{row[1]}</td>
                  <td className="px-4 py-3 text-center text-emerald-100/90">{row[2]}</td>
                  <td className="px-4 py-3 text-center text-emerald-100/90">{row[3]}</td>
                  <td className="px-4 py-3 text-center text-emerald-100/90">{row[4]}</td>
                </tr>
              ))}
              <tr>
                <td className="px-4 py-4"></td>
                <td className="px-4 py-4 text-center"><a href="/os?lobby=assess&task=get-measured" className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-[#03110b] hover:bg-emerald-400">Get measured</a></td>
                <td className="px-4 py-4 text-center"><a href="/os?lobby=assess&task=get-measured" className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-[#03110b] hover:bg-emerald-400">Get measured</a></td>
                <td className="px-4 py-4 text-center"><a href="/os?lobby=assess&task=enterprise-start" className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-[#03110b] hover:bg-emerald-400">Get measured</a></td>
                <td className="px-4 py-4 text-center"><a href="/contact" className="rounded-lg border border-emerald-400/40 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-white/5">Talk to us</a></td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-center text-xs text-emerald-300/75">
          Not a certification body (cards are verified measurement credentials, not certificates), not an
          observability platform. You own your data. The rail is free; verification is free forever.
        </p>
        <p className="mt-4 text-center text-sm text-emerald-100/70">
          Need a feed or a corpus? That is Council Ledger and Council Data — on enquiry, never a grade.{" "}
          <a href="/licensing-agreement" className="text-emerald-300 hover:underline">Standing terms</a>
          {" · "}
          <a href="/products" className="text-emerald-300 hover:underline">four SKUs</a>.
        </p>
      </section>
    </div>
  );
}
