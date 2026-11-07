// The existing PR unit gate collects scripts/**/*.test.ts; no new workflow needed.
import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { deriveClaimReactions, reactionSummary } from "../../functions/_lib/claimReactions";

const root = fileURLToPath(new URL("../..", import.meta.url));
const fixtures = resolve(root, "scripts/claims/tests/fixtures");
const run = (...args: string[]) => {
  const result = spawnSync("python3", args, { cwd: root, encoding: "utf8", timeout: 15_000, maxBuffer: 2 * 1024 * 1024 });
  expect(result.error, result.error?.message).toBeUndefined();
  expect(result.status, result.stderr || result.stdout).toBe(0);
  return result.stdout;
};

describe("bounded offline recheck scheduling", () => {
  it("reproduces the live-captured projection using the existing TS derivation", () => {
    const raw = readFileSync(resolve(fixtures, "retained-events.jsonl"));
    const lines = raw.toString("utf8").trimEnd().split("\n");
    const head = JSON.parse(readFileSync(resolve(fixtures, "retained-head.json"), "utf8"));
    const sha = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
    expect(sha(raw)).toBe(head.feed.bytes_sha256);
    expect(lines.length).toBe(head.feed.n_lines);
    let previous: string | null = null;
    lines.forEach((line, index) => {
      const event = JSON.parse(line);
      expect(event.seq).toBe(index);
      expect(event.prev_sha256).toBe(previous);
      previous = sha(line);
    });
    expect(previous).toBe(head.feed.head_line_sha256);
    expect(lines.length - 1).toBe(head.feed.head_seq);
    const live = JSON.parse(readFileSync(resolve(fixtures, "live-reactions.json"), "utf8"));
    const reactions = deriveClaimReactions(lines);
    expect(reactions).toEqual(live.reactions);
    expect(reactionSummary(reactions)).toEqual({ n_events: live.n_events, by_state: live.by_state,
      n_counter_reaction_required: live.n_counter_reaction_required });
  });

  it("runs the Python boundary and CLI tests in the normal unit gate", () => {
    run("-m", "unittest", "discover", "-s", "scripts/claims/tests", "-p", "test_recheck_schedule.py", "-v");
  });

  it("reproduces the explicitly synthetic replay, without asserting superiority", () => {
    const first = run("scripts/claims/tests/replay_schedule.py");
    expect(run("scripts/claims/tests/replay_schedule.py")).toBe(first);
    const result = JSON.parse(first);
    expect(result.evidence_kind).toBe("SYNTHETIC_OFFLINE_REPLAY");
    expect(result).toEqual(JSON.parse(readFileSync(resolve(fixtures, "synthetic-replay-results.json"), "utf8")));
    for (const run of result.runs) {
      expect(run.spent_cost_units).toBeLessThanOrEqual(result.budget_units_per_step * result.steps_per_seed);
      expect(run.selected_checks).toBeLessThanOrEqual(result.max_items_per_step * result.steps_per_seed);
    }
  });
});
