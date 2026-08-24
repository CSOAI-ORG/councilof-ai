import { useEffect } from "react";
import { Link } from "wouter";

const STEPS = [
  {
    step: "1",
    title: "Identify the artefact",
    body: "Name the signed card, board cell, crosswalk row, or cross-border measurement you contest. A challenge needs standing and a specific claim — not a general objection to AI governance.",
  },
  {
    step: "2",
    title: "Re-measurement, not debate",
    body: "We re-run the frozen instrument exactly as published — same items, same scoring code, same seed discipline — and publish the re-run as a new signed record. Cross-border challenges use the same rule: one measurement, mapped regimes, append-only corrections.",
  },
  {
    step: "3",
    title: "Published correction",
    body: "If we were wrong, the correction is published on the same surface the original was — superseded, never deleted. The refutation ledger and /api/corrections stay append-only.",
  },
  {
    step: "4",
    title: "Redress path (JC-D4)",
    body: "At least one level of internal review above the original decision. External judicial review is never closed off. East-West measurements are challengeable the same way domestic ones are — power must be checked, including ours.",
  },
];

export default function Challenge() {
  useEffect(() => {
    document.title = "Challenge a measurement — East-West redress | Council of AI";
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf7] text-[#0c1a12]">
      <div className="mx-auto max-w-3xl px-5 py-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">JC-D4 · East-West redress</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Challenge a cross-border measurement</h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-700">
          Every signed measurement on this estate is reviewable — including East-West cards and crosswalk mappings.
          If you contest a result, this is the path. The answer is always a re-measurement, never a defence.
        </p>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <strong>Determination stays with authorities.</strong> CSOAI measures and signs; regulators and accredited
          bodies decide conformity. A challenge tests the measurement, not the law.
        </div>

        <ol className="mt-8 space-y-5">
          {STEPS.map((s) => (
            <li key={s.step} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Step {s.step}</p>
              <h2 className="mt-1 text-lg font-bold">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm">
          <p className="font-semibold text-emerald-900">How to file</p>
          <p className="mt-2 text-emerald-800">
            Email <a className="underline" href="mailto:nicholas@csoai.org?subject=East-West%20measurement%20challenge">nicholas@csoai.org</a> with
            the content_id, URL of the contested artefact, and the specific claim. Or use the general{" "}
            <Link href="/dispute" className="underline font-semibold">appeals &amp; dispute resolution</Link> path —
            Charter Article 18 applies to every published result.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/east-west/" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">East-West flagship →</Link>
          <Link href="/gspc-verify/" className="rounded-xl border border-emerald-600 px-5 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50">Verify before you challenge →</Link>
        </div>
      </div>
    </div>
  );
}
