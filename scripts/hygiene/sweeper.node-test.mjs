import { test } from "node:test";
import assert from "node:assert/strict";
import { familyOf, plan, logPayloadsIn, uniqueRows, supersedeVerdict, gcVerdict } from "./sweeper-plan.mjs";

const NOW = Date.parse("2026-11-02T09:00:00Z");
const pr = (over = {}) => ({
  number: 1,
  headRefName: "mill/land-hfjobs-1",
  title: "mill: cards",
  draft: false,
  state: "OPEN",
  closedAt: null,
  mergedAt: null,
  ...over,
});

test("familyOf: the four automation families, and nothing else", () => {
  assert.equal(familyOf("mill/land-hfjobs-40040082463"), "mill");
  assert.equal(familyOf("canary-push/41298060049"), "canary");
  assert.equal(familyOf("x402-door-conformance/2026-11-01T1347Z"), "x402");
  assert.equal(familyOf("hf/coverage-20261101T1514"), "coverage");
  assert.equal(familyOf("lane/docs-hub-20261102"), null);
  assert.equal(familyOf("fix/cards-door-64hex-normalize"), null);
  assert.equal(familyOf("mill/land-hfjobs-not-a-run"), null);
});

test("familyOf: watcher-owned doors are never a family, even by accident", () => {
  assert.equal(familyOf("public-root/pending"), null);
  assert.equal(familyOf("art50-index/pending"), null);
});

test("plan: supersede keeps only the newest sibling per family", () => {
  const open = [
    pr({ number: 3311, headRefName: "mill/land-hfjobs-39032449478" }),
    pr({ number: 3425, headRefName: "mill/land-hfjobs-40040082463" }),
    pr({ number: 3539, headRefName: "x402-door-conformance/2026-10-27T1239Z" }),
    pr({ number: 3706, headRefName: "x402-door-conformance/2026-11-01T1347Z" }),
    pr({ number: 3700, headRefName: "canary-push/41298060049" }),
    pr({ number: 3709, headRefName: "hf/coverage-20261101T1514" }),
    pr({ number: 3750, headRefName: "lane/world-maps-consolidation-20261102" }),
  ];
  const p = plan({ open, now: NOW });
  assert.deepEqual(p.supersede.map((s) => s.number), [3311, 3539]);
  assert.deepEqual(p.supersede[0], { number: 3311, family: "mill", keep: 3425 });
  assert.deepEqual(p.supersede[1], { number: 3539, family: "x402", keep: 3706 });
  // singletons stay untouched
  assert.ok(!p.supersede.some((s) => s.number === 3700 || s.number === 3709));
  // the newest mill is the auto-merge eligibility list; non-mill families never are
  assert.deepEqual(p.millAutoMerge, [3425]);
});

test("plan: drafts and [HOLD] are never planned, and the skip is visible", () => {
  const open = [
    pr({ number: 10, draft: true, headRefName: "mill/land-hfjobs-10" }),
    pr({ number: 11, title: "[HOLD] mill: cards", headRefName: "mill/land-hfjobs-11" }),
    pr({ number: 12, headRefName: "mill/land-hfjobs-12" }),
  ];
  const p = plan({ open, now: NOW });
  assert.deepEqual(p.supersede, []); // 10 and 11 invisible; 12 is a singleton anyway
  assert.deepEqual(p.skipped.map((s) => s.number), [10, 11]);
  assert.deepEqual(p.skipped.map((s) => s.reason), ["draft", "hold"]);
});

test("plan: branch GC only for CLOSED unmerged family PRs older than 7 days", () => {
  const closed = [
    pr({ number: 3425, state: "CLOSED", headRefName: "mill/land-hfjobs-40040082463", closedAt: "2026-11-01T09:00:00Z" }),
    pr({ number: 3423, state: "CLOSED", headRefName: "mill/land-hfjobs-40005642177", closedAt: "2026-10-20T09:00:00Z" }),
    pr({ number: 3421, state: "MERGED", headRefName: "mill/land-hfjobs-39964376528", closedAt: "2026-10-01T09:00:00Z", mergedAt: "2026-10-01T10:00:00Z" }),
    pr({ number: 3417, state: "CLOSED", headRefName: "x402-door-conformance/2026-10-23T1203Z", closedAt: "2026-10-25T09:00:00Z" }),
  ];
  const p = plan({ open: [], closed, now: NOW });
  // 3425: closed yesterday → too young. 3421: merged → GitHub's call, never GC'd.
  // 3417 and 3423: family branches, unmerged, closed >7d → GC (sorted by number).
  assert.deepEqual(p.gc, [
    { number: 3417, branch: "x402-door-conformance/2026-10-23T1203Z", family: "x402", headSha: null },
    { number: 3423, branch: "mill/land-hfjobs-40005642177", family: "mill", headSha: null },
  ]);
});

