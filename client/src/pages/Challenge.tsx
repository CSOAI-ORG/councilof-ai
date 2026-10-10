import { useEffect, useState } from "react";
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
    body: "Today the owner of CSOAI Ltd reviews every challenge; there is no independent arbiter yet. Outcomes go in the public corrections ledger. External judicial review is never closed off. East-West measurements are challengeable the same way domestic ones are.",
  },
];

export default function Challenge() {
  const [targetType, setTargetType] = useState("card");
  const [target, setTarget] = useState("");
  const [reason, setReason] = useState("");
  const [challenger, setChallenger] = useState("");
  const [receipt, setReceipt] = useState<{ content_id?: string; stored?: boolean } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Challenge a measurement — East-West redress | Council of AI";
  }, []);

  const submit = async () => {
    setSubmitting(true);
    setErr(null);
    try {
      const r = await fetch("/api/challenge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetType, target, reason, challenger: challenger || "anonymous" }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || d.error || `${r.status}`);
      setReceipt(d);
    } catch (e) {
      setErr(String(e));
    } finally {
      setSubmitting(false);
    }
  };

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

        <div className="mt-10 rounded-xl border border-emerald-200 bg-[#05140d] p-5 text-sm text-emerald-50">
          <p className="font-semibold text-emerald-200">Get a receipt for a challenge</p>
          <p className="mt-1 text-xs text-emerald-100/80" data-testid="challenge-not-recorded">
            This form issues a receipt only. Challenges sent here are not yet recorded, so nobody will
            see one unless you also email it to{" "}
            <a className="underline" href="mailto:nicholas@csoai.org?subject=Measurement%20challenge">nicholas@csoai.org</a>.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["card", "crosswalk", "board", "findings"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTargetType(t)}
                className={`rounded-full px-3 py-1 text-xs ${targetType === t ? "bg-emerald-500 font-bold text-[#03110b]" : "border border-emerald-500/30"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            aria-label="Contested measurement record or URL" placeholder="target content_id or URL"
            className="mt-3 w-full rounded-lg border border-emerald-500/30 bg-black/40 px-3 py-2 text-sm"
          />
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            aria-label="Reason for the challenge" placeholder="why is the measurement contended?"
            rows={3}
            className="mt-2 w-full rounded-lg border border-emerald-500/30 bg-black/40 px-3 py-2 text-sm"
          />
          <input
            value={challenger}
            onChange={(e) => setChallenger(e.target.value)}
            aria-label="Contact details (optional)" placeholder="contact (optional)"
            className="mt-2 w-full rounded-lg border border-emerald-500/30 bg-black/40 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={submit}
            disabled={submitting || !target || !reason}
            className="mt-3 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-[#03110b] disabled:opacity-50"
          >
            {submitting ? "Requesting…" : "Get a receipt"}
          </button>
          {err && <p className="mt-2 text-rose-300">{err}</p>}
          {receipt && (
            <p className="mt-2 font-mono text-xs text-emerald-300">
              receipt · content_id: {receipt.content_id} ·{" "}
              {receipt.stored ? "recorded" : "not yet recorded: email nicholas@csoai.org with this content_id"}
            </p>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm">
          <p className="font-semibold text-emerald-900">How to file</p>
          <p className="mt-2 text-emerald-800">
            Email <a className="underline" href="mailto:nicholas@csoai.org?subject=East-West%20measurement%20challenge">nicholas@csoai.org</a> with
            the content_id, URL of the contested artefact, and the specific claim. Or use the general{" "}
            <Link href="/dispute" className="underline font-semibold">appeals &amp; dispute resolution</Link> path —
            Charter Article 18 applies to every published result.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/east-west/" className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">East-West flagship →</Link>
          <Link href="/gspc-verify/" className="rounded-xl border border-emerald-600 px-5 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50">Verify before you challenge →</Link>
        </div>
      </div>
    </div>
  );
}
