import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadBoard, renderAll, renderAxesIndex, staleOwnedFiles } from "./build-axis-pages.mjs";

const OWNER_GATED = "HIDDEN_PENDING_OWNER_GO";

/**
 * A board shaped like the live one: 14 model-comparison axes, 9 deterministic-fact
 * axes, 10 declared subject slots. One of the slots stands in for regulator-transparency,
 * which the owner is still holding.
 */
function board({ gated = ["slot-8"] } = {}) {
  const cmp = Array.from({ length: 14 }, (_, i) => ({
    axis: `cmp-${i}`,
    family: "gspc",
    kind: "model-comparison",
    status: "MEASURED",
    separation: "TIE",
    n: 30,
    leader: "some/model",
  }));
  const facts = Array.from({ length: 9 }, (_, i) => ({
    axis: `fact-${i}`,
    family: "financial",
    kind: "deterministic-facts",
    status: "MEASURED",
    n: 8,
  }));
  const slots = Array.from({ length: 9 }, (_, i) => ({
    axis: `slot-${i}`,
    family: "subject",
    kind: "declared-slot",
    status: "UNMEASURED",
    n: 0,
    task: "does a subject disclose something",
    bench: "pending frozen bank",
    ...(gated.includes(`slot-${i}`) ? { public_pages: OWNER_GATED } : {}),
  }));
  // One subject axis has been PROMOTED: measured, with a frozen sha-pinned bank behind it
  // (claim-maintenance, 2026-10-29 — the first measured subject axis). It is still a subject
  // axis: no model fleet answers it, so no separation test applies to it.
  const measuredSubject = {
    axis: "slot-promoted",
    family: "subject",
    kind: "measured-subject",
    status: "MEASURED",
    n: 174,
    method_status: "meets-rule",
    bank_sha256: "a".repeat(64),
    task: "is a captured public claim still served unchanged, changed, withdrawn or unreachable",
    bench: "claim-maintenance v0.2 re-read wave",
  };
  return {
    axes: [...cmp, ...facts, ...slots, measuredSubject],
    totals: { public_count: "33 axes · 24 measured · 0 of 14 model-comparison axes separated a leader" },
    state_enum: { separation: ["SEPARATED", "TIE", "UNTESTED"] },
  };
}

test("the axes index counts each kind by the board's own kind, not by 'not a fact'", () => {
  const html = renderAxesIndex(board({ gated: [] }));
  // 14 model-comparison axes — the board says 14, so the page must say 14.
  assert.match(html, /<h2>14 model-comparison axes<\/h2>/);
  assert.match(html, /<h2>9 deterministic-fact axes<\/h2>/);
  // Nine declared subject slots and ONE measured subject axis: a promoted slot is measured,
  // so filing it under "declared subject slots" would understate what has been measured.
  assert.match(html, /<h2>9 declared subject slots<\/h2>/);
  assert.match(html, /<h2>1 measured subject axes<\/h2>/);
  // The old bug filed 24 axes under "model-comparison" (14 + 10 slots).
  assert.doesNotMatch(html, /<h2>24 model-comparison axes<\/h2>/);
});

test("a measured subject axis is filed under its own heading, never as a declared slot", () => {
  const html = renderAxesIndex(board({ gated: [] }));
  const measuredSection = html.slice(html.indexOf("measured subject axes"));
  assert.match(measuredSection, /data-axis="slot-promoted"/);
  assert.match(measuredSection, /data-status="MEASURED"/);
  assert.match(measuredSection, /174/);
  // No model fleet answers a subject axis, so no point leader and no separation token.
  assert.doesNotMatch(measuredSection, /Point leader/);
  assert.doesNotMatch(measuredSection, /data-separation="TIE"/);
  // And it is not among the declared slots.
  const declaredSection = html.slice(
    html.indexOf("declared subject slots"),
    html.indexOf("measured subject axes"),
  );
  assert.doesNotMatch(declaredSection, /data-axis="slot-promoted"/);
});

test("a declared subject slot is never filed under the model-comparison heading", () => {
  const html = renderAxesIndex(board({ gated: [] }));
  const cmpSection = html.slice(
    html.indexOf("model-comparison axes"),
    html.indexOf("deterministic-fact axes"),
  );
  assert.doesNotMatch(cmpSection, /slot-0/);
  assert.doesNotMatch(cmpSection, /slot-8/);
  assert.doesNotMatch(cmpSection, /slot-promoted/);
  // The slots are present, in their own section.
  const slotSection = html.slice(html.indexOf("declared subject slots"));
  assert.match(slotSection, /slot-0/);
  assert.match(slotSection, /slot-8/);
});

test("a declared slot row states its state and n, and claims no point leader", () => {
  const html = renderAxesIndex(board({ gated: [] }));
  const slotSection = html.slice(html.indexOf("declared subject slots"));
  assert.match(slotSection, /data-axis="slot-0"/);
  assert.match(slotSection, /UNMEASURED/);
  // No leader column on the slot table: no model fleet answers a declared slot.
  assert.doesNotMatch(slotSection, /Point leader/);
});

