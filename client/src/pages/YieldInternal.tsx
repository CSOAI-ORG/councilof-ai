import { Helmet } from "react-helmet-async";
import { Link } from "wouter";

/**
 * Weekly scorecard template (EPIC PLAYS Part 5). No typed yield numbers.
 * Fill from live /status and /api/revenue. noindex.
 */
export default function YieldInternal() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-16 text-slate-100">
      <Helmet>
        <title>Weekly yield template | Council of AI</title>
        <meta name="robots" content="noindex,nofollow,noarchive" />
      </Helmet>
      <section className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-500">
          Template · derived from /status · never typed
        </p>
        <h1 className="mt-3 text-3xl font-black">Weekly scorecard</h1>
        <p className="mt-4 text-sm leading-6 text-slate-300">
          Copy this table from live doors. Do not type a settlement count that /api/revenue
          does not show. Dash until a non-self payer exists.
        </p>
        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-left text-xs uppercase text-slate-500">
              <th className="py-2">Meter</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody className="font-mono text-xs text-slate-300">
            <tr className="border-b border-slate-800">
              <td className="py-2">public_count / 22 axes</td>
              <td>/api/gspc</td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="py-2">card_count + as_of</td>
              <td>/root.json</td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="py-2">non-self payers / settlements</td>
              <td>/api/revenue (dash if 0)</td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="py-2">regulation verified_as_of</td>
              <td>/api/regulation</td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="py-2">XRPL credentials</td>
              <td>0 until EP5</td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="py-2">days-clean</td>
              <td>parity job (TUI-1)</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-6 text-sm">
          Public view:{" "}
          <Link href="/status" className="text-emerald-300 underline">
            /status
          </Link>
        </p>
      </section>
    </main>
  );
}
