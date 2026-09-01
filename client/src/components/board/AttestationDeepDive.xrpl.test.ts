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
    expect(panel).toContain("NO_LAPTOP_SIGN");
    expect(panel).toContain("n === 16");
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
    expect(j.live_roots.card_count).toBe(43);
    expect(j.live_roots.merkle_root_prefix).toBe("4a9a5036");
    expect(j.live_roots.envelope).toMatch(/unsigned until keystone/i);
    expect(j.n_to_n_plus_1_drift.status).toBe("UNCHECKABLE");
    expect(j.board.unmeasured_axes).toBe(7);
    expect(j.do_not).toEqual(
      expect.arrayContaining(["fill the 7 empty", "fake Merkle seal", "new products"]),
    );
    expect(j.sit).toBe("NAMED");
  });

  it("BoardAttestation already cites /root.json as living catalogue (link follow-up tracked in honesty JSON)", () => {
    expect(tile).toMatch(/root\.json/);
    expect(panel).toContain('href="/root.json"');
    // Chrome link/copy follow-up is named in honesty leftover; do not invent MEASURED.
    const j = JSON.parse(honesty);
    expect(j.chrome_followup.BoardAttestation).toMatch(/living root-as-index/i);
    expect(j.chrome_followup["AttestationDeepDive.ProgressPanel"]).toMatch(/UNCHECKABLE/i);
  });
});
