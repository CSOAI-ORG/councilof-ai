import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const panel = readFileSync(resolve(__dirname, "AttestationDeepDive.tsx"), "utf8");
const tile = readFileSync(resolve(__dirname, "BoardAttestation.tsx"), "utf8");
const honesty = readFileSync(
  resolve(__dirname, "../../../public/interop/living-root-as-index-honesty.json"),
  "utf8",
);

describe("living root-as-index + N\u2192N+1 UNCHECKABLE honesty", () => {
  it("publishes honesty JSON: card_count 43, merkle prefix, drift UNCHECKABLE, board 22\u00b715\u00b77", () => {
    const j = JSON.parse(honesty);
    expect(j.live_roots.card_count).toBe(43);
    expect(j.live_roots.merkle_root_prefix).toBe("4a9a5036");
    expect(j.n_to_n_plus_1_drift.status).toBe("UNCHECKABLE");
    expect(j.board.public_count).toMatch(/22 axis \u00b7 15 measured/);
    expect(j.board.do_not_fill_empty).toBe(true);
  });

  it("BoardAttestation links living root-as-index /root.json", () => {
    expect(tile).toMatch(/Living root-as-index/i);
    expect(tile).toContain('href="/root.json"');
    expect(tile).toMatch(/unsigned envelope until keystone|unsigned until keystone/i);
  });

  it("AttestationDeepDive keeps XRPL reader + NO_LAPTOP_SIGN + live 16; ProgressPanel is N\u2192N+1 UNCHECKABLE", () => {
    expect(panel).toContain('fetch("/root.json")');
    expect(panel).toContain('fetch("/api/xrpl")');
    expect(panel).toMatch(/reader/i);
    expect(panel).toContain("writes_board");
    expect(panel).toContain("NO_LAPTOP_SIGN");
    expect(panel).toContain("n === 16");
    expect(panel).toMatch(/N\u2192N\+1 drift \u00b7 UNCHECKABLE|N\u2192N\+1/);
    expect(panel).toContain("UNCHECKABLE");
    expect(panel).not.toContain("PLACEHOLDER");
    expect(panel).not.toContain("/api/xrpl is 404");
    expect(tile).not.toContain("/api/xrpl is 404");
  });
});
