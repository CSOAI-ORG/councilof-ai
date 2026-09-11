import { Helmet } from "react-helmet-async";
import { Link } from "wouter";

export default function ClaritySpecimen() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-16 text-slate-100">
      <Helmet>
        <title>CLARITY pre-commit specimen (unsigned) | Council of AI</title>
        <meta
          name="description"
          content="Unsigned pre-commit: market-implied vs hype-implied CLARITY divergence, outcome 16 Sep 2026. Not advice."
        />
      </Helmet>
      <section className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-amber-300">
          Unsigned artifact · publisher queue
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">CLARITY pre-commit</h1>
        <p className="mt-4 leading-7 text-slate-300">
          This page is public before 15 Sep 2026 19:00 UTC. It is{" "}
          <strong>not signed</strong>. The GHA publisher must sign the JSON before it is a
          card. Until then it is an unsigned specimen in the queue, labeled THIN.
        </p>
        <p className="mt-4 leading-7 text-slate-300">
          Claim: market-implied move on a CLARITY-related headline is on the order of 15–18
          percent in the cited tape; hype-implied narratives of +40,000 percent / $30T are a
          different quantity. Outcome card 16 Sep 2026 either way. Not investment advice. No
          token. No issuance.
        </p>
        <p className="mt-6 font-mono text-sm">
          <a className="text-emerald-300 underline" href="/specimens/clarity-precommit-2026-09-15.json">
            /specimens/clarity-precommit-2026-09-15.json
          </a>
        </p>
        <p className="mt-8 text-sm text-slate-400">
          Board:{" "}
          <Link href="/dashboard?tab=board" className="text-emerald-300 underline">
            /dashboard?tab=board
          </Link>
        </p>
      </section>
    </main>
  );
}
