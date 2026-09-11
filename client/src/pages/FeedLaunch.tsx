import { Helmet } from "react-helmet-async";
import { Link } from "wouter";

/** G6.6 — pack only. noindex until a 30-day RLUSD streak exists. No typed seat price. */
export default function FeedLaunch() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-16 text-slate-100">
      <Helmet>
        <title>Feed door (draft) | Council of AI</title>
        <meta name="robots" content="noindex,nofollow,noarchive" />
      </Helmet>
      <section className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-amber-300">
          Draft · publish the day the streak completes · amount only in 402
        </p>
        <h1 className="mt-3 text-3xl font-black">Measurement feed</h1>
        <p className="mt-4 leading-7 text-slate-300">
          One stream of signed cards (stablecoin watch, impersonation mismatches, corrections).
          Data on the public board stays free. A feed subscription is a paid proof door: the
          amount lives in the HTTP 402 <code>accepts[]</code> challenge, not on this page.
          Subscribe-via-x402 is the button; this TUI does not invent a checkout.
        </p>
        <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-slate-300">
          <li>30-day RLUSD streak as the existence proof (not started until TUI-3 G3.1/G3.2 land).</li>
          <li>Top-20 deep rows as content, INDEXED vs MEASURED labelled.</li>
          <li>Alert examples: issuer mismatch, attestation stale, JMWH concentration flag.</li>
        </ul>
        <p className="mt-8 text-sm text-slate-400">
          Live till:{" "}
          <Link href="/status" className="text-emerald-300 underline">
            /status
          </Link>
          . Receipt:{" "}
          <Link href="/receipt" className="text-emerald-300 underline">
            /receipt
          </Link>
          . Measurement, not certification.
        </p>
      </section>
    </main>
  );
}
