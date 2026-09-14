/**
 * /x402-leaderboard — observed x402 challenge board (legacy route name).
 *
 * Doctrine: rankings are the disease this board corrects. No single-number composite.
 * Every door's live 402 status is shown verbatim. Prices come from the live 402 challenge,
 * never from a typed catalog surface. Bazaar extension presence is a binary gate, not
 * a score. CDP (Content Delivery Platform) is always absent until OWNER-ASKS #2.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";

type DoorRow = {
  url: string;
  http_status: number;
  accepts_count: number;
  network: string | null;
  amount_atomic: string | number | null;
  asset: string | null;
  bazaar_extension: boolean;
};

type Leaderboard = {
  schema: string;
  observed_at: string;
  definition: string;
  scope: { operator: string; host: string; discovery_url: string };
  summary: { doors_observed: number; doors_conforming: number };
  doors: DoorRow[];
  methodology: string;
  limitations: string[];
  proof_command: string;
};

export default function X402Leaderboard() {
  const [board, setBoard] = useState<Leaderboard | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    document.title = "x402 Conformance Board — Council of AI";
    setMetaDescription(
      "Observed x402 challenge fields for Council of AI discovery resources. A timestamped measurement snapshot, not a grade or certification."
    );
    fetch("/interop/x402-leaderboard/latest.json")
      .then((r) => r.json())
      .then((d: Leaderboard) => setBoard(d))
      .catch((e) => setErr(String(e)));
  }, []);

  if (err) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold">x402 Conformance Board</h1>
          <p className="mt-4 text-rose-400">Error loading: {err}</p>
        </div>
      </div>
    );
  }
  if (!board) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold">x402 Conformance Board</h1>
          <p className="mt-4 text-slate-400">Loading the latest observation…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <p className="font-mono text-xs uppercase tracking-widest text-emerald-400">
          Measurement, never certification
        </p>
        <h1 className="mt-3 text-4xl font-bold">x402 Conformance Board</h1>
        <p className="mt-4 max-w-3xl text-slate-300">{board.definition}</p>

        <section className="mt-10 rounded-lg border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-xl font-semibold mb-2">Observed doors</h2>
          <p className="mb-4 text-sm text-slate-400">{board.summary.doors_conforming}/{board.summary.doors_observed} met the stated predicate at {board.observed_at}.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-800">
                  <th className="py-2 pr-3">Resource</th>
                  <th className="py-2 pr-3">HTTP</th>
                  <th className="py-2 pr-3">Accepts</th>
                  <th className="py-2 pr-3">Network</th>
                  <th className="py-2 pr-3">Asset</th>
                  <th className="py-2 pr-3">Atomic amount</th>
                  <th className="py-2 pr-3">Bazaar</th>
                </tr>
              </thead>
              <tbody>
                {board.doors.map((r) => (
                  <tr key={r.url} className="border-b border-slate-800/40">
                    <td className="py-2 pr-3 font-mono text-xs">{new URL(r.url).pathname}</td>
                    <td className="py-2 pr-3">{r.http_status}</td>
                    <td className="py-2 pr-3">{r.accepts_count}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{r.network ?? "—"}</td>
                    <td className="py-2 pr-3">{r.asset ?? "—"}</td>
                    <td className="py-2 pr-3 font-mono">{r.amount_atomic ?? "—"}</td>
                    <td className="py-2 pr-3">{r.bazaar_extension ? "PASS" : "MISSING"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-xl font-semibold mb-4">Method</h2>
          <p className="text-sm text-slate-300">{board.methodology}</p>
        </section>

        <section className="mt-8 rounded-lg border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-xl font-semibold mb-4">Limits</h2>
          <ul className="text-sm text-slate-300 space-y-2">
            {board.limitations.map((d, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-emerald-400">•</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8 rounded-lg border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-xl font-semibold mb-4">Prove it yourself</h2>
          <p className="text-sm text-slate-300 font-mono">{board.proof_command}</p>
          <p className="mt-3 text-sm text-slate-400">Observed: <code className="font-mono">{board.observed_at}</code></p>
          <p className="text-sm text-slate-400">Discovery: <code className="font-mono">{board.scope.discovery_url}</code></p>
        </section>

        <div className="mt-10 flex gap-4">
          <Link href="/" className="text-emerald-400 hover:underline">← Home</Link>
          <Link href="/gspc-verify" className="text-emerald-400 hover:underline">Verify a card →</Link>
        </div>
      </div>
    </div>
  );
}
