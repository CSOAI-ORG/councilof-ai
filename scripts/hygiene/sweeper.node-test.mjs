import { test } from "node:test";
import assert from "node:assert/strict";
import { familyOf, plan } from "./sweeper-plan.mjs";

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
    { number: 3417, branch: "x402-door-conformance/2026-10-23T1203Z" },
    { number: 3423, branch: "mill/land-hfjobs-40005642177" },
  ]);
});

test("plan: a closed PR with no parseable closedAt is never GC'd", () => {
  const closed = [pr({ number: 1, state: "CLOSED", closedAt: null })];
  const p = plan({ open: [], closed, now: NOW });
  assert.deepEqual(p.gc, []);
});
