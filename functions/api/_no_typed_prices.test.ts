import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The revenue contract (functions/api/revenue.ts `no_prices`) says: no surface publishes a price;
 * metered amounts appear only inside a 402 challenge. Twice on 2026-09-13 a lane landed a static
 * `public/x402-buyer-guide.html` typing "$0.01 … $100" and "tiers" — amounts that also disagreed
 * with the live doors (10000 atomic). #2159 removed it; #2180 re-added it with the note that it
 * had been "force-pushed out". It had been removed on purpose. This test makes the rule a gate
 * so the removal cannot be undone by a re-push: no top-level public/*.html may type a USD amount.
 */
const PUBLIC = join(process.cwd(), "public");
// A "$0.10" is a price. "0.02 USDC" on its own can be a fact (what-is-new reports lifetime
// revenue that way and must keep doing so); it is a price only when it is offered "per" something.
const TYPED_USD = /\$\s?\d+(?:\.\d+)?|\b\d+(?:\.\d+)?\s?USDC\s+(?:per|each|for)\b/i;

describe("static public HTML types no prices (revenue contract: amounts live only in a 402)", () => {
  it("no top-level public/*.html carries a typed USD amount or a USDC-per-thing offer", () => {
    const offenders: string[] = [];
    for (const name of readdirSync(PUBLIC)) {
      if (!name.endsWith(".html")) continue;
      const text = readFileSync(join(PUBLIC, name), "utf8");
      const m = text.match(TYPED_USD);
      if (m) offenders.push(`${name}: "${m[0]}"`);
    }
    expect(offenders, "a static page types a price — the 402 challenge is the only place an amount may appear").toEqual([]);
  });
});
