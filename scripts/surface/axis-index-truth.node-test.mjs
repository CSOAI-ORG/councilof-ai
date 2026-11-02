import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadBoard, renderAll, renderAxesIndex, staleOwnedFiles } from "./build-axis-pages.mjs";

const OWNER_GATED = "HIDDEN_PENDING_OWNER_GO";

/**
 * The canonical axis id set is the ONE alias table: "keys are the canonical axis ids
 * exactly as GET https://councilof.ai/api/gspc spells them (axes[].axis)". It is a
 * mirror of the axis modules, and functions/mcp/axis-aliases.test.ts already fails if
 * a key stops being a board row. Comparing the commit board against it is a real
 * cross-check, and it lets this test DERIVE the axis set instead of typing a count
 * that goes stale the moment a slot is declared. A typed count here was the estate
 * repeating the exact defect it repaired in canon.json: a frozen number (23/23/0)
 * that turns a legitimate growth into a red build — that one held a correct live
 * board red for 114 consecutive runs. Declaring the 34th axis made this assert 33
 * and fail, which is the frozen number talking, not the board.
 */
const CANONICAL_AXES = Object.keys(
  JSON.parse(
    readFileSync(new URL("../../functions/mcp/axis-aliases.json", import.meta.url), "utf8"),
  ).axes,
);

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
  // The board payload and its totals must agree or the generator refuses to render
  // (LID_COUNT_MISMATCH), so a doctored payload updates its own totals too.
  b.totals = { ...b.totals, public_count: "34 axes · 23 measured · 0 of 14 model-comparison axes separated a leader" };
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

test("the index reconciles the board's totals with the rows it lists when slots are owner-held", () => {
  const html = renderAll(board())["axes.html"];
  // Two counts about one set, and the difference stated in neither's place is an error to the reader.
  assert.match(html, /33 axes · 23 measured/);
  assert.match(html, /<h1>All 32 GSPC axes<\/h1>/);
  assert.match(
    html,
    /The board serves 33 axes; 1 is owner-gated pending go, so this page lists 32\./,
  );
  // The held axis is a count, never a leak.
  assert.doesNotMatch(html, /slot-9/);
});

test("the index stays silent when the board totals equal the rows shown", () => {
  const html = renderAll(board({ gated: [] }))["axes.html"];
  assert.doesNotMatch(html, /owner-gated pending go/);
});

test("a totals row the reconciliation cannot explain refuses to render", () => {
  const b = board();
  b.totals = { ...b.totals, public_count: "40 axes · 23 measured" };
  assert.throws(() => renderAll(b), /LID_COUNT_MISMATCH/);
});

test("the commit board renders exactly its public canonical axes without promoting the owner-held slots", async () => {
  const live = await loadBoard();
  const allIds = live.axes.map((row) => row.axis);
  // DERIVED, never typed. The commit board and the canonical alias table must agree
  // on the axis SET, not merely on a number.
  assert.deepEqual([...allIds].sort(), [...CANONICAL_AXES].sort());
  assert.equal(allIds.length, CANONICAL_AXES.length);
  assert.equal(new Set(allIds).size, CANONICAL_AXES.length);
  assert.ok(allIds.includes("regulator-transparency"));

  const gatedIds = live.axes
    .filter((row) => row.public_pages === OWNER_GATED)
    .map((row) => row.axis);
  const publicIds = live.axes
    .filter((row) => row.public_pages !== OWNER_GATED)
    .map((row) => row.axis)
    .sort();
  // The owner-held count is whatever the board says it is. Typing "1" here froze the
  // public count at 32 and broke the moment a second slot was held back.
  assert.ok(gatedIds.length > 0, "the owner is still holding at least one slot");
  assert.equal(publicIds.length, allIds.length - gatedIds.length);
  assert.ok(!publicIds.includes("regulator-transparency"));

  const out = renderAll(live);
  const renderedIds = Object.keys(out)
    .filter((path) => path.startsWith("axis/"))
    .map((path) => path.slice("axis/".length, -".html".length))
    .sort();
  assert.deepEqual(renderedIds, publicIds);
  // Every owner-held slot gets no page and no row in the index — named, not counted.
  for (const id of gatedIds) {
    assert.equal(out[`axis/${id}.html`], undefined);
    assert.doesNotMatch(out["axes.html"], new RegExp(`data-axis="${id}"`));
  }
  // The two headings count the PUBLIC axes, so they are derived from the board too.
  const publicSlots = live.axes.filter(
    (row) => row.public_pages !== OWNER_GATED && row.kind === "declared-slot",
  ).length;
  assert.match(out["axes.html"], new RegExp(`<h1>All ${publicIds.length} GSPC axes</h1>`));
  assert.match(out["axes.html"], new RegExp(`<h2>${publicSlots} declared subject slots</h2>`));
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