test("plan: a closed PR with no parseable closedAt is never GC'd", () => {
  const closed = [pr({ number: 1, state: "CLOSED", closedAt: null })];
  const p = plan({ open: [], closed, now: NOW });
  assert.deepEqual(p.gc, []);
});

test("plan: a MERGED-newest sibling supersedes older OPEN siblings even when it is the only one", () => {
  // Observed 2026-11-03 02:47Z: the x402 automations reopen their old PRs when stale, while
  // the family's newest merged run already holds the same-path data master serves.
  const open = [
    pr({ number: 3437, headRefName: "x402-door-conformance/2026-10-24T1135Z" }),
    pr({ number: 3706, headRefName: "x402-door-conformance/2026-11-01T1347Z" }),
  ];
  const closed = [
    pr({ number: 3777, state: "MERGED", headRefName: "x402-door-conformance/2026-11-02T1631Z", mergedAt: "2026-11-03T05:00:00Z", closedAt: "2026-11-03T05:00:00Z" }),
  ];
  const p = plan({ open, closed, now: NOW });
  assert.deepEqual(p.supersede, [
    { number: 3437, family: "x402", keep: 3777, mergedKeep: true },
    { number: 3706, family: "x402", keep: 3777, mergedKeep: true },
  ]);
  // a probe never arms auto-merge, merged floor or not
  assert.deepEqual(p.millAutoMerge, []);
});

test("plan: canary is append-family — NEVER supersede-closed, never merged, always skipped visibly", () => {
  // 2026-11-03: lane/canary-recover-six-days restored six days of captures the supersede
  // rule closed — canary captures APPEND unique lines per run, so an older open canary PR
  // carries data master lacks, and the automation's reopens were its correct defence.
  const open = [
    pr({ number: 3392, headRefName: "canary-push/39749682201" }),
    pr({ number: 3676, headRefName: "canary-push/41189892109" }),
  ];
  const closed = [
    pr({ number: 3700, state: "MERGED", headRefName: "canary-push/41298060049", mergedAt: "2026-11-02T05:00:00Z", closedAt: "2026-11-02T05:00:00Z" }),
  ];
  const p = plan({ open, closed, now: NOW });
  assert.deepEqual(p.supersede, []);
  assert.deepEqual(p.millAutoMerge, []);
  assert.deepEqual(p.skipped, [
    { number: 3392, reason: "append-family — older runs carry unique data; never supersede-closed" },
    { number: 3676, reason: "append-family — older runs carry unique data; never supersede-closed" },
  ]);
});

test("plan: a mill keep NEWER than the merged floor still arms auto-merge; an older one does not", () => {
  const open = [pr({ number: 4100, headRefName: "mill/land-hfjobs-41000000000" })];
  const closed = [
    pr({ number: 4000, state: "MERGED", headRefName: "mill/land-hfjobs-40040082463", mergedAt: "2026-11-02T05:00:00Z", closedAt: "2026-11-02T05:00:00Z" }),
  ];
  const newer = plan({ open, closed, now: NOW });
  assert.deepEqual(newer.millAutoMerge, [4100]);
  assert.deepEqual(newer.supersede, []);
  const older = plan({ open: [pr({ number: 3900, headRefName: "mill/land-hfjobs-39000000000" })], closed, now: NOW });
  assert.deepEqual(older.millAutoMerge, []); // master already holds 4000 — landing 3900 would regress it
  assert.deepEqual(older.supersede, [{ number: 3900, family: "mill", keep: 4000, mergedKeep: true }]);
});

// ── the append-log gate (issue #3800) ────────────────────────────────────────
//
// MEASURED 3 Nov 2026, from the PR head refs (which survive a branch delete):
//   #3392  22 rows   #3565  30 rows   #3676  30 rows
//   rows in #3392 that are NOT in #3565: 8
// The canary payload is an APPEND LOG, so closing #3392 as "superseded" drops
// eight dated observations — and the sweeper then deleted its branch too, so
// the only copy of those rows went with it.
//
// The gate is STRUCTURAL: a family member that changes a .jsonl file is
// contributing to a log; one that changes only .json snapshots is replacing a
// capture. The x402 family must keep closing (issue #3746's ruling), so the
// tests below pin BOTH halves.

