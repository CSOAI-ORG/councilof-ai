import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * These are OFFLINE checks over the offer documents. They deliberately do not probe: the producer
 * costs one self-probe per door and the governor caps a lane at 20 per hour (G5), so a test that
 * probed would be a probe storm on every commit — the exact defect that tightened the cap.
 *
 * What they DO catch is the failure that actually happened. OFFER-commission-card.md carried
 * "NOT DELIVERABLE today (preview empty/402)" for days. It was false: the verdict came from probing
 * the door without `subject`, which its own bazaar extension declares REQUIRED. So a doc may not
 * assert that a door cannot deliver unless it names the probe it drew that from — an unsourced
 * negative claim about our own product is the one that costs us buyers.
 */
const DOCS = resolve(__dirname, "../docs/product");
const offers = readdirSync(DOCS).filter((f) => f.startsWith("OFFER-") && f.endsWith(".md"));

describe("the offer documents", () => {
  it("exist at all, so this suite cannot pass vacuously", () => {
    expect(offers.length).toBeGreaterThan(5);
  });

  it("print no price — the amount is quoted at the 402", () => {
    const bad: string[] = [];
    for (const f of offers) {
      const t = readFileSync(resolve(DOCS, f), "utf8");
      const m = t.match(/[£$€]\s?\d[\d,]*(?:\.\d{2})?\b|\b\d+(?:\.\d{2})?\s?(?:USD|USDC|GBP|EUR)\b/);
      if (m) bad.push(`${f}: ${m[0]}`);
    }
    expect(bad, "an offer doc prints a price").toEqual([]);
  });

  it("never claim a door cannot deliver without naming the probe behind it", () => {
    const bad: string[] = [];
    for (const f of offers) {
      const t = readFileSync(resolve(DOCS, f), "utf8");
      if (!/NOT DELIVERABLE/i.test(t)) continue;
      // the claim is allowed, but only beside the command that produced it
      if (!/curl |generate-partner-offer-docs/.test(t)) bad.push(f);
    }
    expect(bad, "an unsourced NOT DELIVERABLE claim — the one that was false for days").toEqual([]);
  });

  it("say the fact table is produced, not hand-written", () => {
    const bad = offers.filter((f) => {
      const t = readFileSync(resolve(DOCS, f), "utf8");
      return /\| fact \| value \|/.test(t) && !/generate-partner-offer-docs|Derived from live probes/.test(t);
    });
    expect(bad, "a fact table with no stated origin will rot like commission-card did").toEqual([]);
  });
});

describe("the dataset's offer_sku vocabulary resolves to a document", () => {
  const index = readFileSync(resolve(DOCS, "SKU-INDEX.md"), "utf8");
  // every offer_sku the published column can emit, per its own distribution
  const SKUS = ["provider-diff-feed", "request-attestation", "rwa-evidence",
                "evidence-bundle", "art50-marking-evidence"];

  it("names every offer_sku in the vocabulary map", () => {
    const missing = SKUS.filter((s) => !new RegExp(`\\|\\s*${s}\\s*\\|`).test(index));
    expect(missing, "an offer_sku a buyer can be mapped to is absent from the join table").toEqual([]);
  });

  it("points each one at a document that exists, or says PENDING and why", () => {
    // A gap is allowed; a SILENT gap is not. art50-marking-evidence has a live door, 8 mapped
    // hosts and no offer page, and that must stay visible in the table rather than resolve to a
    // filename nobody wrote.
    const broken: string[] = [];
    for (const s of SKUS) {
      const row = index.split("\n").find((l) => new RegExp(`\\|\\s*${s}\\s*\\|`).test(l)) ?? "";
      if (/PENDING/.test(row)) {
        if (!/needs |first/.test(row)) broken.push(`${s}: PENDING with no reason`);
        continue;
      }
      const doc = row.match(/(OFFER-[A-Za-z0-9-]+\.md)/)?.[1];
      if (!doc) { broken.push(`${s}: no doc named and not marked PENDING`); continue; }
      if (!existsSync(resolve(DOCS, doc))) broken.push(`${s} -> ${doc} (named but missing)`);
    }
    expect(broken, "the dataset maps buyers to a SKU with no document and no stated reason").toEqual([]);
  });
});
