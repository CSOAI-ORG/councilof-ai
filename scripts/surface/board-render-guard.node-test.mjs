import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { visibleText, expectedFromBoard, checkText, guardRenderedBoard } from "./board-render-guard.mjs";

// totals exactly as GET /api/gspc served them for de66b1c66 (28 Sep 2026).
const board = (over = {}) => Buffer.from(JSON.stringify({ axes: [], totals: {
  comparison_axes: 14, separated_leads: 0, ties: 8, untested_separations: 6, public_leader_count: 9,
  separation_public_count: "0 of 14 model-comparison axes separated a leader · 8 TIE · 6 UNTESTED",
  lid: "23 axes measured · 14 model fleets · 0 separated leaders · 9 public leader scores · 9 fact runs · TIE is TIE · not a certificate.",
  ...over } }));
// The home band as deploy 57dfceff (ec13a977a) and deploy 44340409 (d06d09837) rendered it — real markup shape.
const band = (t, u) => `<div><p class="t-num">0 of 14</p><p class="unit">model-comparison axes separated a leader — ${t} tied, ${u} untested</p></div>`;
const lid = (l) => `<p>23 axes measured · 14 model fleets · 0 separated leaders · ${l} public leader scores · 9 fact runs · TIE is TIE · not a certificate.</p>`;

test("visible text joins the figure to its sentence across elements", () => {
  assert.equal(visibleText(band(8, 6)), "0 of 14 model-comparison axes separated a leader — 8 tied, 6 untested");
  assert.equal(visibleText("<p>8&nbsp;TIE &middot; 6 UNTESTED</p><script>'2 TIE · 12 UNTESTED'</script>"), "8 TIE · 6 UNTESTED");
});
test("expected figures come from totals, not from this file", () => {
  assert.deepEqual(expectedFromBoard(board()), { separated: 0, comparison: 14, ties: 8, untested: 6, lid: [23, 14, 0, 9, 9] });
});
test("57dfceff home band agrees with its board", () => {
  assert.deepEqual(checkText(visibleText(band(8, 6) + lid(9)), expectedFromBoard(board())), []);
});
test("44340409 home band (2 tied, 12 untested; 3 public leader scores) is refused against an 8·6 board", () => {
  const v = checkText(visibleText(band(2, 12) + lid(3)), expectedFromBoard(board()));
  assert.deepEqual(v.map((x) => x.rule).sort(), ["lid", "separation-line"]);
  assert.match(v.find((x) => x.rule === "separation-line").mismatch, /ties 2≠8, untested 12≠6/);
  assert.match(v.find((x) => x.rule === "lid").mismatch, /lid 3≠9/);
});
test("the separation_public_count echo and a bare TIE·UNTESTED pair are both checked", () => {
  const e = expectedFromBoard(board());
  assert.equal(checkText("0 of 14 model-comparison axes separated a leader · 2 TIE · 12 UNTESTED", e).length, 2);
  assert.equal(checkText("0 of 14 model-comparison axes separated a leader · 8 TIE · 6 UNTESTED", e).length, 0);
});
test("a board that stops publishing a figure is not checked on it (no invented expectation)", () => {
  const e = expectedFromBoard(board({ ties: undefined, lid: "a new lid grammar" }));
  assert.equal(e.ties, null);
  assert.equal(e.lid, null);
  assert.deepEqual(checkText(visibleText(band(2, 6) + lid(3)), e), []);
});
test("guardRenderedBoard reads only snapshotted routes, from the files prerender wrote", (t) => {
  const dist = fs.mkdtempSync(path.join(tmpdir(), "board-guard-"));
  t.after(() => fs.rmSync(dist, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dist, "index.html"), band(8, 6));
  fs.mkdirSync(path.join(dist, "for/enterprise"), { recursive: true });
  fs.writeFileSync(path.join(dist, "for/enterprise/index.html"), lid(3));
  fs.mkdirSync(path.join(dist, "status"), { recursive: true });
  fs.writeFileSync(path.join(dist, "status/index.html"), band(2, 12)); // client-only shell: not a snapshot
  const results = [{ route: "/", ok: true }, { route: "/for/enterprise", ok: true }, { route: "/status", ok: true, clientOnly: true }];
  const g = guardRenderedBoard(dist, results, board());
  assert.equal(g.checked, 2);
  assert.deepEqual(g.violations.map((v) => [v.route, v.rule]), [["/for/enterprise", "lid"]]);
});
