import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

/**
 * Cards for the x402 settlement census. Every one records ONE purchase from ONE host at ONE moment,
 * so every one is UNMEASURED and must say what a single observation cannot support. The 3 Sep ruling
 * puts MEASURED at n>=30; nothing here is close, and a card that quietly dropped its `unmeasured`
 * array would read as a verdict about a host's reliability that we have not earned.
 */
const ROOT = resolve(__dirname, "../..");
const CARDS = resolve(__dirname, "cards");
const SCHEMA = JSON.parse(readFileSync(resolve(ROOT, "public/schema/card-v0.json"), "utf8"));
const files = existsSync(CARDS) ? readdirSync(CARDS).filter((f) => f.endsWith(".json")) : [];

describe("x402 settlement cards", () => {
  it("exist, so this suite cannot pass vacuously", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it("carry every field card-v0 requires, with a surface the schema knows", () => {
    const bad: string[] = [];
    for (const f of files) {
      const c = JSON.parse(readFileSync(resolve(CARDS, f), "utf8"));
      for (const k of SCHEMA.required) if (!(k in c)) bad.push(`${f}: missing ${k}`);
      if (!SCHEMA.properties.surface.enum.includes(c.surface)) bad.push(`${f}: surface ${c.surface}`);
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });

  it("hash their own payload — a card whose sha does not recompute is not evidence", () => {
    const bad: string[] = [];
    for (const f of files) {
      const c = JSON.parse(readFileSync(resolve(CARDS, f), "utf8"));
      const canon = JSON.stringify(c.payload, Object.keys(c.payload).sort());
      // recompute with the producer's rule: sorted keys, no spaces
      const sorted = JSON.stringify(
        Object.fromEntries(Object.keys(c.payload).sort().map((k) => [k, c.payload[k]])),
      );
      const h = createHash("sha256").update(sorted).digest("hex");
      if (h !== c.sha256) bad.push(f);
      void canon;
    }
    expect(bad.length, "sha256 must recompute from the payload").toBe(0);
  });

  it("stay under the 3 KB gate the signer enforces", () => {
    const over = files.filter((f) => Buffer.byteLength(readFileSync(resolve(CARDS, f), "utf8")) > 3072);
    expect(over, "a card over 3 KB makes the signer HALT").toEqual([]);
  });

  it("are UNMEASURED at n=1 and say what one purchase cannot show", () => {
    const bad: string[] = [];
    for (const f of files) {
      const c = JSON.parse(readFileSync(resolve(CARDS, f), "utf8"));
      if (!Array.isArray(c.unmeasured) || c.unmeasured.length < 3) { bad.push(`${f}: thin unmeasured`); continue; }
      if (c.payload?.n !== 1) bad.push(`${f}: n is ${c.payload?.n}, not 1`);
      const t = c.unmeasured.join(" ");
      for (const w of ["reliability", "good_faith"]) {
        if (!t.includes(w)) bad.push(`${f}: unmeasured never mentions ${w}`);
      }
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });

  it("say plainly when a host took a settlement and still refused", () => {
    const refused = files
      .map((f) => JSON.parse(readFileSync(resolve(CARDS, f), "utf8")))
      .filter((c) => c.payload?.status === "REFUSED");
    expect(refused.length, "the take-and-refuse hosts must have cards of their own").toBeGreaterThan(0);
    for (const c of refused) {
      expect(c.payload.settle_tx, "a refusal card without a tx is not evidence of anything").toBeTruthy();
      expect(String(c.payload.note)).toMatch(/money moved, nothing was delivered/);
    }
  });
});

describe("the surface-level atom the signer reads", () => {
  const atom = resolve(ROOT, "public/interop/ledger-card-x402-settlement-unsigned.json");
  it("exists and is registered in the compact index", () => {
    expect(existsSync(atom)).toBe(true);
    const compact = JSON.parse(readFileSync(resolve(ROOT, "public/interop/ledger-cards-compact.json"), "utf8"));
    expect(Object.keys(compact)).toContain("x402.settlement");
  });
  it("claims no revenue and no ranking", () => {
    const a = JSON.parse(readFileSync(atom, "utf8"));
    expect(a.payload.flags.revenue).toBe(false);
    expect(a.payload.flags.ranking).toBe(false);
    expect(a.payload.flags.hosts_contacted).toBe(false);
    expect(a.note).toMatch(/not certification/i);
  });
  it("is under the 3 KB gate", () => {
    expect(Buffer.byteLength(readFileSync(atom, "utf8"))).toBeLessThanOrEqual(3072);
  });
});
