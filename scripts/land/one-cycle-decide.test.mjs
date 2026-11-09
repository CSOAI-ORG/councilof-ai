import { describe, expect, it } from "vitest";
import {
  ACTIONS,
  REQUIRED_CONTEXTS,
  decide,
  fixtures,
  runFixtures,
  sweep,
} from "./one-cycle-decide.mjs";

/**
 * The decision that lands a pull request on a moving base.
 *
 * WHY THIS TEST EXISTS. On 2026-11-07 this repository could not land pull requests, and the cause
 * was a loop of this estate's own making: `pr-gates.yml` keys its concurrency group on the BRANCH
 * NAME, so every new head pushed to a branch supersedes the in-flight gate of the previous head.
 * MEASURED on `catalogue-live-state/pending`: 8 of the last 10 `pr-gates` runs finished
 * `cancelled`; the one `success` (11:13Z -> 11:24Z) survived because master was quiet for those
 * eleven minutes. A loop that pushes while it waits cancels the very gate it is waiting for, so it
 * guarantees its own failure.
 *
 * The rule that fixes it is one sentence: NEVER PUSH WHILE A REQUIRED CHECK IS IN FLIGHT. A
 * decision function that could return SYNC (a push) in that state would carry the defect straight
 * into every lane that uses it, so the invariant is asserted over a SWEEP of the whole decision
 * space — not over the cases somebody thought to write down. The sweep lives in the module
 * (`sweep()`) so this file and the module's own `--selftest` prove the SAME cases from ONE
 * source; a copy would drift, and a drifted copy is a test that passes while the rule is broken.
 */
describe("one-cycle-decide", () => {
  it("names the four contexts branch protection requires on master", () => {
    expect([...REQUIRED_CONTEXTS].sort()).toEqual(["build", "gates", "hold-guard", "stamped-bytes"]);
  });

  it("decides every recorded case", () => {
    for (const fixture of fixtures()) {
      const got = decide(fixture.state);
      expect(`${fixture.name}: ${got.action}`, fixture.name).toBe(`${fixture.name}: ${fixture.action}`);
      if (fixture.reason) expect(got.reason, fixture.name).toMatch(fixture.reason);
    }
  });

  it("passes its own fixture run", () => {
    const { passed, failed } = runFixtures();
    expect(failed.map((f) => `${f.name}: ${f.expected} != ${f.got}`)).toEqual([]);
    expect(passed).toBe(fixtures().length);
  });

  it("never proposes a sync while a required check is in flight — over every combination", () => {
    const { swept, failed } = sweep();
    expect(failed.map((f) => `${f.name}: ${f.expected} != ${f.got}`)).toEqual([]);
    expect(swept).toBeGreaterThan(500);
  });

  it("never reports a verdict from a read that did not complete", () => {
    const got = decide({
      prState: "open",
      draft: false,
      armed: true,
      behind: 0,
      readComplete: false,
      required: { passed: [...REQUIRED_CONTEXTS], failed: [], inFlight: [], unreported: [] },
    });
    expect(got.action).toBe(ACTIONS.RETRY_READ);
  });

  it("returns exactly one action, with a reason, for every state", () => {
    for (const fixture of fixtures()) {
      const got = decide(fixture.state);
      expect(Object.values(ACTIONS)).toContain(got.action);
      expect(typeof got.reason).toBe("string");
      expect(got.reason.length).toBeGreaterThan(10);
    }
  });

  // WHY THIS CASE. A pull request that merged and one that was closed without merging are BOTH
  // `state: "closed"` in the REST API. MEASURED 2026-11-09: the receipt for PR #4148 — which
  // merged as 1d53df3cf — read "the pull request is closed", which is true of the API field and
  // useless to a reader who has to know whether the change reached master. A receipt that cannot
  // tell LANDED from DROPPED is the defect this case pins shut.
  it("tells a merged pull request apart from a closed one that never merged", () => {
    const required = { passed: [...REQUIRED_CONTEXTS], failed: [], inFlight: [], unreported: [] };
    const merged = decide({
      prState: "merged", draft: false, armed: true, behind: 0, readComplete: true, required,
    });
    const closed = decide({
      prState: "closed", draft: false, armed: false, behind: 4, readComplete: true, required,
    });
    expect(merged.action).toBe(ACTIONS.DONE);
    expect(closed.action).toBe(ACTIONS.DONE);
    expect(merged.reason).not.toBe(closed.reason);
    expect(merged.reason).toMatch(/merged/);
    expect(closed.reason).toMatch(/did not land/);
  });
});
