import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { onRequestGet } from "../../../functions/api/gspc";
import { countMismatch, loadBoard, rowVerifyTarget, type AxisRow } from "./axis-sets";

// T01 (persona audit 2026-10-06): the board's "Verify" links opened the newest signed card filed
// under each axis. Those cards recorded a different model (often one of our own prompt overlays)
// and a different number, and the verifier then said VALID about bytes that never backed the row.
// Rule, read off the payload the board serves rather than off any phrase:
//   a visible Verify link must open a card whose body.model is the row's leader and whose
//   body.accuracy is the row's headline. With today's /api/gspc no row has such a card, so there
//   must be no Verify link at all.

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

const REPO = path.resolve(__dirname, "../../..");
const bareModel = (s: string) => s.replace(/\s*\(base model\)\s*$/i, "").trim();

function cardBody(url: string): any | null {
  const file = path.join(REPO, "public", url.replace(/^\//, ""));
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8")).body ?? null;
}

describe("board Verify links open only the card that backs the row", () => {
  let payload: any;
  let rows: AxisRow[];
  beforeAll(async () => {
    payload = await servedBoard();
    rows = loadBoard(payload).rows;
  });

  it("reads the served board (not a vacuous pass)", () => {
    expect(rows.length).toBeGreaterThan(10);
    const named = rows.filter((r) => r.headline !== null && r.measuredOn);
    expect(named.length).toBeGreaterThan(0);
    // every row from the board set declares its card state (null = no backing card)
    for (const r of rows) expect(r.leaderCardState === undefined).toBe(false);
  });

  it("every Verify target is a card for the row's own leader and headline", () => {
    for (const r of rows) {
      const target = rowVerifyTarget(r);
      if (!target) continue;
      const body = cardBody(target);
      expect(body, `${r.id}: ${target} is not a published card`).not.toBeNull();
      expect(bareModel(String(body.model)), `${r.id}: card model`).toBe(bareModel(String(r.measuredOn)));
      expect(body.accuracy, `${r.id}: card accuracy`).toBe(r.headline);
    }
  });

  it("with the current board, no row has a backing card, so there are 0 Verify links", () => {
    expect(rows.map(rowVerifyTarget).filter(Boolean)).toEqual([]);
  });

  it("a card the board says records a different measurement is never a Verify target", () => {
    const care = rows.find((r) => r.id === "care");
    expect(care).toBeDefined();
    if (care?.leaderCardState === "CARD_RECORDS_A_DIFFERENT_MEASUREMENT") {
      expect(care.leaderCardUrl).toMatch(/^\/signed\/cards\//);
      expect(rowVerifyTarget(care)).toBeNull();
    }
  });

  it("an absent or unknown state stays null and is never inferred", () => {
    const [row] = loadBoard({
      axes: [{ axis: "x", status: "MEASURED", leader: "m", accuracy: 0.5, n: 10, leader_card_url: "/signed/cards/a.json" }],
    }).rows;
    expect(row.leaderCardState).toBeNull();
    expect(rowVerifyTarget(row)).toBeNull();
    const [odd] = loadBoard({
      axes: [{ axis: "x", status: "MEASURED", leader: "m", accuracy: 0.5, n: 10, leader_card_state: "MAYBE", leader_card_url: "/signed/cards/a.json" }],
    }).rows;
    expect(odd.leaderCardState).toBeNull();
    const [signed] = loadBoard({
      axes: [{ axis: "x", status: "MEASURED", leader: "m", accuracy: 0.5, n: 10, leader_card_state: "SIGNED_PER_MODEL_CARD", leader_card_url: "/signed/cards/a.json" }],
    }).rows;
    expect(rowVerifyTarget(signed)).toBe("/signed/cards/a.json");
  });
});

describe("a headline computed over a different row count than n says so (T07 F)", () => {
  it("derives the counts from separation_evidence, never typing them", () => {
    const m = countMismatch({
      n: 199,
      separation_n_note: "duplicates included",
      separation_evidence: { leader: { k: 81, n: 200 } },
    });
    expect(m).toEqual({ headlineCount: "81/200 answers", nNote: "199 distinct items — one item appears twice in the frozen rows" });
    expect(countMismatch({ n: 237, separation_n_note: "x", separation_evidence: { leader: { k: 139, n: 237 } } })).toBeNull();
    expect(countMismatch({ n: 36, separation_evidence: "a string" })).toBeNull();
  });

  it("the served care row carries the derived count", async () => {
    const rows = loadBoard(await servedBoard()).rows;
    const care = rows.find((r) => r.id === "care")!;
    const ev = (await servedBoard()).axes.find((a: any) => a.axis === "care").separation_evidence;
    if (ev?.leader?.n !== care.n) {
      expect(care.headlineCount).toBe(`${ev.leader.k}/${ev.leader.n} answers`);
      expect(care.nNote).toMatch(new RegExp(`^${care.n} distinct items`));
    } else {
      expect(care.headlineCount).toBeNull();
    }
  });
});
