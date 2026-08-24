import { useState } from "react";
import { Link } from "wouter";

/**
 * ChallengeDoor — the measured-subject redress door. A party named in a published
 * measurement (a signed card, a crosswalk row, a board entry, a findings grade) can
 * challenge it here. We receipt and route it; resolution rows feed the Value Ledger.
 * Doctrine: measurement-not-certification — a challenge is an objection to a measured
 * claim, never an appeal to a certification authority.
 */
export default function ChallengeDoor() {
  const [targetType, setTargetType] = useState("card");
  const [target, setTarget] = useState("");
  const [reason, setReason] = useState("");
  const [challenger, setChallenger] = useState("");
  const [receipt, setReceipt] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/60">Council OS · redress</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Challenge a measurement.</h1>
      <p className="mt-3 text-emerald-100/80">
        If a published measurement names you (a signed card, a crosswalk row, a board entry,
        or a findings grade), you can challenge it here. We receipt the challenge and route
        it to resolution — upheld, corrected, or rejected-with-reasons. That resolution feeds
        the Value Ledger. <b>Measurement, not certification.</b> Determination stays with the
        authorities; we never certify and never arbitrate a regulation.
      </p>

      <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          {["card", "crosswalk", "board", "findings"].map((t) => (
            <button key={t} onClick={() => setTargetType(t)}
              className={`rounded-full px-4 py-1.5 text-sm ${targetType === t ? "bg-emerald-500 font-bold text-[#03110b]" : "border border-emerald-500/25 text-emerald-200/80"}`}>
              {t}
            </button>
          ))}
        </div>
        <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="target (card/crosswalk/row content_id)"
          className="w-full rounded-xl border border-emerald-500/30 bg-black/40 px-4 py-3 text-emerald-50 placeholder-emerald-300/30 focus:border-emerald-400 focus:outline-none" />
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="why is the measurement contended?" rows={4}
          className="mt-3 w-full rounded-xl border border-emerald-500/30 bg-black/40 px-4 py-3 text-emerald-50 placeholder-emerald-300/30 focus:border-emerald-400 focus:outline-none" />
        <input value={challenger} onChange={(e) => setChallenger(e.target.value)} placeholder="challenger (contact, optional — anonymous ok)"
          className="mt-3 w-full rounded-xl border border-emerald-500/30 bg-black/40 px-4 py-3 text-emerald-50 placeholder-emerald-300/30 focus:border-emerald-400 focus:outline-none" />
        <button onClick={submit} disabled={submitting || !target || !reason}
          className="mt-4 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-[#03110b] hover:bg-emerald-400 disabled:opacity-50">
          {submitting ? "Submitting…" : "Submit challenge (signed receipt)"}
        </button>
        {err && <p className="mt-3 text-sm text-rose-400">{err}</p>}
        {receipt && (
          <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
            <p className="font-bold text-emerald-100">✓ challenge receipted</p>
            <p className="mt-1 font-mono text-xs text-emerald-300/70">content_id: {receipt.content_id}</p>
            <p className="mt-1 text-xs text-emerald-300/60">stored: {receipt.stored === false ? "no (receipt proves receipt, not a registry)" : "yes"}</p>
            <p className="mt-2 text-xs text-emerald-200/70">Resolution (upheld / corrected / rejected-with-reasons) feeds the Value Ledger.</p>
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-emerald-300/60">
        <Link to="/gspc-verify" className="underline hover:text-emerald-200">Verify a measurement</Link> ·{" "}
        <Link to="/gspc-arena" className="underline hover:text-emerald-200">See the board</Link> ·{" "}
        <Link to="/regulator-findings" className="underline hover:text-emerald-200">Regulator findings</Link>
      </p>
    </div>
  );
}
