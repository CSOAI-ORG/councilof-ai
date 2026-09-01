import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const panel = readFileSync(resolve(__dirname, "AttestationDeepDive.tsx"), "utf8");
const tile = readFileSync(resolve(__dirname, "BoardAttestation.tsx"), "utf8");

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

describe("living root-as-index + N→N+1 drift honesty", () => {
  it("BoardAttestation links GET /root.json as living root-as-index", () => {
    expect(tile).toContain('href="/root.json"');
    expect(tile).toMatch(/living root-as-index/i);
    expect(tile).toMatch(/unsigned envelope until keystone/i);
  });

  it("ProgressPanel renders N→N+1 drift as UNCHECKABLE without inventing a seal", () => {
    expect(panel).toMatch(/N→N\+1 drift/i);
    expect(panel).toContain("UNCHECKABLE");
    expect(panel).toMatch(/do not invent drift/i);
    expect(panel).not.toMatch(/fake Merkle seal invented/i);
  });
});
