import { Link } from "wouter";
import { Helmet } from "react-helmet-async";

export default function ContentReviewNotice() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-20 text-slate-100">
      <Helmet>
        <title>Evidence review in progress | Council of AI</title>
        <meta name="robots" content="noindex,nofollow,noarchive" />
      </Helmet>
      <section className="mx-auto max-w-3xl rounded-3xl border border-amber-300/25 bg-slate-900/80 p-7 shadow-2xl sm:p-10">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-amber-300">
          Evidence review in progress
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
          This legacy page is temporarily withdrawn.
        </h1>
        <p className="mt-5 leading-7 text-slate-300">
          Generated content and legacy prototype pages mixed indicative mappings or mock data
          with claims about live services, legal applicability, signing,
          partnerships, or certification. We have removed them from the public
          decision path until each claim has a source, scope, date, and evidence state.
        </p>
        <p className="mt-4 leading-7 text-slate-300">
          Nothing withdrawn here should be treated as legal advice, a compliance
          determination, a certification, or proof that a Council runtime operated.
          The underlying files remain preserved for correction and review.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard?tab=board" className="rounded-xl bg-emerald-400 px-4 py-2.5 font-bold text-slate-950 hover:bg-emerald-300">
            Open the measured board
          </Link>
          <Link href="/gspc-verify" className="rounded-xl border border-slate-600 px-4 py-2.5 font-semibold hover:border-slate-400">
            Verify a published card
          </Link>
          <Link href="/refutation-ledger" className="rounded-xl border border-slate-600 px-4 py-2.5 font-semibold hover:border-slate-400">
            Read corrections
          </Link>
        </div>
      </section>
    </main>
  );
}
