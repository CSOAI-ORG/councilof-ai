/**
 * Pins the "Verify a single record" box against cards the estate actually publishes.
 *
 * This regressed once: the box canonicalised its own way and told readers the Council's
 * own signature was INVALID on every published card. The two cards below are read from
 * public/signed/cards/ as bytes, not fixtures — if a future refactor stops matching the
 * published rules, these fail rather than the reader finding out.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canonical, sha256hex, verifyRecord } from "./recordVerify";

const cardPath = (id: string) =>
  new URL(`../../../public/signed/cards/${id}.json`, import.meta.url);

const readCard = (id: string) => JSON.parse(readFileSync(cardPath(id), "utf8"));

// The card named in the bug report — a plain, non-integral accuracy.
const PLAIN = "82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a09a1c";
// accuracy 0.0 — an integral float. CPython signed "0.0"; JSON.stringify renders "0".
// 116 of the 313 published cards look like this, so a naive canonicaliser fails here.
const INTEGRAL_FLOAT = "00a5218048b4ff922c9793e5d155c7c62b4be5a84de3f09e16af3df59445b3c9";

const line = (v: { lines: { label: string; ok: boolean | null; detail: string }[] }, label: string) =>
  v.lines.find((l) => l.label === label);

describe("verifyRecord — published signed measurement cards", () => {
  for (const [name, id] of [
    ["a card with a normal accuracy", PLAIN],
    ["a card whose accuracy is an integral float", INTEGRAL_FLOAT],
  ] as const) {
    it(`passes ${name}`, async () => {
      const card = readCard(id);
      const v = await verifyRecord(JSON.stringify(card));

      expect(line(v, "Parse")?.ok).toBe(true);
      expect(line(v, "Signing key")?.ok).toBe(true);
      expect(line(v, "id")?.ok).toBe(true);
      expect(line(v, "Signature")?.ok).toBe(true);
      expect(line(v, "Signature")?.detail).toContain("VALID");
      // Nothing on the verdict may read as a failure — that is what the reader sees.
      expect(v.lines.filter((l) => l.ok === false)).toEqual([]);
    });
  }

  it("survives whitespace and key reordering, because it hashes the body not the file", async () => {
    const card = readCard(PLAIN);
    const shuffled = { signature: card.signature, body: card.body, pubkey: card.pubkey, ...card };
    const v = await verifyRecord(JSON.stringify(shuffled, null, 4));
    expect(line(v, "Signature")?.ok).toBe(true);
  });

  it("reports a MISMATCH when one character of the body changes", async () => {
    const card = readCard(PLAIN);
    card.body.accuracy = card.body.accuracy + 0.0001;
    const v = await verifyRecord(JSON.stringify(card));
    expect(line(v, "id")?.ok).toBe(false);
    expect(line(v, "id")?.detail).toContain("MISMATCH");
    // The signature was never reached, so it is unchecked — not "forged".
    expect(line(v, "Signature")?.ok).toBe(null);
  });

  it("refuses a card signed by a key that is not the published one", async () => {
    const card = readCard(PLAIN);
    card.pubkey = "00".repeat(32);
    const v = await verifyRecord(JSON.stringify(card));
    expect(line(v, "Signing key")?.ok).toBe(false);
    expect(line(v, "id")?.ok).toBe(null);
    expect(line(v, "Signature")?.ok).toBe(null);
  });

  it("reports an INVALID signature over an otherwise intact card", async () => {
    const card = readCard(INTEGRAL_FLOAT);
    // Flip the last byte of the signature: key pins, id still matches, signature must not.
    card.signature = card.signature.slice(0, -2) + (card.signature.slice(-2) === "00" ? "01" : "00");
    const v = await verifyRecord(JSON.stringify(card));
    expect(line(v, "Signing key")?.ok).toBe(true);
    expect(line(v, "id")?.ok).toBe(true);
    expect(line(v, "Signature")?.ok).toBe(false);
  });

  it("agrees with the published verifier on every card it is given", async () => {
    // The point of importing verify-card.mjs rather than restating it.
    const { verifyCard } = await import("../../../public/signed/verify-card.mjs");
    for (const id of [PLAIN, INTEGRAL_FLOAT]) {
      const card = readCard(id);
      const cli = await verifyCard(card);
      const box = await verifyRecord(JSON.stringify(card));
      expect(cli.state).toBe("VALID");
      expect(line(box, "Signature")?.ok).toBe(cli.checks.signature);
    }
  });
});

describe("verifyRecord — the estate envelope", () => {
  it("recomputes a content_id over the record body", async () => {
    const body = { record_id: "DR-0001", verdict: { passed: null }, evidence_tag: "[MEASURED]" };
    const rec = { ...body, content_id: await sha256hex(canonical(body)) };
    const v = await verifyRecord(JSON.stringify(rec));
    expect(line(v, "content_id")?.ok).toBe(true);
    expect(line(v, "Signature")?.ok).toBe(null);
    expect(line(v, "Signature")?.detail).toContain("UNSIGNED");
  });

  it("reports a content_id that does not recompute", async () => {
    const rec = { record_id: "DR-0001", content_id: "de".repeat(32) };
    const v = await verifyRecord(JSON.stringify(rec));
    expect(line(v, "content_id")?.ok).toBe(false);
  });

  it("recomputes a replay record's sigil chain_hash and still calls it UNSIGNED", async () => {
    const body = { record_id: "DR-0033", verdict: { predicate: "care_cost", passed: null }, n: 7 };
    const rec = { ...body, sigil: { chain_hash: await sha256hex(canonical(body)), sig_alg: "sha256" } };
    const v = await verifyRecord(JSON.stringify(rec));
    expect(line(v, "chain_hash")?.ok).toBe(true);
    // A sha256 chain is tamper-evidence, not authorship. The verdict must not imply more.
    expect(line(v, "Signature")?.ok).toBe(null);
    expect(line(v, "Signature")?.detail).toContain("UNSIGNED");
  });

  it("reports a tampered replay record", async () => {
    const body = { record_id: "DR-0033", n: 7 };
    const rec = { ...body, n: 8, sigil: { chain_hash: await sha256hex(canonical(body)), sig_alg: "sha256" } };
    const v = await verifyRecord(JSON.stringify(rec));
    expect(line(v, "chain_hash")?.ok).toBe(false);
  });

  it("says so, and checks nothing, when the input is not JSON", async () => {
    const v = await verifyRecord("{not json");
    expect(v.lines).toHaveLength(1);
    expect(v.lines[0].ok).toBe(false);
  });
});
