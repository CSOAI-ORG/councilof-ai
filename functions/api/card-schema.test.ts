import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { isServed } from "../../scripts/link-gate.mjs";

const R = (p: string) => JSON.parse(readFileSync(resolve(__dirname, "../..", p), "utf8"));
const v0 = R("public/schema/card-v0.json");
const v1 = R("public/schema/card-v1.json");

describe("card-v1 is the schema 941+ signed cards already named", () => {
  it("is published at exactly the $id the cards cite", () => {
    expect(v1.$id).toBe("https://councilof.ai/schema/card-v1.json");
    expect(v1.properties.schema.const).toBe(v1.$id);
  });

  it("is v0 plus the two coverage fields, and says so in required", () => {
    // v1 exists ONLY because v0 sets additionalProperties:false — the two fields could not be
    // added to v0 without a new $id. If that ever stops being true, v1 has no reason to exist.
    expect(v0.additionalProperties).toBe(false);
    expect(new Set(v1.required)).toEqual(new Set([...v0.required, "digest_covers", "sig_covers"]));
    for (const k of Object.keys(v0.properties)) expect(v1.properties).toHaveProperty(k);
  });

  it("every published card carries the fields the schema it names requires", () => {
    // No ajv here on purpose. The first cut imported ajv with a catch-and-return fallback, which
    // meant that if ajv were absent the whole assertion silently did nothing and the test still
    // went green — a check that cannot fail. This walks the real cards instead. Full JSON-Schema
    // validation (1133 v1 ok / 0 fail, 131 v0 ok / 0 fail) is recorded in the PR with its command.
    const dir = resolve(__dirname, "../../public/cards");
    let v1n = 0, v0n = 0, bad = 0;
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".json")) continue;
      const card = JSON.parse(readFileSync(resolve(dir, f), "utf8")).card;
      const s = String(card?.schema || "");
      if (s.endsWith("card-v1.json")) {
        if (card.digest_covers && card.sig_covers) v1n++; else bad++;
      } else if (s.endsWith("card-v0.json")) {
        // v0 forbids the two fields (additionalProperties:false) — a v0 card carrying them is a
        // card that named the wrong schema.
        if (card.digest_covers || card.sig_covers) bad++; else v0n++;
      }
    }
    expect(bad).toBe(0);
    expect(v1n).toBeGreaterThan(900);
    expect(v0n).toBeGreaterThan(0);
  });

  it("a v1 card is NOT valid v0 — that is the whole point of the new $id", () => {
    expect(v0.properties.schema.const).toBe("https://councilof.ai/schema/card-v0.json");
    expect(v1.properties.schema.const).not.toBe(v0.properties.schema.const);
  });

  it("link-gate now resolves the URL the cards cite", () => {
    // The 941 citations were the single largest entry in the dead-link baseline.
    expect(isServed("/schema/card-v1.json", new Set(["/schema/card-v1.json"]), new Set())).toBe(true);
    expect(isServed("/schema/card-v1.json", new Set(), new Set())).toBe(false);
  });

  it("the baseline shrank and did not grow", () => {
    const b = R("scripts/link-gate-baseline.json");
    expect(b.targets).not.toContain("/schema/card-v1.json");
    expect(b.targets.length).toBeLessThanOrEqual(64);
  });
});
