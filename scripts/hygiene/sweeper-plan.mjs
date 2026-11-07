/**
 * sweeper-plan.mjs — the pure planning half of the hygiene sweeper (issue #3746).
 *
 * No network, no fs, no clock reads: every function takes its inputs as arguments so
 * scripts/hygiene/sweeper.node-test.mjs can drive it. The CLI half (sweeper.mjs) fetches
 * PRs over the gh CLI, asks this module what to do, then applies (or prints, in dry-run).
 *
 * Families (the automation PR streams the owner ruled on in #3746):
 *   mill/land-hfjobs-*    HF Jobs measurement-card landings (data worth landing when green)
 *   canary-push/*         thin canary captures — an APPEND LOG: each capture adds its
 *                          own dated rows, so an older run is NOT superseded by a newer
 *                          one (measured 3 Nov 2026; issue #3800)
 *   x402-door-conformance/*  daily door probes (value is the latest run)
 *   hf/coverage-*         router-reachability probes (value is the latest run)
 *
 * "Value is the latest run" is a property of the FAMILY, not of the sweeper, and
 * the two families above disagree about it. So the sweeper does not assume it:
 * a close and a branch delete are both allowed only after the bytes are compared
 * (see logPayloadsIn, supersedeVerdict, gcVerdict below).
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

// ── the append-log distinction ────────────────────────────────────────────────
//
// THE DEFECT THIS EXISTS TO FIX, MEASURED 3 Nov 2026.
//
// The sweeper's premise is "each newer run of these automations writes the same
// output paths, so an older branch can only regress master. Nothing is lost —
// the source datasets retain everything." That premise is TRUE for the replace
// families (x402's daily probe REWRITES the same 30 .json files) and FALSE for
// the canary family, whose payload is an APPEND LOG: each capture adds its own
// DATED rows to public/interop/silent-route-canary-2026-09/baseline.jsonl and
// keeps the earlier ones.
//
// Measured, from the PR head refs (which survive a branch delete):
//   #3392  22 rows   #3565  30 rows   #3676  30 rows
//   rows in #3392 that are NOT in #3565: 8
// So the newer capture does NOT carry the older one: closing it as "superseded"
// drops eight dated observations, and deleting its branch drops the only copy.
//
// The DISCRIMINATOR IS STRUCTURAL, NOT A FAMILY NAME. A family member that
// changes a .jsonl file is contributing to a log; a member that changes only
// .json snapshots is replacing a capture. x402's members change 30 files and no
// .jsonl; the canary members change exactly one file and it is a .jsonl.

/** The .jsonl files among a PR's changed paths — the family's log payloads. */
export function logPayloadsIn(files = []) {
  return files.filter((f) => typeof f === "string" && f.endsWith(".jsonl"));
}

/**
 * The rows in `older` that `keeper` does not have. Empty means the keeper
 * carries everything the older run observed, so closing the older loses nothing.
 */
export function uniqueRows(older = [], keeper = []) {
  const held = new Set(keeper);
  return older.filter((row) => !held.has(row));
}

/**
 * supersedeVerdict({ payloads }) — the pure decision for one candidate close.
 *
 * `payloads` is [{ path, olderRows, keeperRows }]. A payload the caller could
 * not read is passed with a null row array, which is treated as UNPROVABLE:
 * the verdict is "do not close". A close that cannot be proven safe is not a
 * close.
 */
export function supersedeVerdict({ payloads = [] } = {}) {
  for (const { path, olderRows, keeperRows } of payloads) {
    if (!Array.isArray(olderRows) || !Array.isArray(keeperRows)) {
      return { ok: false, reason: `the log payload ${path} could not be read, so the close is unprovable` };
    }
    const unique = uniqueRows(olderRows, keeperRows);
    if (unique.length) {
      return {
        ok: false,
        reason:
          `the log payload ${path} holds ${unique.length} row(s) the keeper does not have ` +
          `(it is an append log, not a replaced capture), so closing this PR as superseded ` +
          `would drop dated observations`,
        uniqueRows: unique.length,
        path,
      };
    }
  }
  return { ok: true };
}

/**
 * gcVerdict({ payloads }) — the pure decision for one branch delete. Same
 * question as supersedeVerdict, asked against master: does the branch hold
 * rows that master does not? If it does, the branch is the only keeper of them.
 */
export function gcVerdict({ payloads = [] } = {}) {
  const v = supersedeVerdict({ payloads });
  if (v.ok) return v;
  // The gate must name what IT was about to do. A reason that talks about a
  // close, printed by the branch deleter, describes an action that is not
  // happening and trains the reader to ignore the line.
  return {
    ...v,
    reason: v.reason
      .replace("so closing this PR as superseded would drop dated observations",
               "so deleting this branch would drop the only copy of those dated observations")
      .replace("the log payload could not be read, so the close is unprovable",
               "the log payload could not be read, so the delete is unprovable"),
  };
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
 *
 *                 The CLI does NOT close on this list alone. A close is a claim that
 *                 nothing is lost, and for an APPEND-LOG family the claim is false
 *                 until the bytes are compared: supersedeVerdict() refuses the close
 *                 when the older run holds rows the keeper does not, and treats an
 *                 unreadable payload as unprovable (which also refuses).
 *   millAutoMerge [number]  open mill landings that are the family's newest (supersede
 *                 would leave exactly these) — the caller still has to verify checks are
 *                 all green before enabling auto-merge; this list is the eligibility,
 *                 not the verdict.
 *   gc           [{number, branch, family, headSha}]  CLOSED (unmerged) family PRs whose
 *                 closedAt is older than 7 days — their head branch is deletable (the PR
 *                 ref keeps the commits; nothing merged was dropped). As with a close,
 *                 the CLI asks first: gcVerdict() refuses the delete when the branch
 *                 still holds rows master does not.
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
    // The head SHA and the family ride along so the CLI can ASK whether this
    // branch still holds rows master does not. A branch GC that deletes the only
    // copy of a dated observation is not a cleanup.
    plan.gc.push({ number: pr.number, branch: pr.headRefName, family: familyOf(pr.headRefName), headSha: pr.headSha || null });
  }

  plan.supersede.sort((a, b) => a.number - b.number);
  plan.millAutoMerge.sort((a, b) => a - b);
  plan.gc.sort((a, b) => a.number - b.number);
  return plan;
}
