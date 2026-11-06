/**
 * sweeper-plan.mjs — the pure planning half of the hygiene sweeper (issue #3746).
 *
 * No network, no fs, no clock reads: every function takes its inputs as arguments so
 * scripts/hygiene/sweeper.node-test.mjs can drive it. The CLI half (sweeper.mjs) fetches
 * PRs over the gh CLI, asks this module what to do, then applies (or prints, in dry-run).
 *
 * Families (the automation PR streams the owner ruled on in #3746):
 *   mill/land-hfjobs-*    HF Jobs measurement-card landings (data worth landing when green)
 *   canary-push/*         thin canary captures (value is the latest run)
 *   x402-door-conformance/*  daily door probes (value is the latest run)
 *   hf/coverage-*         router-reachability probes (value is the latest run)
 *
 * Guard rails, fail-closed: drafts are never planned; [HOLD] titles are never planned;
 * anything outside the four families is never planned. The plan proposes — the CLI's
 * apply mode is the only thing that mutates, and dry-run prints the same plan verbatim.
 */

const FAMILY_PATTERNS = [
  { id: "mill", re: /^mill\/land-hfjobs-\d+$/ },
  { id: "canary", re: /^canary-push\/\d+$/ },
  { id: "x402", re: /^x402-door-conformance\/\d{4}-\d{2}-\d{2}T\d+Z$/ },
  { id: "coverage", re: /^hf\/coverage-\d{8}T\d+$/ },
];

// Append-family: every run APPENDS unique lines to the same file, so an older open PR
// carries data master does not have, and closing it LOSES that data until someone
// hand-recovers it — which is exactly what happened (2026-11-03, lane/canary-recover-
// six-days: six days of captures the supersede rule closed had to be restored by hand,
// and the canary automation's reopens were its correct defence). These families are
// NEVER supersede-closed and NEVER auto-merged by this sweeper; their lifecycle belongs
// to their owning automation.
const APPEND_FAMILY = new Set(["canary"]);

// Belt-and-braces: these streams are watcher-owned and promotion-gated; a future family
// regex accident must not be able to touch them even if they ever look like a family.
const NEVER_TOUCH = new Set(["public-root/pending", "art50-index/pending"]);

export function familyOf(headRefName) {
  if (NEVER_TOUCH.has(headRefName)) return null;
  for (const { id, re } of FAMILY_PATTERNS) if (re.test(headRefName)) return id;
  return null;
}

function guarded(pr) {
  if (pr.draft) return "draft";
  if (/\[HOLD\]/i.test(pr.title || "")) return "hold";
  if (!familyOf(pr.headRefName)) return "not-a-family-branch";
  return null;
}

/**
 * plan({ open, closed, now }) — open/closed are PR JSON arrays (gh shape:
 * number, headRefName, title, draft, state, mergedAt/closedAt). `now` is a Date or ms.
 *
 * Returns { supersede, millAutoMerge, gc, skipped }:
 *   supersede    [{number, family, keep, mergedKeep?}]  older open siblings of a family
 *                 that has a newer sibling — close them; each newer run of these
 *                 automations writes the same output paths, so an old branch can only
 *                 regress master. `keep` is the superseding PR number: a newer OPEN
 *                 sibling, or — with `mergedKeep: true` — the family's newest MERGED PR,
 *                 because master already holds that run and any older open branch is
 *                 debris even if it is the only open one (the daily automations reopen
 *                 their old PRs; observed 2026-11-03 02:47Z).
 *   millAutoMerge [number]  open mill landings that are the family's newest (supersede
 *                 would leave exactly these) — the caller still has to verify checks are
 *                 all green before enabling auto-merge; this list is the eligibility,
 *                 not the verdict.
 *   gc           [{number, branch}]  CLOSED (unmerged) family PRs whose closedAt is
 *                 older than 7 days — their head branch is deletable (the PR ref keeps
 *                 the commits; nothing merged was dropped).
 *   skipped      [{number, reason}]  anything a caller might have thought in scope but a
 *                 guard excluded — printed in dry-run so the plan is always explainable.
 */
export function plan({ open = [], closed = [], now }) {
  const nowMs = now instanceof Date ? now.getTime() : now;
  const GC_AGE_MS = 7 * 24 * 60 * 60 * 1000;
  const plan = { supersede: [], millAutoMerge: [], gc: [], skipped: [] };

  const openFamilied = [];
  for (const pr of open) {
    const why = guarded(pr);
    if (why) {
      if (why !== "not-a-family-branch") plan.skipped.push({ number: pr.number, reason: why });
      continue;
    }
    openFamilied.push({ ...pr, family: familyOf(pr.headRefName) });
  }

  const byFamily = new Map();
  for (const pr of openFamilied) {
    if (!byFamily.has(pr.family)) byFamily.set(pr.family, []);
    byFamily.get(pr.family).push(pr);
  }

  // A family's newest MERGED PR is also a superseder: master already holds that run's
  // data, so any older OPEN sibling of it is debris no matter how many open siblings
  // there are. This matters because the daily automations REOPEN their old PRs (observed
  // 2026-11-03 02:47Z on the canary family, five PRs reopened en masse a day after the
  // manual pass closed them) — close-only passes lose that war; the plan has to know
  // that a merged-newest sibling already won.
  const newestMerged = new Map();
  for (const pr of closed) {
    if (pr.state !== "MERGED" && !(pr.state === "CLOSED" && pr.mergedAt)) continue;
    if (guarded(pr)) continue;
    const family = familyOf(pr.headRefName);
    if (!family) continue;
    const n = pr.number;
    if (!newestMerged.has(family) || newestMerged.get(family) < n) newestMerged.set(family, n);
  }

  for (const [family, prs] of byFamily) {
    if (APPEND_FAMILY.has(family)) {
      plan.skipped.push(...prs.map((p) => ({ number: p.number, reason: "append-family — older runs carry unique data; never supersede-closed" })));
      continue;
    }
    prs.sort((a, b) => b.number - a.number); // automation opens sequentially: newest = highest number
    const keep = prs[0];
    const mergedFloor = newestMerged.get(family) ?? 0;
    const supersedeByNumber = new Map();
    for (const older of prs.slice(1)) {
      supersedeByNumber.set(older.number, { number: older.number, family, keep: keep.number });
    }
    for (const pr of prs) {
      if (pr.number < mergedFloor) {
        supersedeByNumber.set(pr.number, { number: pr.number, family, keep: mergedFloor, mergedKeep: true });
      }
    }
    plan.supersede.push(...supersedeByNumber.values());
    if (family === "mill" && keep.number > mergedFloor) plan.millAutoMerge.push(keep.number);
  }

  for (const pr of closed) {
    if (pr.state !== "CLOSED" || pr.mergedAt) continue; // merged heads are GitHub's call
    const why = guarded(pr);
    if (why) continue;
    const closedMs = Date.parse(pr.closedAt || "");
    if (!Number.isFinite(closedMs) || nowMs - closedMs < GC_AGE_MS) continue;
    plan.gc.push({ number: pr.number, branch: pr.headRefName });
  }

  plan.supersede.sort((a, b) => a.number - b.number);
  plan.millAutoMerge.sort((a, b) => a - b);
  plan.gc.sort((a, b) => a.number - b.number);
  return plan;
}
