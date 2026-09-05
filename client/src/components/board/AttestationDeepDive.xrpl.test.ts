import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const panel = readFileSync(resolve(__dirname, "AttestationDeepDive.tsx"), "utf8");
const tile = readFileSync(resolve(__dirname, "BoardAttestation.tsx"), "utf8");
const honesty = readFileSync(
  resolve(__dirname, "../../../../public/interop/living-root-as-index-honesty.json"),
  "utf8",
);

describe("XRPL panel is a reader of /root.json, live 16, not a 404 leftover", () => {
  it("reads /root.json and /api/xrpl as a reader, not hardcoded 404", () => {
    expect(panel).toContain('fetch("/root.json")');
    expect(panel).toContain('fetch("/api/xrpl")');
    expect(panel).toMatch(/reader/i);
    expect(panel).toContain("writes_board");
    expect(tile).toContain("NO_LAPTOP_SIGN");
    expect(panel).not.toContain("/api/xrpl is 404");
    expect(panel).not.toMatch(/stays 404/);
    expect(panel).not.toMatch(/XRPL DEVNET pointer/);
    expect(tile).not.toContain("/api/xrpl is 404");
    expect(tile).toMatch(/reader/i);
  });
});

describe("living root-as-index + N→N+1 drift honesty leftover", () => {
  it("publishes living-root-as-index-honesty.json with UNCHECKABLE drift and unsigned envelope", () => {
    const j = JSON.parse(honesty);
    expect(j.schema).toContain("living-root-as-index-honesty");
    expect(j.live_roots.envelope).toMatch(/unsigned until keystone/i);
    expect(j.n_to_n_plus_1_drift.status).toBe("UNCHECKABLE");
    // Board counts are living from GET /api/gspc — honesty mirrors 22·22·0 after #1077.
    expect(j.board.unmeasured_axes).toBe(0);
    expect(j.do_not).toEqual(
      expect.arrayContaining(["fake Merkle seal", "new products", "invent scores"]),
    );
    expect(j.sit).toBe("NAMED");
  });

  it("BoardAttestation + ProgressPanel render N→N+1 UNCHECKABLE from honesty and link GET /root.json", () => {
    expect(tile).toMatch(/root\.json/);
    expect(tile).toContain('href="/root.json"');
    expect(tile).toMatch(/N→N\+1 drift/);
    expect(tile).toContain("/interop/living-root-as-index-honesty.json");
    expect(panel).toContain('href="/root.json"');
    expect(panel).toContain("/interop/living-root-as-index-honesty.json");
    expect(panel).toMatch(/N→N\+1 drift/);
    // Fail closed — never invent a delta or Merkle seal.
    expect(tile).not.toMatch(/N→N\+1 delta\s*[:=]/);
    expect(tile + panel).not.toMatch(/Merkle seal:\s*[0-9a-f]{16,}/i);
    const j = JSON.parse(honesty);
    expect(j.chrome_followup.BoardAttestation).toMatch(/living root-as-index/i);
    expect(j.chrome_followup["AttestationDeepDive.ProgressPanel"]).toMatch(/UNCHECKABLE/i);
    expect(j.n_to_n_plus_1_drift.status).toBe("UNCHECKABLE");
  });
});
