import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderAll, renderAxesIndex, staleOwnedFiles } from "./build-axis-pages.mjs";

const OWNER_GATED = "HIDDEN_PENDING_OWNER_GO";

/**
 * A board shaped like the live one: 14 model-comparison axes, 9 deterministic-fact
 * axes, 10 declared subject slots. One of the slots stands in for regulator-transparency,
 * which the owner is still holding.
 */
function board({ gated = ["slot-9"] } = {}) {
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
  const slots = Array.from({ length: 10 }, (_, i) => ({
    axis: `slot-${i}`,
    family: "subject",
    kind: "declared-slot",
    status: "UNMEASURED",
    n: 0,
    task: "does a subject disclose something",
    bench: "pending frozen bank",
    ...(gated.includes(`slot-${i}`) ? { public_pages: OWNER_GATED } : {}),
  }));
  return {
    axes: [...cmp, ...facts, ...slots],
    totals: { public_count: "33 axes · 23 measured · 0 of 14 model-comparison axes separated a leader" },
    state_enum: { separation: ["SEPARATED", "TIE", "UNTESTED"] },
  };
}

test("the axes index counts each kind by the board's own kind, not by 'not a fact'", () => {
  const html = renderAxesIndex(board({ gated: [] }));
  // 14 model-comparison axes — the board says 14, so the page must say 14.
  assert.match(html, /<h2>14 model-comparison axes<\/h2>/);
  assert.match(html, /<h2>9 deterministic-fact axes<\/h2>/);
  assert.match(html, /<h2>10 declared subject slots<\/h2>/);
  // The old bug filed 24 axes under "model-comparison" (14 + 10 slots).
  assert.doesNotMatch(html, /<h2>24 model-comparison axes<\/h2>/);
});

test("a declared subject slot is never filed under the model-comparison heading", () => {
  const html = renderAxesIndex(board({ gated: [] }));
  const cmpSection = html.slice(
    html.indexOf("model-comparison axes"),
    html.indexOf("deterministic-fact axes"),
  );
  assert.doesNotMatch(cmpSection, /slot-0/);
  assert.doesNotMatch(cmpSection, /slot-9/);
  // The slots are present, in their own section.
  const slotSection = html.slice(html.indexOf("declared subject slots"));
  assert.match(slotSection, /slot-0/);
  assert.match(slotSection, /slot-9/);
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
  assert.match(out["axes.html"], /33 axes · 23 measured/);
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