test("an axis whose kind the board does not name is shown, but not counted into a group", () => {
  const b = board({ gated: [] });
  b.axes.push({ axis: "mystery-axis", family: "subject", status: "UNMEASURED", n: 0 });
  const html = renderAxesIndex(b);
  assert.match(html, /<h2>1 axes of an unnamed kind<\/h2>/);
  assert.match(html, /mystery-axis/);
  assert.doesNotMatch(html, /<h2>15 model-comparison axes<\/h2>/);
  assert.doesNotMatch(html, /<h2>11 declared subject slots<\/h2>/);
});

test("an owner-gated axis gets no public page and no row", () => {
  const out = renderAll(board({ gated: ["slot-3"] }));
  assert.equal(out["axis/slot-3.html"], undefined);
  assert.ok(out["axis/slot-4.html"], "a non-gated slot still has its page");
  const index = out["axes.html"];
  assert.doesNotMatch(index, /slot-3/);
});

test("staleOwnedFiles names a page for an axis the generator no longer renders", () => {
  const dir = mkdtempSync(join(tmpdir(), "axis-stale-"));
  const axisDir = join(dir, "axis");
  mkdirSync(axisDir, { recursive: true });
  writeFileSync(join(axisDir, "slot-3.html"), "<html>gated page</html>");
  writeFileSync(join(axisDir, "slot-4.html"), "<html>live page</html>");
  writeFileSync(join(axisDir, "effect-binding-server-probe-2026-09-22.html"), "<html>dated run report</html>");
  const b = board({ gated: ["slot-3"] });
  const rendered = renderAll(b);
  const stale = staleOwnedFiles(b, dir, rendered).map((p) => p.split("/").pop());
  assert.ok(stale.includes("slot-3.html"), "the gated axis page is a stale owned file");
  assert.ok(!stale.includes("slot-4.html"), "a live page is not stale");
  assert.ok(
    !stale.includes("effect-binding-server-probe-2026-09-22.html"),
    "a dated run report under /axis/ is not ours to delete",
  );
});

test("the axes index page says 32 where the board serves 33, because one slot is owner-held", () => {
  const out = renderAll(board());
  assert.match(out["axes.html"], /<h1>All 32 GSPC axes<\/h1>/);
  // The lid is the board's own totals, left as served.
  assert.match(out["axes.html"], /33 axes · 24 measured/);
});

test("the commit board renders exactly its public canonical axes without promoting the owner-held slot", async () => {
  const live = await loadBoard();
  const allIds = live.axes.map((row) => row.axis);
  assert.equal(allIds.length, 33);
  assert.equal(new Set(allIds).size, 33);
  assert.ok(allIds.includes("regulator-transparency"));

  const publicIds = live.axes
    .filter((row) => row.public_pages !== OWNER_GATED)
    .map((row) => row.axis)
    .sort();
  assert.equal(publicIds.length, 32);
  assert.ok(!publicIds.includes("regulator-transparency"));

  const out = renderAll(live);
  const renderedIds = Object.keys(out)
    .filter((path) => path.startsWith("axis/"))
    .map((path) => path.slice("axis/".length, -".html".length))
    .sort();
  assert.deepEqual(renderedIds, publicIds);
  assert.equal(out["axis/regulator-transparency.html"], undefined);
  assert.match(out["axes.html"], /<h1>All 32 GSPC axes<\/h1>/);
  assert.match(out["axes.html"], /<h2>8 declared subject slots<\/h2>/);
  assert.match(out["axes.html"], /<h2>1 measured subject axes<\/h2>/);
  assert.doesNotMatch(out["axes.html"], /data-axis="regulator-transparency"/);
});

test("a declared slot's own page offers no separation machinery", () => {
  const out = renderAll(board({ gated: [] }));
  const slot = out["axis/slot-0.html"];
  // No fleet answers a declared slot, so it can never be SEPARATED, TIE or UNTESTED.
  assert.doesNotMatch(slot, /data-glossary="separation"/);
  assert.doesNotMatch(slot, /methodology\/#separation/);
  assert.doesNotMatch(slot, />Point leader</);
  assert.match(slot, /data-status="UNMEASURED"/);
  // And it still says the truth about its n: 0 is the literal count, never a score.
  assert.match(slot, /data-n="0"/);
  assert.match(slot, /<dd>0 bank items<\/dd>/);
});

test("a model-comparison page keeps the separation machinery", () => {
  const out = renderAll(board({ gated: [] }));
  const cmp = out["axis/cmp-0.html"];
  assert.match(cmp, /data-glossary="separation"/);
  assert.match(cmp, /methodology\/#separation/);
  assert.match(cmp, />Point leader</);
  assert.match(cmp, /MEASURED · TIE/);
});

test("a deterministic-fact page keeps saying that no separation test applies", () => {
  const out = renderAll(board({ gated: [] }));
  const fact = out["axis/fact-0.html"];
  assert.doesNotMatch(fact, /data-glossary="separation"/);
  assert.match(fact, /facts, no separation test/);
});
