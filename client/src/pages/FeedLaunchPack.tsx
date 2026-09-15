import { Helmet } from "react-helmet-async";

/**
 * /feed — the Stablewatch Feed offer page.
 *
 * G6.6: "The offer page: 30-day RLUSD streak as proof, stablewatch
 * top-20 as content, alert examples, subscribe-via-x402 button."
 *
 * Pricing is returned by the x402 challenge, never declared on the public
 * surface (HO.2: verification is free forever, no grade is sold).
 *
 * noindex,nofollow,noarchive until the 30-day streak completes. The page is
 * publishable on day 1; it goes indexed on day 30.
 *
 * Measurement, not certification. Cancel anytime.
 */

const ALERT_EXAMPLES = [
  {
    kind: "Price depeg",
    description:
      "RLUSD/USD deviates >50 bps from the published target. Alert fires at the close of the measurement window, not on a ticker.",
    severity: "HIGH",
  },
  {
    kind: "New issuer",
    description:
      "A new stablecoin issuer enters the top-20 by supply. You get the name, chain, and the first measurement card — indexed, not yet measured.",
    severity: "MEDIUM",
  },
  {
    kind: "Supply anomaly",
    description:
      "7-day supply change exceeds 10 % for any top-20 asset. Not a rating — a delta measurement with the source chain data.",
    severity: "HIGH",
  },
] as const;

