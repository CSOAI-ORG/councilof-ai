import { useLayoutEffect } from "react";
import { Link, useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { applyHead, resolveHead, withdrawnName } from "@/lib/seoHead";
import { blogPostBySlug } from "@/lib/blogSeo";

/**
 * The withdrawal notice. One component serves every route in
 * client/src/data/publication-state.json → withdrawn_routes (content-promise-gate binds the two).
 *
 * HEAD. Until 2026-09-16 this shipped one Helmet <title> for all 141 withdrawn routes — and
 * because Helmet fires after the lazy chunk resolves, a snapshot could carry either that shared
 * title or the shell's, depending on timing. The head is now written synchronously from the
 * route: "<what was withdrawn> — withdrawn | Council of AI", with the thing named from the
 * post's own headline where the blog index has it, else from the URL. robots stays noindex:
 * a withdrawal notice is not an article and must not be indexed as one.
 */
export default function ContentReviewNotice() {
  const [location] = useLocation();
  const slug = location.match(/^\/blog\/([^/?#]+)/)?.[1];
  const name = slug ? blogPostBySlug(slug)?.headline : undefined;
  const head = resolveHead(location, name ? { name } : {});
  const what = name ?? withdrawnName(location);

  useLayoutEffect(() => {
    applyHead(head);
  }, [head.path, head.title, head.description]);

  return (
    <section className="min-h-screen bg-slate-950 px-5 py-20 text-slate-100">
      <Helmet>
        <meta name="robots" content="noindex,nofollow,noarchive" />
      </Helmet>
      <section className="mx-auto max-w-3xl rounded-3xl border border-amber-300/25 bg-slate-900/80 p-7 shadow-2xl sm:p-10">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-amber-300">
          Evidence review in progress
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
          This legacy page is temporarily withdrawn.
        </h1>
        <p className="mt-3 text-sm text-slate-400" data-testid="withdrawn-name">
          Withdrawn: <span className="text-slate-200">{what}</span>
        </p>
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
    </section>
  );
}
