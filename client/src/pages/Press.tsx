import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";

/**
 * A deliberately small local read. /status has a full parser for this payload,
 * but it lives on its own branch and one PR does not depend on another's
 * unmerged file. This page needs two things: the headline sentence and how
 * many domains reported.
 */
type StateRead =
  | { state: "live"; headline: string | null; kind: string | null; asOf: string | null; domains: number }
  | { state: "unread"; reason: string };

function readMinimal(doc: unknown): StateRead {
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
    return { state: "unread", reason: "no document" };
  }
  const root = doc as Record<string, unknown>;
  const pc = root.public_count as Record<string, unknown> | undefined;
  const skip = new Set(["schema", "title", "contract", "not_covered", "doctrine", "public_count"]);
  // A domain counts only if it carries at least one quotable {value} cell.
  const domains = Object.entries(root).filter(([k, v]) => {
    if (skip.has(k) || !v || typeof v !== "object" || Array.isArray(v)) return false;
    return Object.values(v as Record<string, unknown>).some(
      (c) => !!c && typeof c === "object" && !Array.isArray(c) && "value" in (c as object),
    );
  }).length;
  if (!domains) return { state: "unread", reason: "no quotable fields" };
  const as = (x: unknown) => (typeof x === "string" ? x : x == null ? null : String(x));
  return {
    state: "live",
    headline: pc ? as(pc.value) : null,
    kind: pc ? as(pc.kind) : null,
    asOf: pc ? as(pc.as_of) : null,
    domains,
  };
}

/**
 * /press — what a journalist can check, not a press release.
 *
 * K07. Until 2026-09-06 this route rendered ContentReviewNotice, the same
 * "temporarily withdrawn" page as ~90 other retired paths, while /interop and
 * /dashboard/games each carried their own bespoke static template. Three
 * surfaces, three templates, none of them the site's.
 *
 * The two static pages could not become SPA routes — Cloudflare Pages serves a
 * real file for /interop/ and a route would never be reached — so they are now
 * generated from ONE template by scripts/build-static-pages.mjs. /press is the
 * one of the three that can use the site's own chrome, so it does.
 *
 * NOTHING ON THIS PAGE IS WRITTEN COPY ABOUT OURSELVES. There is no boilerplate
 * paragraph, no milestone, no quote, no logo pack, no claim of adoption or
 * partnership. Every figure is read live from GET /api/state, which exists to
 * be quoted, and the rest is the entity's own filed record. A press page is
 * exactly where an unverifiable sentence would do the most damage.
 */

const FILED = [
  ["Registered name", "CSOAI Ltd"],
  ["Company number", "16939677 (England & Wales)"],
  ["Registered office", "3rd Floor, 86-90 Paul Street, London EC2A 4NE"],
  ["Enquiries", "nicholas@csoai.org"],
] as const;

export default function Press() {
  const [read, setRead] = useState<StateRead>({ state: "unread", reason: "not read yet" });

  useEffect(() => {
    let alive = true;
    void fetch("/api/state", { headers: { accept: "application/json" }, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then((j) => alive && setRead(readMinimal(j)))
      .catch((err: Error) => alive && setRead({ state: "unread", reason: err.message }));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-16 text-slate-100">
      <Helmet>
        <title>Press — what you can check | Council of AI</title>
        <meta
          name="description"
          content="Council of AI for journalists: the filed entity record, the live measured counts read from GET /api/state, the corrections ledger, and what we explicitly do not claim."
        />
      </Helmet>

      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-300">
          Press · what you can check
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
          There is no press release here.
        </h1>
        <p className="mt-4 leading-7 text-slate-300">
          Council of AI measures AI systems against frozen, published tests, signs the result, and
          publishes the evidence. We do not certify, and we do not sell a rank. Rather than describe
          ourselves, this page points at the things you can open yourself — including the record of
          where we have been wrong.
        </p>

        <section className="mt-10" data-testid="press-live">
          <h2 className="text-xl font-bold">The live numbers</h2>
          <p className="mt-1 text-sm text-slate-400">
            Read from <code className="text-slate-300">GET /api/state</code> when this page loaded.
            Nothing is typed here, so nothing here can go stale.
          </p>
          {read.state === "unread" ? (
            <p className="mt-3 rounded-xl border border-amber-300/30 bg-amber-950/20 p-4 text-slate-300">
              <code className="text-slate-200">/api/state</code> did not answer ({read.reason}), so
              no figure is shown. That is not the same as zero.
            </p>
          ) : (
            <>
              {read.headline ? (
                <div className="mt-3 rounded-xl border border-emerald-400/25 bg-emerald-950/25 p-4">
                  <div className="text-2xl font-black text-emerald-200">{read.headline}</div>
                  <div className="mt-1 font-mono text-[11px] text-emerald-300/70">
                    public_count · {read.kind}
                    {read.asOf ? ` · as at ${read.asOf}` : ""}
                  </div>
                </div>
              ) : null}
              <p className="mt-3 text-sm text-slate-400">
                {read.domains} domains are reported, each naming the committed artifact it
                speaks for. A declared slot, a catalogue entry and a verified measurement are
                different kinds of fact and are never added together — the full breakdown is on{" "}
                <Link href="/status" className="text-emerald-300 underline">
                  /status
                </Link>
                .
              </p>
            </>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold">Where we have been wrong</h2>
          <p className="mt-2 leading-7 text-slate-300">
            The corrections ledger is public and append-only at{" "}
            <a href="/api/corrections" className="text-emerald-300 underline">
              GET /api/corrections
            </a>
            . It includes a verification of our own that could not observe failure. If a claim of
            ours does not survive your checking, that is a defect and we want it —{" "}
            <Link href="/dispute" className="text-emerald-300 underline">
              /dispute
            </Link>
            .
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold">What we do not claim</h2>
          <ul className="mt-3 space-y-2 leading-7 text-slate-300">
            <li>· Not a certification, a conformity mark, or a legal determination.</li>
            <li>· Not legal advice, and not a compliance sign-off.</li>
            <li>· A measurement describes one signed run on a frozen bank — not a model's worth.</li>
            <li>· Slots we have not measured stay empty and are named. Absence is never a zero.</li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold">The filed record</h2>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            {FILED.map(([k, v]) => (
              <div key={k} className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-3">
                <dt className="text-[11px] uppercase tracking-wider text-slate-400">{k}</dt>
                <dd className="mt-1 text-slate-100">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-slate-400">
            We have no logo pack, no media kit and no customer list to hand out. If you need
            something specific, ask and we will say plainly whether it exists.
          </p>
        </section>

        <section className="mt-10 border-t border-slate-800 pt-6">
          <h2 className="text-xl font-bold">Open these</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/status" className="rounded-xl border border-slate-600 px-4 py-2.5 font-semibold hover:border-slate-400">
              What we can establish
            </Link>
            <Link href="/honesty" className="rounded-xl border border-slate-600 px-4 py-2.5 font-semibold hover:border-slate-400">
              The honesty gate
            </Link>
            <Link href="/gspc-verify" className="rounded-xl border border-slate-600 px-4 py-2.5 font-semibold hover:border-slate-400">
              Verify a card yourself
            </Link>
            <Link href="/refutation-ledger" className="rounded-xl border border-slate-600 px-4 py-2.5 font-semibold hover:border-slate-400">
              Corrections
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