export default function FeedLaunchPack() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <Helmet>
        <title>Council of AI — Stablewatch Feed</title>
        <meta
          name="description"
          content="30-day RLUSD measurement streak, stablecoin top-20 deep measurement, alert examples. Subscribe via x402. Measurement, not certification."
        />
        <meta name="robots" content="noindex,nofollow,noarchive" />
      </Helmet>

      {/* Hero */}
      <header className="border-b border-slate-800 px-5 py-16">
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-300">
            Stablewatch Feed
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Council of AI — Stablewatch Feed
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">
            30 days of daily RLUSD measurement, the stablecoin top-20 deep
            index, and real-time alerts — all signed, all verifiable.
            Paid via x402. Cancel anytime.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-16 px-5 py-16">
        {/* Section 1: 30-day RLUSD streak */}
        <section>
          <h2 className="text-2xl font-bold tracking-tight">
            30-Day RLUSD Measurement Streak
          </h2>
          <p className="mt-3 text-slate-300">
            Every day for 30 consecutive days, the estate publishes a signed
            measurement card for RLUSD — supply, chain distribution, attestation
            status, and the delta from the prior day. The streak is the proof:
            daily measurement, not a one-off report.
          </p>

          {/* Streak grid placeholder */}
          <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900/60 p-6">
            <p className="font-mono text-xs uppercase tracking-wide text-slate-500">
              30-day streak (data placeholder)
            </p>
            <div className="mt-4 grid grid-cols-10 gap-1.5 sm:grid-cols-15">
              {Array.from({ length: 30 }, (_, i) => (
                <div
                  key={i}
                  className={`h-6 w-6 rounded-sm ${
                    i < 12
                      ? "bg-emerald-500"
                      : i < 20
                        ? "bg-emerald-800"
                        : "bg-slate-800"
                  }`}
                  title={`Day ${i + 1}`}
                />
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-400">
              <span className="font-semibold text-emerald-400">12</span> days
              measured · <span className="font-semibold text-emerald-700">8</span>{" "}
              in progress · <span className="font-semibold text-slate-600">10</span>{" "}
              pending. Counts are placeholder until the streak completes.
            </p>
          </div>
        </section>

        {/* Section 2: Stablecoin top-20 */}
        <section>
          <h2 className="text-2xl font-bold tracking-tight">
            Stablecoin Top-20 Deep Measurement
          </h2>
          <p className="mt-3 text-slate-300">
            The Stablewatch index covers the top-20 stablecoins by circulating
            supply. Each asset gets a measurement card: supply chain data,
            attestation state, settlement surface, and the delta from the
            prior window.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-3 pr-4">#</th>
                  <th className="pb-3 pr-4">Asset</th>
                  <th className="pb-3 pr-4">Chain</th>
                  <th className="pb-3 pr-4">Index state</th>
                  <th className="pb-3">Measurement</th>
                </tr>
              </thead>
              <tbody className="font-mono text-slate-300">
                {[
                  { rank: 1, asset: "USDT", chain: "Ethereum", state: "MEASURED", msr: "✓ signed" },
                  { rank: 2, asset: "USDC", chain: "Ethereum", state: "MEASURED", msr: "✓ signed" },
                  { rank: 3, asset: "USDS", chain: "Ethereum", state: "INDEXED", msr: "pending" },
                  { rank: 4, asset: "DAI", chain: "Ethereum", state: "MEASURED", msr: "✓ signed" },
                  { rank: 5, asset: "RLUSD", chain: "XRPL + Ethereum", state: "MEASURED", msr: "✓ signed" },
                ].map((r) => (
                  <tr key={r.rank} className="border-b border-slate-800">
                    <td className="py-3 pr-4 text-slate-500">{r.rank}</td>
                    <td className="py-3 pr-4 font-semibold text-slate-100">{r.asset}</td>
                    <td className="py-3 pr-4">{r.chain}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs ${
                          r.state === "MEASURED"
                            ? "bg-emerald-900 text-emerald-300"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {r.state}
                      </span>
                    </td>
                    <td className="py-3">{r.msr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Showing 5 of 20. Full data:{" "}
            <a
              href="/api/gspc"
              className="font-mono text-emerald-400 underline underline-offset-4"
            >
              /api/gspc
            </a>{" "}
            · Stablecoin readiness:{" "}
            <a
              href="/stablecoins"
              className="font-mono text-emerald-400 underline underline-offset-4"
            >
              /stablecoins
            </a>
          </p>
        </section>

        {/* Section 3: Alert examples */}
        <section>
          <h2 className="text-2xl font-bold tracking-tight">Alert Examples</h2>
          <p className="mt-3 text-slate-300">
            When something changes in the stablecoin top-20, you get an alert.
            Here are the three primary alert types:
          </p>
          <div className="mt-6 space-y-4">
            {ALERT_EXAMPLES.map((alert) => (
              <div
                key={alert.kind}
                className="rounded-xl border border-slate-700 bg-slate-900/60 p-5"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${
                      alert.severity === "HIGH"
                        ? "bg-rose-900 text-rose-300"
                        : "bg-amber-900 text-amber-300"
                    }`}
                  >
                    {alert.severity}
                  </span>
                  <h3 className="font-bold">{alert.kind}</h3>
                </div>
                <p className="mt-2 text-sm text-slate-300">{alert.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-xl border border-emerald-700 bg-emerald-950/40 p-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Subscribe via x402 — see challenge for terms
          </h2>
          <p className="mt-3 text-slate-300">
            Payment via the x402 rail. A signed receipt is issued at settlement.
            Cancel anytime — no lock-in, no annual commitment.
          </p>
          <a
            href="/api/subscribe"
            className="mt-6 inline-block rounded-xl bg-emerald-400 px-8 py-3.5 text-lg font-bold text-slate-950 hover:bg-emerald-300"
          >
            Subscribe via x402 — see challenge for terms
          </a>
          <p className="mt-4 font-mono text-xs text-slate-500">
            Settlement on Base (USDC). Receipt signed by did:web:csoai.org#board-attestation-1
          </p>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800 pt-8 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
            Measurement, not certification. Cancel anytime.
          </p>
          <p className="mt-4 text-sm">
            <a href="/" className="text-emerald-400 underline">
              Council of AI
            </a>
            {" · "}
            <a href="/proof-receipt" className="text-emerald-400 underline">
              Receipt status
            </a>
            {" · "}
            <a href="/stablecoins" className="text-emerald-400 underline">
              Stablecoins
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
