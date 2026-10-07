import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { onRequestGet } from "../../../functions/api/gspc";
import { exclusionPartition } from "./Independence";

// T08 (persona audit 2026-10-06): /independence said the board "withholds the leader on 8 of 14"
// axes and that "of the 9 leaders it does name" none were ours — 8 + 9 = 17 of 14. On 6 of those 8
// axes the board does name a leader: the best third-party model, compared again without ours. The
// sentence is now a partition read off the payload, and it must add up.
//
// The payload is the one this commit's Pages Function serves (functions/api/gspc.ts), not a
// hand-made fixture: the test fails if the board and the sentence stop agreeing.

async function servedBoard(): Promise<any> {
  (globalThis as unknown as { caches: unknown }).caches = {
    default: { match: async () => undefined, put: async () => undefined },
  };
  const res = await onRequestGet({
    request: new Request("https://councilof.ai/api/gspc"),
    env: {},
    waitUntil: () => undefined,
  } as unknown as Parameters<typeof onRequestGet>[0]);
  return await res.json();
}

describe("/independence own-model exclusion sentence", () => {
  let board: any;
  beforeAll(async () => {
    board = await servedBoard();
  });

  it("reads the fields it partitions (not a vacuous pass)", () => {
    expect(typeof board.totals.comparison_axes).toBe("number");
    expect(Array.isArray(board.totals.own_leaders_excluded_axes)).toBe(true);
    expect(board.axes.some((a: any) => a.kind === "model-comparison")).toBe(true);
  });

  it("partitions the comparison axes exactly: named + withheld + no card = comparison_axes", () => {
    const p = exclusionPartition(board);
    expect(p.reconciles).toBe(true);
    expect(p.namedLeaders.length + p.withheld.length + p.noCard.length).toBe(board.totals.comparison_axes);
    if (typeof board.totals.public_leader_count === "number") expect(p.namedLeaders.length).toBe(board.totals.public_leader_count);
  });

  it("every own-led axis is either re-compared without our model or shows no leader", () => {
    const p = exclusionPartition(board);
    const ownLed: string[] = board.totals.own_leaders_excluded_axes;
    const covered = new Set([...p.reranked.map((a) => a.axis), ...p.withheld.map((a) => a.axis)]);
    for (const axis of ownLed) expect(covered.has(axis), axis).toBe(true);
    expect(p.reranked.length + p.withheld.length).toBe(ownLed.length);
  });

  it("the separation split of the re-compared axes is derived from each axis's separation", () => {
    const p = exclusionPartition(board);
    expect(p.rerankedSeparated + p.rerankedTie + p.rerankedUntested).toBe(p.reranked.length);
  });

  it("goes to 'does not reconcile' rather than printing a sentence that does not add up", () => {
    const broken = { ...board, totals: { ...board.totals, comparison_axes: board.totals.comparison_axes + 3 } };
    expect(exclusionPartition(broken).reconciles).toBe(false);
  });

  it("the page never again says the board 'withholds the leader on' the own-led axes", () => {
    const src = readFileSync(resolve(__dirname, "Independence.tsx"), "utf8");
    expect(src).not.toMatch(/withholds the leader on/);
    expect(src).not.toMatch(/the board shows no leader at all/);
  });
});
