import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { CARDED_MODEL_AXES, ROWS_AXES, collectOwnModelIdentifiers, onRequestGet, redactOwnModelIdentifiers } from "./gspc";
import { AXES_A } from "./_gspc_axes_a";
import { AXES_B } from "./_gspc_axes_b";
import { AXES_C } from "./_gspc_axes_c";
import { AXES_FIN } from "./_gspc_axes_fin";
import { MEASURED_ON } from "./_gspc_types";
import { MEASURED_IN_LANE } from "./_gspc_lane";
import { ROWS_SEPARATION } from "./_gspc_rows_separation";

// 2026-09-27: separation on the board-v2 axes is computed from the PUBLISHED per-item rows
// (csoai/gspc-peritem-rows-2026-08-12) by scripts/gspc_separation_from_rows.py. These checks read
// the served payload and the generated module, never a typed expectation of the result.

type Axis = Record<string, any> & { axis: string; kind?: string; separation?: string };
type Payload = {
  axes: Axis[];
  totals: Record<string, any>;
  peritem_rows: Record<string, any>;
  measured_on: Record<string, any>;
  public_model_identifier_policy: string;
};

async function served(): Promise<Payload> {
  (globalThis as unknown as { caches: unknown }).caches = {
    default: { match: async () => undefined, put: async () => undefined },
  };
  const res = await onRequestGet({
    request: new Request("https://councilof.ai/api/gspc"),
    env: {},
    waitUntil: () => undefined,
  } as unknown as Parameters<typeof onRequestGet>[0]);
  return (await res.json()) as Payload;
}

// Exact two-sided McNemar, the 2026-08-13 body, recomputed here independently of the producer.
function mcnemar(b: number, c: number): number | null {
  const n = b + c;
  if (n === 0) return null;
  const k = Math.min(b, c);
  let comb = 1n;
  let sum = 0n;
  for (let i = 0; i <= k; i++) {
    if (i > 0) comb = (comb * BigInt(n - i + 1)) / BigInt(i);
    sum += comb;
  }
  const p = Number((2n * sum * 10n ** 12n) / 2n ** BigInt(n)) / 1e12;
  return Math.min(1, Math.round(p * 1e4) / 1e4);
}

