import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";

// G1.5 merge-train conductor (2026-09-12 brief): every green PR, one-liner,
// done-when curls, bake order. Data is derived live from the public GitHub API
// in the viewer's browser (unauthenticated: 60 req/h/IP — this page uses
// 1 + 1/PR calls per load). Never a merge authorization: Nick merges top-to-bottom.

type PrRow = {
  number: number;
  title: string;
  branch: string;
  sha: string;
  createdAt: string;
  checks: { pass: number; fail: number; pending: number; total: number } | null;
  doneWhen: string[];
};

const REPO = "CSOAI-ORG/councilof-ai";

function extractDoneWhen(body: string | null): string[] {
  if (!body) return [];
  const lines = body.split("\n");
  const out: string[] = [];
  for (const ln of lines) {
    const t = ln.trim().replace(/^[-*>\s]+/, "");
    if (/^curl\s/i.test(t) || /^https?:\/\/\S+$/.test(t)) out.push(t);
    if (out.length >= 4) break;
  }
  return out;
}

function bakeRank(r: PrRow): number {
  // green first (0), then pending (1), then red (2), then unprobed (3); oldest first within tier.
  if (!r.checks) return 3;
  if (r.checks.fail > 0) return 2;
  if (r.checks.pending > 0) return 1;
  if (r.checks.total > 0) return 0;
  return 3;
}

export default function MergeMe() {
  const [rows, setRows] = useState<PrRow[]>([]);
  const [note, setNote] = useState<string>("loading the public GitHub API…");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const prs = (await (
          await fetch(`https://api.github.com/repos/${REPO}/pulls?state=open&per_page=50`)
        ).json()) as Array<{
          number: number;
          title: string;
          body: string | null;
          created_at: string;
          head: { ref: string; sha: string };
        }>;
        if (!Array.isArray(prs)) throw new Error("GitHub API did not return a PR list (rate limit?)");
        const withChecks = await Promise.all(
          prs.map(async (p): Promise<PrRow> => {
            try {
              const cr = (await (
                await fetch(
                  `https://api.github.com/repos/${REPO}/commits/${p.head.sha}/check-runs?per_page=100`,
                )
              ).json()) as { check_runs?: Array<{ status: string; conclusion: string | null }> };
              const runs = cr.check_runs ?? [];
              const pass = runs.filter((r) => r.conclusion === "success" || r.conclusion === "skipped" || r.conclusion === "neutral").length;
              const fail = runs.filter((r) => r.conclusion !== null && !["success", "skipped", "neutral"].includes(r.conclusion)).length;
              const pending = runs.filter((r) => r.status !== "completed").length;
              return {
                number: p.number,
                title: p.title,
                branch: p.head.ref,
                sha: p.head.sha,
                createdAt: p.created_at,
                checks: { pass, fail, pending, total: runs.length },
                doneWhen: extractDoneWhen(p.body),
              };
            } catch {
              return {
                number: p.number,
                title: p.title,
                branch: p.head.ref,
                sha: p.head.sha,
                createdAt: p.created_at,
                checks: null,
                doneWhen: extractDoneWhen(p.body),
              };
            }
          }),
        );
        if (cancelled) return;
        withChecks.sort((a, b) => bakeRank(a) - bakeRank(b) || a.createdAt.localeCompare(b.createdAt));
        setRows(withChecks);
        setNote(
          `${withChecks.length} open PRs · derived live from api.github.com at ${new Date().toISOString()}`,
        );
      } catch (e) {
        if (!cancelled) setNote(`UNCHECKABLE: ${(e as Error).message}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-16 text-slate-100">
      <Helmet>
        <title>Merge-me — the train | Council of AI</title>
        <meta name="robots" content="noindex" />
        <meta
          name="description"
          content="Open PRs, check state, done-when curls, bake order. Derived live from the GitHub API. Not a merge authorization."
        />
      </Helmet>
      <section className="mx-auto max-w-4xl">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-300">
          merge-train conductor · derived, never authoritative
        </p>
        <h1 className="mt-3 text-3xl font-black">Merge-me</h1>
        <p className="mt-4 text-sm leading-6 text-slate-300">
          Bake order: green checks first, oldest first. One line per PR, its done-when curls where
          the body carries them, and the exact merge command. Nick merges top-to-bottom; this page
          never merges anything itself.
        </p>
        <p className="mt-2 font-mono text-xs text-slate-500">{note}</p>
        <ol className="mt-8 space-y-6">
          {rows.map((r, i) => (
            <li key={r.number} className="rounded-lg border border-slate-800 p-4">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="font-mono text-xs text-slate-500">#{i + 1} in bake order</span>
                <a
                  className="text-emerald-300 underline"
                  href={`https://github.com/${REPO}/pull/${r.number}`}
                >
                  PR #{r.number}
                </a>
                <span className="font-mono text-xs text-slate-500">{r.branch}</span>
                {r.checks ? (
                  <span
                    className={`font-mono text-xs ${
                      bakeRank(r) === 0
                        ? "text-emerald-300"
                        : bakeRank(r) === 2
                          ? "text-red-300"
                          : "text-amber-300"
                    }`}
                  >
                    {r.checks.pass} pass · {r.checks.pending} pending · {r.checks.fail} fail
                  </span>
                ) : (
                  <span className="font-mono text-xs text-slate-500">checks UNCHECKABLE</span>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-200">{r.title}</p>
              {r.doneWhen.length > 0 && (
                <div className="mt-2 rounded bg-slate-900 p-2">
                  <p className="font-mono text-[10px] uppercase text-slate-500">done-when curls</p>
                  {r.doneWhen.map((d) => (
                    <p key={d} className="mt-1 font-mono text-xs text-slate-300 break-all">
                      {d}
                    </p>
                  ))}
                </div>
              )}
              <p className="mt-2 font-mono text-xs text-slate-500">
                gh pr merge {r.number} -R {REPO} --squash --delete-branch
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-10 text-xs text-slate-500">
          Council of AI — measurement, never certification. Rate limits are GitHub's; reloads are
          cheap, merges are human.
        </p>
      </section>
    </main>
  );
}
