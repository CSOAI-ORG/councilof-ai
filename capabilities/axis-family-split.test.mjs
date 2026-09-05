/**
 * axis-family-split.test.mjs — 22 axes are two families, and the split must stay derived.
 *
 * WP-2 states the trap in one line: "Current API has 22 axes: 14 model comparisons and 8 fact
 * axes, not 22 industries. … Never invent nine ranks."
 *
 * Measured against runtime 2026-09-05, and the construction is sound:
 *
 *   totals.axes 22 · totals.model_fleets 14 · totals.fact_runs 8
 *   kind counts  model-comparison 14 · deterministic-facts 8   (they partition the board)
 *
 * HomeGspcBoard already honours the distinction properly — a facts axis gets a FACTS badge,
 * "deterministic facts · no leader accuracy" instead of a score, and "facts · no separation test"
 * instead of a separation verdict. The lid sentence derives its counts from the live axes and
 * prefers `totals.lid` verbatim. None of that needed changing.
 *
 * WHAT WAS NOT HELD is that it stays that way. Two failure modes, neither of which anything in
 * this repo would have noticed:
 *
 *   · THE COUNTS GET TYPED IN. "14 model fleets · 8 fact runs" is a short, stable-looking
 *     sentence and exactly the kind of thing a tidy-up hardcodes. The same construction in the
 *     x402 offer is guarded for the same reason; this one was not.
 *   · A FACTS AXIS GROWS A COHORT. A deterministic-facts run has no fleet — `fleet_mean` and
 *     `separation` are meaningless there — so per-model rows under one would be invented rows,
 *     which is the "nine ranks" WP-2 forbids. Today only `jail` carries per_model, and it is a
 *     model-comparison axis.
 *
 * A third check guards the API against itself: `totals.model_fleets` and the actual `kind` counts
 * are computed from the same corpus by different code, and the board's summary trusts the first
 * while its rows render from the second. If they ever disagree, the page contradicts itself and
 * says nothing about it.
 *
 * Offline by default. LIVE_GSPC=1 fetches the board.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BOARD = "https://councilof.ai/api/gspc";
const HOME_BOARD = path.join(repo, "client/src/components/home/HomeGspcBoard.tsx");

const FAMILIES = ["model-comparison", "deterministic-facts"];

async function board() {
  const res = await fetch(BOARD, { headers: { "cache-control": "no-cache" } });
  assert.ok(res.ok, `GET /api/gspc returned HTTP ${res.status}`);
  return res.json();
}

describe("the board is two axis families, counted from the axes themselves", () => {
  it("live: every axis belongs to one of the two declared families", async () => {
    if (!process.env.LIVE_GSPC) {
      console.log("      (offline: LIVE_GSPC unset — board NOT fetched)");
      return;
    }
    const d = await board();
    const axes = d.axes ?? [];
    assert.ok(axes.length > 0, "the board served no axes");
    const strays = axes
      .filter((a) => !FAMILIES.includes(a.kind))
      .map((a) => `${a.axis}: kind=${JSON.stringify(a.kind)}`);
    assert.deepEqual(
      strays,
      [],
      `these axes are neither a model comparison nor a fact run: ${strays.join("; ")}. Every ` +
        `surface in the product branches on exactly those two values — badge, leader cell and ` +
        `separation cell — so a third kind renders as whichever branch happens to be the else.`,
    );
  });

  it("live: totals.model_fleets and totals.fact_runs match the axes they claim to count", async () => {
    if (!process.env.LIVE_GSPC) {
      console.log("      (offline: LIVE_GSPC unset — totals NOT compared)");
      return;
    }
    const d = await board();
    const axes = d.axes ?? [];
    const t = d.totals ?? {};
    const mc = axes.filter((a) => a.kind === "model-comparison").length;
    const facts = axes.filter((a) => a.kind === "deterministic-facts").length;

    assert.equal(t.axes, axes.length, `totals.axes says ${t.axes}; the board serves ${axes.length}`);
    assert.equal(
      t.model_fleets,
      mc,
      `totals.model_fleets says ${t.model_fleets} but ${mc} axes carry kind "model-comparison". ` +
        `The lid sentence quotes the total and the rows render from the kind — the page would ` +
        `contradict itself and say nothing about it.`,
    );
    assert.equal(
      t.fact_runs,
      facts,
      `totals.fact_runs says ${t.fact_runs} but ${facts} axes carry kind "deterministic-facts"`,
    );
    assert.equal(
      mc + facts,
      axes.length,
      `the two families do not partition the board: ${mc} + ${facts} != ${axes.length}`,
    );
  });

  it("live: no fact axis carries per-model rows, because a fact run has no fleet", async () => {
    if (!process.env.LIVE_GSPC) {
      console.log("      (offline: LIVE_GSPC unset — cohorts NOT inspected)");
      return;
    }
    const d = await board();
    const invented = (d.axes ?? [])
      .filter((a) => a.kind === "deterministic-facts" && a.per_model && Object.keys(a.per_model).length)
      .map((a) => `${a.axis} (${Object.keys(a.per_model).length} rows)`);
    assert.deepEqual(
      invented,
      [],
      `these deterministic-facts axes carry per-model rows: ${invented.join("; ")}. A fact run ` +
        `has no fleet to compare, so a cohort under one is not a measurement of anything — it ` +
        `is the invented ranking WP-2 forbids, and AxisProof would render it as a real one.`,
    );
  });

  it("the lid counts are still derived from the axes, not typed in", () => {
    const src = readFileSync(HOME_BOARD, "utf8");
    // Strip comments first: this file EXPLAINS the derivation in prose, and a naive scan matches
    // the explanation instead of the code. That mistake has been made five times in this lane.
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

    assert.match(
      code,
      /kind === "model-comparison"/,
      "the lid no longer counts model-comparison axes from the data",
    );
    assert.match(
      code,
      /kind === "deterministic-facts"/,
      "the lid no longer counts deterministic-facts axes from the data",
    );

    const hardcoded = [...code.matchAll(/\d+\s+(?:model fleets|fact runs|axes measured)/g)].map((m) => m[0]);
    assert.deepEqual(
      hardcoded,
      [],
      `the lid sentence now carries typed-in counts: ${hardcoded.join(", ")}. Those numbers move ` +
        `when the board moves, and a sentence that no longer reads the board is wrong on the ` +
        `first day it changes — with nothing to notice.`,
    );
  });

  it("a facts axis is never given a leader score or a separation verdict", () => {
    const src = readFileSync(HOME_BOARD, "utf8");
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    assert.match(
      code,
      /deterministic facts · no leader accuracy/,
      "a fact axis no longer says it has no leader accuracy. It has no fleet, so any number in " +
        "that column is a comparison that was never run.",
    );
    assert.match(
      code,
      /facts · no separation test/,
      "a fact axis no longer says separation does not apply to it. TIE and SEPARATED are verdicts " +
        "about a fleet; printing either against a fact run states a result that has no method.",
    );
  });
});
