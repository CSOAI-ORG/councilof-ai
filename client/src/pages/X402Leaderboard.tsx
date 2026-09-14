/**
 * /x402-leaderboard — THE x402 Bazaar leaderboard.
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
  rank: number;
  vendor: string;
  host: string;
  doors_listed: number;
  doors_returning_402: number;
  conformance_pct: number;
  accepts_check: string;
  bazaar_check: string;
  preview_check: string;
  price_in_402_only: string;
  price_atomic_listed: number;
  price_atomic_live: number;
  listing_matches_live: string;
  cdp_listed: boolean;
  notes: string;
};

type Leaderboard = {
  schema: string;
  generated_at: string;
  definition: string;
  rankings: DoorRow[];
  competitor_observations: Record<string, unknown>;
  bazaar_audit_summary: Record<string, unknown>;
  ranking_methodology: string;
  doctrine: string[];
  as_of: string;
  source: string;
  proof_command: string;
};

export default function X402Leaderboard() {
  const [board, setBoard] = useState<Leaderboard | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    document.title = "x402 Leaderboard — Council of AI";
    setMetaDescription(
      "x402 Bazaar conformance leaderboard — every door returns 402 with accepts[] and extensions.bazaar. No composite score; every measured field shown verbatim."
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
          <h1 className="text-3xl font-bold">x402 Leaderboard</h1>
          <p className="mt-4 text-rose-400">Error loading: {err}</p>
        </div>
      </div>
    );
  }
  if (!board) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold">x402 Leaderboard</h1>
          <p className="mt-4 text-slate-400">Loading live leaderboard…</p>
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
        <h1 className="mt-3 text-4xl font-bold">x402 Bazaar Leaderboard</h1>
        <p className="mt-4 max-w-3xl text-slate-300">{board.definition}</p>

        <section className="mt-10 rounded-lg border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-xl font-semibold mb-4">Vendor conformance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-800">
                  <th className="py-2 pr-3">Rank</th>
                  <th className="py-2 pr-3">Vendor</th>
                  <th className="py-2 pr-3">Kind</th>
                  <th className="py-2 pr-3">Doors</th>
                  <th className="py-2 pr-3">402</th>
                  <th className="py-2 pr-3">Conform</th>
                  <th className="py-2 pr-3">Accepts</th>
                  <th className="py-2 pr-3">Bazaar</th>
                  <th className="py-2 pr-3">Preview</th>
                  <th className="py-2 pr-3">Price only in 402</th>
                </tr>
              </thead>
              <tbody>
                {board.rankings.map((r) => (
                  <tr key={r.rank} className="border-b border-slate-800/40">
                    <td className="py-2 pr-3 font-mono">{r.rank}</td>
                    <td className="py-2 pr-3">{r.vendor}<br /><span className="font-mono text-xs text-slate-500">{r.host}</span></td>
                    <td className="py-2 pr-3 text-xs">{(r as any).kind || "—"}</td>
                    <td className="py-2 pr-3">{r.doors_listed}</td>
                    <td className="py-2 pr-3">{r.doors_returning_402}/{r.doors_listed}</td>
                    <td className="py-2 pr-3">{r.conformance_pct.toFixed(1)}%</td>
                    <td className="py-2 pr-3">{r.accepts_check}</td>
                    <td className="py-2 pr-3">{r.bazaar_check}</td>
                    <td className="py-2 pr-3">{r.preview_check}</td>
                    <td className="py-2 pr-3">{r.price_in_402_only}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {board.rankings.map((r) => (
            <div key={r.rank} className="mt-4 text-sm text-slate-400 border-t border-slate-800/40 pt-3">
              <strong className="text-slate-200">{r.vendor} ({r.host}):</strong> {r.notes}
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-lg border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-xl font-semibold mb-4">Audit summary</h2>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>Total doors: <code className="font-mono">{String(board.bazaar_audit_summary.total_doors)}</code></li>
            <li>Returning 402: <code className="font-mono">{String(board.bazaar_audit_summary.doors_returning_402)}</code></li>
            <li>With accepts[]: <code className="font-mono">{String(board.bazaar_audit_summary.doors_with_accepts)}</code></li>
            <li>With bazaar extension: <code className="font-mono">{String(board.bazaar_audit_summary.doors_with_bazaar_extension)}</code></li>
            <li>With preview: <code className="font-mono">{String(board.bazaar_audit_summary.doors_with_preview)}</code></li>
            <li>Pricing in 402 only: <code className="font-mono">{String(board.bazaar_audit_summary.pricing_published_only_in_402)}</code></li>
          </ul>
        </section>

        <section className="mt-8 rounded-lg border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-xl font-semibold mb-4">Doctrine</h2>
          <ul className="text-sm text-slate-300 space-y-2">
            {board.doctrine.map((d, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-emerald-400">•</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-slate-400">{board.ranking_methodology}</p>
        </section>

        <section className="mt-8 rounded-lg border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-xl font-semibold mb-4">Prove it yourself</h2>
          <p className="text-sm text-slate-300 font-mono">{board.proof_command}</p>
          <p className="mt-3 text-sm text-slate-400">Generated: <code className="font-mono">{board.generated_at}</code></p>
          <p className="text-sm text-slate-400">Source: <code className="font-mono">{board.source}</code></p>
        </section>

        <div className="mt-10 flex gap-4">
          <Link href="/" className="text-emerald-400 hover:underline">← Home</Link>
          <Link href="/gspc-verify" className="text-emerald-400 hover:underline">Verify a card →</Link>
        </div>
      </div>
    </div>
  );
}
