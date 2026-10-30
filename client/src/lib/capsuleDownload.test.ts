import { describe, expect, it } from "vitest";
import { capsuleDownload } from "./capsuleDownload";
import type { Check, ShardCapsule } from "./serverLookup";

const id = "a".repeat(64);
const raw = '{"n":1.000,"large":9007199254740993,"text":"café"}\n';
const capsule = { capsule_id: id, capsule_json: raw } as ShardCapsule;
const at = "2026-10-29T04:00:00Z";
const check = { outcome: "PASS", state: "INCLUDED", claimed_id: id, signature: "VERIFIES" } as Check;

describe("retaining a capsule without changing its evidence", () => {
  it("preserves every original character, including numeric lexemes and the final newline", () => {
    const result = capsuleDownload(capsule, check, at);
    const saved = JSON.parse(result.text);
    expect(saved.capsule_json).toBe(raw);
    expect(result.filename).toBe(`capsule-${id}.json`);
    expect(saved.unsigned).toBe(true);
    expect(saved.scope).toContain("not signed");
    expect(saved.scope).toContain("not a new measurement");
    expect(saved.exported_at_browser_clock).toBe(at);
  });
  it("keeps an unperformed check distinct from success", () => {
    const saved = JSON.parse(capsuleDownload(capsule, null, at).text);
    expect(saved.browser_check).toBeNull();
    expect(saved.browser_check_state).toBe("NOT_RUN");
  });
  it.each(["PASS", "FAIL", "UNCHECKABLE"] as const)("retains %s without upgrading the outcome", (outcome) => {
    const actual = { ...check, outcome, why: "retained observation" };
    const saved = JSON.parse(capsuleDownload(capsule, actual, at).text);
    expect(saved.browser_check).toEqual(actual);
    expect(saved.browser_check_state).toBe(outcome);
  });
  it("does not mutate the source capsule or verification result", () => {
    const frozen = Object.freeze({ ...capsule });
    const frozenCheck = Object.freeze({ ...check });
    capsuleDownload(frozen, frozenCheck, at);
    expect(frozen.capsule_json).toBe(raw);
    expect(frozenCheck.outcome).toBe("PASS");
  });
  it.each([undefined, "", "   "])("refuses missing original text: %s", (capsule_json) => {
    expect(() => capsuleDownload({ ...capsule, capsule_json }, null, at)).toThrow("no original capsule text");
  });
  it("refuses an unsafe filename identifier", () => {
    expect(() => capsuleDownload({ ...capsule, capsule_id: "../../other" }, null, at)).toThrow("no valid capsule identifier");
  });
});
