import { useLayoutEffect } from "react";
import { Link, useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { applyHead, resolveHead, withdrawnName } from "@/lib/seoHead";
import { blogPostBySlug } from "@/lib/blogSeo";
import publishedManifest from "@/data/blog-published.json";

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
 *
 * /blog (2026-11-04): the index route itself stays withdrawn per the reviewed manifest
 * (owner ruling 2026-09-22 keeps a withdrawn record in the reading architecture), but the
 * notice here now lists the posts that DID pass review and serve at their own exact routes
 * (client/src/data/blog-published.json is the source; a slug renders only if its record
 * exists). The withdrawal record and the published state finally live on one page, so a
 * visitor is never sent from "this is withdrawn" to nowhere.
 */
export default function ContentReviewNotice() {
  const [location] = useLocation();
  const slug = location.match(/^\/blog\/([^/?#]+)/)?.[1];
  const name = slug ? blogPostBySlug(slug)?.headline : undefined;
  const head = resolveHead(location, name ? { name } : {});
  const what = name ?? withdrawnName(location);
  const isBlogIndex = location === "/blog" || location === "/blog/";
  const isLearningRoute = /^\/(?:courses(?:\/|$)|my-courses(?:\/|$)|free-course(?:\/|$)|training(?:-hub)?(?:\/|$)|dashboard\/progress(?:\/|$))/.test(location);
  const publishedPosts = isBlogIndex
    ? publishedManifest.published
        .map((p) => blogPostBySlug(p.slug))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
    : [];

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
        {isLearningRoute && (
          <section className="mt-7 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.04] p-5" data-testid="current-academy-learning">
            <h2 className="text-xl font-bold text-emerald-100">Continue with the current Academy</h2>
            <p className="mt-3 leading-7 text-slate-300">
              The current reading tracks and reproducibility exercises are open.
              Legacy course enrollment, payment and completion-record issuance remain closed.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/learn?track=board" className="rounded-xl bg-emerald-400 px-4 py-2.5 font-bold text-slate-950 hover:bg-emerald-300">Start a reading track</Link>
              <a href="/academy/exercises/" className="rounded-xl border border-slate-600 px-4 py-2.5 font-semibold hover:border-slate-400">Reproduce a measurement</a>
              <Link href="/dashboard?tab=evidence-learning" className="rounded-xl border border-slate-600 px-4 py-2.5 font-semibold hover:border-slate-400">Open Evidence &amp; Learning</Link>
            </div>
          </section>
        )}
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

        {publishedPosts.length > 0 && (
          <section
            className="mt-9 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-5"
            data-testid="published-from-manifest"
          >
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-300">
              Published under the reviewed manifest
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              These posts passed review and serve at their own routes. Everything else
              from the legacy corpus stays withdrawn until it is rewritten.
            </p>
            <ul className="mt-4 space-y-2.5">
              {publishedPosts.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/blog/${p.slug}`}
                    className="text-emerald-200 underline decoration-emerald-400/40 underline-offset-4 hover:text-emerald-100"
                  >
                    {p.headline}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </section>
    </section>
  );
}
