import { describe, expect, it } from "vitest";
import { currentVerdict, initialFreshness, inputHash, isStale, onInput, settleRun, startRun } from "./verifyFreshness";

type V = { valid: boolean; tag: string };
const ok: V = { valid: true, tag: "ok" };
const bad: V = { valid: false, tag: "bad" };

describe("verifier freshness — a verdict is bound to the exact bytes it verified", () => {
  it("valid: the verdict shows and is bound to the input hash", async () => {
    let s = onInput(initialFreshness<V>(), await inputHash('{"a":1}'));
    const run = startRun(s); s = run.state;
    const r = settleRun(s, run.seq, run.hash, ok); s = r.state;
    expect(r.accepted).toBe(true);
    expect(currentVerdict(s)).toEqual(ok);
    expect(isStale(s)).toBe(false);
    expect(s.verdictHash).toBe(await inputHash('{"a":1}'));
  });

  it("changed: editing the payload after a green verdict makes it STALE — never shown as current", async () => {
    let s = onInput(initialFreshness<V>(), await inputHash("A"));
    const run = startRun(s); s = settleRun(run.state, run.seq, run.hash, ok).state;
    s = onInput(s, await inputHash("A "));
    expect(isStale(s)).toBe(true);
    expect(currentVerdict(s)).toBeNull();
    expect(s.verdict).toEqual(ok); // kept for reading as history, labelled stale by the form
  });

  it("malformed: a failing verdict is bound the same way as a passing one", async () => {
    let s = onInput(initialFreshness<V>(), await inputHash("{not json"));
    const run = startRun(s); const r = settleRun(run.state, run.seq, run.hash, bad); s = r.state;
    expect(r.accepted).toBe(true);
    expect(currentVerdict(s)).toEqual(bad);
  });

  it("reverified: re-running on the changed bytes replaces the stale verdict with a fresh one", async () => {
    let s = onInput(initialFreshness<V>(), await inputHash("A"));
    let run = startRun(s); s = settleRun(run.state, run.seq, run.hash, ok).state;
    s = onInput(s, await inputHash("B"));
    expect(isStale(s)).toBe(true);
    run = startRun(s); s = settleRun(run.state, run.seq, run.hash, bad).state;
    expect(isStale(s)).toBe(false);
    expect(currentVerdict(s)).toEqual(bad);
  });

  it("out-of-order: an older run settling after a newer input is dropped, and a stale-hash settle is dropped", async () => {
    let s = onInput(initialFreshness<V>(), await inputHash("A"));
    const runA = startRun(s); s = runA.state;          // run 1 verifies "A" (slow)
    s = onInput(s, await inputHash("B"));
    const runB = startRun(s); s = runB.state;          // run 2 verifies "B" (fast)
    const rB = settleRun(s, runB.seq, runB.hash, bad); s = rB.state;
    expect(rB.accepted).toBe(true);
    const rA = settleRun(s, runA.seq, runA.hash, ok);   // run 1 arrives late
    expect(rA.accepted).toBe(false);
    expect(currentVerdict(rA.state)).toEqual(bad);     // the newer input's verdict stands
    // same seq but the box changed under it: dropped
    s = onInput(rA.state, await inputHash("C"));
    const late = settleRun(s, runB.seq, runB.hash, ok);
    expect(late.accepted).toBe(false);
    expect(currentVerdict(late.state)).toBeNull();
  });

  it("inputHash is sha256 of the exact bytes", async () => {
    expect(await inputHash("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    expect(await inputHash("A")).not.toBe(await inputHash("A "));
  });
});