test("logPayloadsIn: a .jsonl payload is a log; a .json snapshot is not", () => {
  assert.deepEqual(
    logPayloadsIn([
      "public/interop/silent-route-canary-2026-09/baseline.jsonl",
      "public/interop/x402-door-conformance-2026-09/card-x402-door-conformance-summary-unsigned.json",
      "public/interop/x402-door-conformance-2026-09/mirrors/door-0-challenge.json",
    ]),
    ["public/interop/silent-route-canary-2026-09/baseline.jsonl"],
  );
  assert.deepEqual(logPayloadsIn([]), []);
  assert.deepEqual(logPayloadsIn(["a/b.json", "c/d.meta.json"]), []);
});

test("uniqueRows: the rows the keeper does not have", () => {
  assert.deepEqual(uniqueRows(["a", "b"], ["a", "b", "c"]), []);
  assert.deepEqual(uniqueRows(["a", "b"], ["b", "c"]), ["a"]);
  assert.deepEqual(uniqueRows([], ["a"]), []);
});

test("supersedeVerdict: an append log with rows the keeper lacks is NOT closed", () => {
  const older = Array.from({ length: 22 }, (_, i) => `row-${i}`);
  const keeper = Array.from({ length: 30 }, (_, i) => `row-${i + 8}`);
  const verdict = supersedeVerdict({
    payloads: [{ path: "public/interop/silent-route-canary-2026-09/baseline.jsonl", olderRows: older, keeperRows: keeper }],
  });
  assert.equal(verdict.ok, false);
  assert.equal(verdict.uniqueRows, 8);
  assert.match(verdict.reason, /append log/);
  assert.match(verdict.reason, /8 row\(s\)/);
});

test("supersedeVerdict: the keeper holding every row means the close is safe", () => {
  const older = Array.from({ length: 22 }, (_, i) => `row-${i}`);
  const keeper = Array.from({ length: 30 }, (_, i) => `row-${i}`);
  const verdict = supersedeVerdict({
    payloads: [{ path: "p/baseline.jsonl", olderRows: older, keeperRows: keeper }],
  });
  assert.equal(verdict.ok, true);
});

test("supersedeVerdict: an UNREADABLE payload is unprovable, and unprovable never closes", () => {
  const verdict = supersedeVerdict({
    payloads: [{ path: "p/baseline.jsonl", olderRows: null, keeperRows: null }],
  });
  assert.equal(verdict.ok, false);
  assert.match(verdict.reason, /unprovable/);
});

test("supersedeVerdict: a REPLACE family (no .jsonl payload) still closes — #3746 stands", () => {
  // The x402 family rewrites 30 .json files and changes no .jsonl at all, so
  // there is no log to compare and the ruling that superseded probe runs get
  // closed keeps working.
  assert.deepEqual(logPayloadsIn(["public/interop/x402-door-conformance-2026-09/artefact-manifest.json"]), []);
  assert.equal(supersedeVerdict({ payloads: [] }).ok, true);
});

test("gcVerdict: a branch that still holds rows master lacks is not deleted", () => {
  const verdict = gcVerdict({
    payloads: [{ path: "p/baseline.jsonl", olderRows: ["day-1", "day-2"], keeperRows: ["day-2"] }],
  });
  assert.equal(verdict.ok, false);
  assert.match(verdict.reason, /append log/);
  assert.equal(gcVerdict({ payloads: [] }).ok, true);
});

test("plan: a GC entry carries the family and the head SHA, so the branch can be questioned", () => {
  const p = plan({
    open: [],
    closed: [
      pr({
        number: 3392,
        headRefName: "canary-push/39749682201",
        state: "CLOSED",
        closedAt: "2026-09-20T00:00:00Z",
        headSha: "edfc0897d76ada382fa273b415fe512c15cda12c",
      }),
    ],
    now: NOW,
  });
  assert.equal(p.gc.length, 1);
  assert.equal(p.gc[0].family, "canary");
  assert.equal(p.gc[0].headSha, "edfc0897d76ada382fa273b415fe512c15cda12c");
  assert.equal(p.gc[0].branch, "canary-push/39749682201");
});
