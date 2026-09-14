import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const notice = readFileSync(resolve(__dirname, "PublicPrivacy.tsx"), "utf8");
const witness = readFileSync(resolve(__dirname, "../../../../functions/api/witness.ts"), "utf8");
const receipts = readFileSync(resolve(__dirname, "../../../../functions/api/receipts/index.ts"), "utf8");

describe("the operative privacy notice follows the public handlers", () => {
  it("describes the quarantined witness route instead of its fixture-only queue implementation", () => {
    expect(witness).toMatch(/export const onRequestGet:[^\n]+=> unavailable\(request\)/);
    expect(witness).toMatch(/export const onRequestPost:[^\n]+=> unavailable\(request\)/);
    expect(notice).toContain("returns HTTP 503 before it reads a submitted");
    expect(notice).toMatch(/The retained queue code is\s+not the public handler/);
    expect(notice).not.toContain("Paid witness requests:");
    expect(notice).not.toContain("functions/api/witness.ts writes a queue entry");
  });

  it("calls the address-indexed receipt lookup public and does not imply ownership authentication", () => {
    expect(receipts).toContain('url.searchParams.get("payer")');
    expect(receipts).toContain("handle(request, (p) => readReceipts(p, env?.REVENUE_KV))");
    expect(notice).toContain("/api/receipts?payer= is a public lookup");
    expect(notice).toContain("It does not authenticate ownership of that address");
    expect(notice).not.toContain("look up its own receipts");
  });

  it("qualifies legal retention, erasure and response periods", () => {
    expect(notice).toContain("may need to be kept longer");
    expect(notice).toContain("where no exemption applies");
    expect(notice).toContain("up to two");
    expect(notice).toContain("additional months");
    expect(notice).not.toContain("then deleted on request");
    expect(notice).not.toContain("We answer within one month");
  });
});
