import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Source-level guard (the repo has no DOM test runner): the form must drive the tested
// freshness state machine and must never render a verdict that is not current.
const src = readFileSync(new URL("./RecordVerifyForm.tsx", import.meta.url), "utf8");

describe("RecordVerifyForm uses the freshness state machine", () => {
  it("imports the tested module and renders only currentVerdict()", () => {
    expect(src).toContain('from "@/lib/verifyFreshness"');
    expect(src).toContain("const verdict = currentVerdict(fresh)");
    expect(src).not.toMatch(/setVerdict\(/);
  });
  it("takes a run ticket before verifying and settles with seq + hash", () => {
    expect(src).toContain("startRun(onInput(freshRef.current, h))");
    expect(src).toContain("settleRun(freshRef.current, started.seq, started.hash, v)");
    expect(src).toContain("if (settled.accepted) onVerdict?.(v)");
  });
  it("re-hashes on every edit and labels a stale verdict", () => {
    expect(src).toContain("inputHash(text).then");
    expect(src).toContain('data-testid="record-verdict-stale"');
    expect(src).toContain("data-verified-input-sha256");
  });
});
