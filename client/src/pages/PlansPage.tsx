import { useEffect } from "react";
import { setMetaDescription } from "@/lib/utils";

// Free-rail posture (owner decision): the rail is free, verification is free forever.
// CSOAI is a MEASUREMENT body — never a certification body, never a SaaS access tier.
// Published measurement cards use the same compact Ed25519-signed, hash-chained
// format. Where evidence is sold, it must be a verifiable artefact on its own page —
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
    <div className="min-h-screen bg-white text-zinc-900">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-zinc-200 mx-auto max-w-6xl px-6 pt-16 pb-10 text-center">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(800px 380px at 50% -10%, rgba(22,163,74,.12), transparent 60%)" }} />
        <p className="relative font-mono text-[11px] uppercase tracking-[3px] text-emerald-700">Council of AI — the rail is free</p>
        <h1 className="relative mt-3 text-4xl sm:text-5xl font-black tracking-tight">
          The rail is free. <span className="text-emerald-600">Verification is free forever.</span>
        </h1>
        <p className="relative mt-4 mx-auto max-w-3xl text-zinc-600">
          The product is the evidence. A published measurement card is compact, Ed25519-signed,
          hash-chained and independently verifiable. A tool response is not automatically a card;
          follow its artifact link and verify it. Where we sell evidence, it must be a verifiable artefact on its own
          page — never access to the rail.
        </p>
        <div className="relative mt-6 flex flex-wrap justify-center gap-3">
          <a href="/dashboard?task=get-measured&tab=measured" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">Get measured →</a>
          <a href="/gspc-verify" className="rounded-xl border border-emerald-600/40 px-5 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50">Verify a card →</a>
          <a href="/products" className="rounded-xl border border-emerald-600/40 px-5 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50">Products →</a>
        </div>
      </section>

      {/* What you get — free */}
      <section className="mx-auto max-w-6xl px-6 pt-14 pb-10">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-700">What you get</p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-black">Everything on the rail — free</h2>
          <p className="mt-1 text-sm text-zinc-600">No subscription, no per-seat tier, no checkout. Measurement, not access.</p>
        </div>
        <div className="mt-6 space-y-3">
          {INCLUDED.map((r) => (
            <div key={r.name} className={"flex flex-col gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between " + (r.highlight ? "border-emerald-600/50 bg-emerald-50" : "border-zinc-200 bg-zinc-50")}>
              <div className="sm:max-w-3xl">
                <div className="text-base font-bold text-zinc-900">{r.name}</div>
                <p className="mt-1 text-sm text-zinc-600">{r.desc}</p>
              </div>
              <div className="flex items-baseline gap-1 sm:justify-end">
                <span className="text-2xl font-black text-emerald-600">Free</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          A published card is the portable result — your auditor can verify it independently of us.
        </p>
      </section>

      {/* Capability matrix — all free */}
      <section className="mx-auto max-w-6xl px-6 pt-6 pb-14">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-700">Usage levels</p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-black">Same signed card at every level</h2>
          <p className="mt-1 text-sm text-zinc-600">Levels differ by cadence and controls, not by price. You own your data.</p>
        </div>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-zinc-200">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left">
                <th className="px-4 py-3 font-semibold text-zinc-600"></th>
                <th className="px-4 py-3 text-center font-bold text-zinc-900">Individual</th>
                <th className="px-4 py-3 text-center font-bold text-zinc-900">Team</th>
                <th className="px-4 py-3 text-center font-bold text-zinc-900">Organisation</th>
                <th className="px-4 py-3 text-center font-bold text-zinc-900">Public sector</th>
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((row) => (
                <tr key={row[0]} className="border-b border-zinc-100">
                  <td className="px-4 py-3 text-zinc-700">{row[0]}</td>
                  <td className="px-4 py-3 text-center text-zinc-800">{row[1]}</td>
                  <td className="px-4 py-3 text-center text-zinc-800">{row[2]}</td>
                  <td className="px-4 py-3 text-center text-zinc-800">{row[3]}</td>
                  <td className="px-4 py-3 text-center text-zinc-800">{row[4]}</td>
                </tr>
              ))}
              <tr>
                <td className="px-4 py-4"></td>
                <td className="px-4 py-4 text-center"><a href="/dashboard?task=get-measured&tab=measured" className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500">Get measured</a></td>
                <td className="px-4 py-4 text-center"><a href="/dashboard?task=get-measured&tab=measured" className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500">Get measured</a></td>
                <td className="px-4 py-4 text-center"><a href="/dashboard?task=enterprise-start&tab=measured" className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500">Get measured</a></td>
                <td className="px-4 py-4 text-center"><a href="/contact" className="rounded-lg border border-emerald-600/40 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50">Talk to us</a></td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Not a certification body (cards are verified measurement credentials, not certificates), not an
          observability platform. You own your data. The rail is free; verification is free forever.
        </p>
        <p className="mt-4 text-center text-sm text-zinc-600">
          Need a feed or a corpus? That is Council Ledger and Council Data — on enquiry, never a grade.{" "}
          <a href="/licensing-agreement" className="text-emerald-700 hover:underline">Standing terms</a>
          {" · "}
          <a href="/products" className="text-emerald-700 hover:underline">the products page</a>.
        </p>
      </section>
    </div>
  );
}