describe("GET /api/gspc: separation from the published per-item rows", () => {
  let board: Payload;
  beforeAll(async () => {
    board = await served();
  });

  it("binds the rows by hash: peritem_sha256 is the sha256 of the dataset's SHA256SUMS", () => {
    const files = ROWS_SEPARATION.files as Record<string, string>;
    const sums = Object.keys(files)
      .sort()
      .map((f) => `${files[f]}  rows/${f}\n`)
      .join("");
    const h = createHash("sha256").update(sums).digest("hex");
    expect(h).toBe(ROWS_SEPARATION.peritem_sha256);
    expect(board.peritem_rows.peritem_sha256).toBe(h);
    expect(board.measured_on.peritem_sha256).toBe(h);
    expect(Object.keys(files)).toHaveLength(13);
  });

  it("every rows-decided axis carries the producer's result and a p that recomputes", () => {
    const decided = board.axes.filter((a) => a.leader_source === "per-item rows");
    expect(decided.length).toBeGreaterThan(0); // not a vacuous pass
    for (const a of decided) {
      const r = ROWS_AXES[a.axis];
      expect(r, a.axis).toBeDefined();
      expect(a.separation).toBe(r.determination);
      const e = a.separation_evidence;
      expect(e.leader.model).toBe(r.test.leader.model);
      expect(a.leader).toBe(`${r.test.leader.model} (base model)`);
      const p = mcnemar(e.discordant.leader_only_correct, e.discordant.next_best_only_correct);
      expect(p, a.axis).toBe(a.separation_p);
      expect(a.separation, a.axis).toBe(p !== null && p < 0.05 ? "SEPARATED" : "TIE");
      expect(a.peritem_file_sha256).toBe(r.sha256);
    }
  });

  it("TIE wording is the fixed sentence with n, and nothing on those axes says winner", () => {
    for (const a of board.axes.filter((x) => x.leader_source === "per-item rows" && x.separation === "TIE")) {
      const n = a.separation_evidence.leader.n;
      expect(a.separation_sentence).toContain(
        `No model separated from the next best on this axis (exact McNemar, p≥0.05, n=${n}`,
      );
      expect(JSON.stringify(a)).not.toMatch(/\bwinner\b/i);
    }
    expect(JSON.stringify(board.peritem_rows)).not.toMatch(/\bwinner\b/i);
  });

  it("a leader not backed by a signed per-model card of this run says so, visibly", () => {
    const decided = board.axes.filter((a) => a.leader_source === "per-item rows");
    const unbacked = decided.filter((a) => a.leader_card_state !== "SIGNED_PER_MODEL_CARD");
    for (const a of unbacked) {
      expect(a.leader_card_note).toMatch(/^leader shown from per-item rows; no signed per-model card yet/);
      expect(a.note).toContain("leader shown from per-item rows; no signed per-model card yet");
    }
    expect(board.peritem_rows.leaders_without_a_signed_card_for_this_run).toEqual(unbacked.map((a) => a.axis));
    // safety's leader gemma3:12b has no gemma3:12b card on the safety card key
    const safety = board.axes.find((a) => a.axis === "safety")!;
    expect(safety.leader_card_state).not.toBe("SIGNED_PER_MODEL_CARD");
  });

  it("withholds internal own-model identifiers from the public axis and per-item projections", () => {
    const ownExcluded = board.axes.filter((a) => a.public_leader_state === "EXCLUDED_OWN_MODEL");
    expect(ownExcluded.length).toBeGreaterThan(0);
    for (const a of ownExcluded) {
      expect(a).not.toHaveProperty("excluded_leader");
      expect(a).toHaveProperty("excluded_note");
      expect(a).toHaveProperty("historical_measurement_record");
    }
    expect(board.peritem_rows.own_model_exclusion).toBe(
      "CSOAI-owned specialist models are excluded before public ranking. The published external-only " +
        "re-ranking uses the six-model base-model cohort; internal model identifiers are omitted from this API response.",
    );
    expect(String(board.peritem_rows.own_model_exclusion)).not.toMatch(/\bcouncil[-_][a-z0-9]/i);
  });

  it("pseudonymizes own-model identifiers everywhere in the complete API response", () => {
    const serialized = JSON.stringify(board);
    const sourceIdentifiers = collectOwnModelIdentifiers([AXES_A, AXES_B, AXES_C, AXES_FIN, MEASURED_ON, MEASURED_IN_LANE, ROWS_SEPARATION]);
    expect(sourceIdentifiers.size).toBeGreaterThan(0);
    for (const identifier of sourceIdentifiers) expect(serialized).not.toContain(identifier);
    expect(board.public_model_identifier_policy).toMatch(/stable numbered aliases/i);
  });

  it("redaction control rewrites identifier keys and narrative mentions while preserving values", () => {
    const canary = "council-private-fixture-v99";
    const fixture = { [canary]: { note: `Observed by ${canary}`, score: 0.75 } };
    const ids = collectOwnModelIdentifiers(fixture);
    const redacted = redactOwnModelIdentifiers(fixture, ids) as Record<string, any>;
    const serialized = JSON.stringify(redacted);
    expect(serialized).not.toContain(canary);
    expect(serialized).toContain("CSOAI-owned specialist 1");
    expect(redacted["CSOAI-owned specialist 1"].score).toBe(0.75);
  });

  it("the producer's carded-axis rule and the board's CARDED_MODEL_AXES are the same rule", () => {
    for (const [axis, r] of Object.entries(ROWS_AXES)) {
      const producerSaysUncarded = r.untested_reason_code === "NO_SIGNED_CARD_FOR_AXIS";
      expect(producerSaysUncarded, axis).toBe(!CARDED_MODEL_AXES.has(axis));
    }
  });

  it("an UNTESTED axis with published rows states its reason; a determination from elsewhere is untouched", () => {
    for (const a of board.axes.filter((x) => x.kind === "model-comparison" && x.separation === "UNTESTED")) {
      if (ROWS_AXES[a.axis]) expect(typeof a.separation_untested_reason, a.axis).toBe("string");
    }
    const jail = board.axes.find((a) => a.axis === "jail")!;
    expect(jail.leader_source).toBeUndefined();
    expect(jail.separation).toBe("TIE");
  });

  it("totals are derived from the axes: separated + ties + untested = comparison axes", () => {
    const cmp = board.axes.filter((a) => a.kind === "model-comparison" && a.status === "MEASURED");
    const count = (s: string) => cmp.filter((a) => a.separation === s).length;
    expect(board.totals.separated_leads).toBe(count("SEPARATED"));
    expect(board.totals.ties).toBe(count("TIE"));
    expect(board.totals.untested_separations).toBe(count("UNTESTED"));
    expect(board.totals.separated_leads + board.totals.ties + board.totals.untested_separations).toBe(cmp.length);
  });

  it("the public record is the generated module, byte for byte in content", () => {
    const rec = new URL("../../public/interop/gspc-peritem-rows-2026-08-12.json", import.meta.url);
    const record = JSON.parse(readFileSync(rec, "utf8"));
    expect(record).toEqual(JSON.parse(JSON.stringify(ROWS_SEPARATION)));
    const signed = new URL("../../public/interop/gspc-peritem-rows-2026-08-12.signed.json", import.meta.url);
    if (existsSync(signed)) {
      const s = JSON.parse(readFileSync(signed, "utf8"));
      const sha = createHash("sha256").update(readFileSync(rec)).digest("hex");
      expect(s.payload.artifact.sha256).toBe(sha);
      expect(s.key).toBe("did:web:csoai.org#board-attestation-1");
    }
  });

  it("failing control: a planted p that does not recompute is caught", () => {
    const a = structuredClone(board.axes.find((x) => x.leader_source === "per-item rows")!);
    a.separation_p = 0.01;
    const p = mcnemar(a.separation_evidence.discordant.leader_only_correct, a.separation_evidence.discordant.next_best_only_correct);
    expect(p).not.toBe(a.separation_p);
  });
});
