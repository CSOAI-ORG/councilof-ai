import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { commitBoard } from "./commit-board.mjs";
import { boardCounts, separationCounts } from "./render-board-reference.mjs";

const repo = fileURLToPath(new URL("../..", import.meta.url));

test("this commit's /api/gspc computes offline, with no key and so no site signature", async () => {
  const { status, raw } = await commitBoard(repo);
  assert.equal(status, 200);
  const counts = boardCounts(raw); // rows and totals agree, as the render reference requires
  assert.ok(counts.axes >= 1);
  const d = JSON.parse(raw);
  assert.equal(d.site_attestation, undefined);
  const s = separationCounts(raw);
  assert.equal(s.separated_leads + s.ties + s.untested_separations, s.comparison_axes);
  assert.ok(s.separation_public_count.includes(`${s.ties} TIE · ${s.untested_separations} UNTESTED`));
});
test("the same commit gives the same bytes every time (no clock, no network)", async () => {
  const a = await commitBoard(repo), b = await commitBoard(repo);
  assert.deepEqual(a.raw, b.raw);
});
test("?axis= views come from the same handler", async () => {
  const one = await commitBoard(repo, "?axis=governance");
  assert.equal(one.status, 200);
  assert.deepEqual(JSON.parse(one.raw).axes.map((a) => a.axis), ["governance"]);
  assert.equal((await commitBoard(repo, "?axis=no-such-axis")).status, 404);
});
test("the build-time cache shim does not leak into the process", async () => {
  await commitBoard(repo);
  assert.equal(Object.prototype.hasOwnProperty.call(globalThis, "caches"), false);
});
