import { useEffect, useState } from "react";
import { setMetaDescription } from "@/lib/utils";

/**
 * /signals — the signed-signals surface (wave dashboard + per-axis signals + the
 * Value Ledger). Every signal is POD-signed (content_id + Ed25519) and independently
 * verifiable. This page renders the chain reaction as rows, never adjectives.
 */
export default function Signals() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [signals, setSignals] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Signals — signed measurement, verifiable | Council of AI";
    setMetaDescription("The signed signals surface: wave dashboard, per-axis signals, Value Ledger. Every row independently verifiable.");
    Promise.all([
      fetch("/signals/wave-dashboard.signed.json").then((r) => (r.ok ? r.json() : null)),
      fetch("/signals/_index.json").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([dash, idx]) => {
        setDashboard(dash);
        setSignals((idx?.signals || []).filter((s: any) => s.axis));
      })
      .catch((e) => setError(String(e)));
  }, []);

  const WAVE_CHIP: Record<string, string> = {
    MEASURED: "bg-emerald-100 text-emerald-800 border-emerald-300",
    UNVERIFIED: "bg-gray-100 text-gray-600 border-gray-300",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
          The chain reaction as rows, never adjectives
        </p>
        <h1 className="mt-3 text-4xl font-black text-gray-900">Signals</h1>
        <p className="mt-3 max-w-3xl text-gray-600">
          Every signal on this page is <strong>signed</strong> (content_id + Ed25519, did:web
          verification method) and independently verifiable: recompute the canonical body, derive the
          content_id, check the signature. Measurement, not certification — no wave, score, or count
          is claimed without a row (JL.5).
        </p>

        {error && <p className="mt-4 text-sm text-red-600">Signals not yet available: {error}</p>}

        {dashboard && (
          <div className="mt-8 rounded-2xl border border-emerald-600/15 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Wave dashboard</h2>
            <p className="mt-1 text-xs text-gray-500">
              {dashboard.note || dashboard.doctrine || "The chain reaction of the signed estate."}{" "}
              Signed: <code className="font-mono">{dashboard.content_id?.slice(0, 12)}…</code>
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-3 text-left font-semibold">Wave</th>
                    <th className="py-2 px-3 text-left font-semibold">Name</th>
                    <th className="py-2 px-3 text-right font-semibold">Count</th>
                    <th className="py-2 px-3 text-left font-semibold">Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboard.waves || []).map((w: any) => (
                    <tr key={w.wave} className="border-b border-gray-100">
                      <td className="py-2 px-3 font-mono text-gray-500">W{w.wave}</td>
                      <td className="py-2 px-3 font-medium text-gray-800">{w.name}</td>
                      <td className="py-2 px-3 text-right">
                        <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-bold ${WAVE_CHIP[w.register] || "bg-gray-100 text-gray-600"}`}>
                          {w.register} {w.count}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-500">{w.evidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-emerald-600/15 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Per-axis signals (signed)</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {signals.map((s: any) => (
              <a
                key={s.axis}
                href={`/signals/${s.axis}.signed.json`}
                className="rounded-xl border border-emerald-600/10 p-4 hover:bg-emerald-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-gray-900">{s.axis}</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">{s.status}</span>
                </div>
                <p className="mt-1 font-mono text-[11px] text-gray-500">
                  leader {s.elo_leader || "—"} · cid {s.content_id}
                </p>
              </a>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Each opens the signed JSON — verify by recomputing content_id + Ed25519.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <a href="/dashboard?tab=board" className="rounded-xl border border-emerald-600/20 px-4 py-2 font-semibold text-emerald-700 hover:bg-emerald-50">
            The GSPC board →
          </a>
          <a href="/verify-leaderboard" className="rounded-xl border border-emerald-600/20 px-4 py-2 font-semibold text-emerald-700 hover:bg-emerald-50">
            Verify a leaderboard →
          </a>
          <a href="/signals/wave-dashboard.signed.json" className="rounded-xl border border-emerald-600/20 px-4 py-2 font-semibold text-emerald-700 hover:bg-emerald-50">
            Wave dashboard (raw)
          </a>
        </div>
      </div>
    </div>
  );
}
