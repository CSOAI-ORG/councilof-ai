/**
 * cardVerify — regression test against the REAL published corpus.
 *
 * The outside SCITT audit (2026-08-26) found the site's own verifier reporting a
 * genuine published card as "Signature: INVALID — no published key verifies this
 * signature". These tests read the actual bytes out of public/signed/cards/ and
 * public/signals/ so that failure can never ship again unnoticed.
 *
 * Three things are asserted, and they are deliberately separate:
 *   1. every published gspc.measurement-card verifies (INCLUDING the ~37% whose
 *      `accuracy` is integral — the CPython 0.0-vs-0 rule);
 *   2. a tampered card fails for the RIGHT reason (preimage_mismatch), and a
 *      re-signed forgery fails as untrusted_signer — never the other way round;
 *   3. the content_id families are recognised rather than rejected wholesale.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  verifyCard,
  anchorsFromDid,
  pyCanonical,
  GSPC_FLOAT_FIELDS,
  detectFamily,
  CARD_ATTESTATION_HEX,
  type Anchor,
} from "../../../functions/_lib/cardVerify";

const ROOT = resolve(__dirname, "../../..");
const CARD_DIR = resolve(ROOT, "public/signed/cards");
const SIGNAL_DIR = resolve(ROOT, "public/signals");

const readJson = (p: string) => JSON.parse(readFileSync(p, "utf8"));
const ANCHORS: Anchor[] = anchorsFromDid(readJson(resolve(ROOT, "public/.well-known/did.json")));

const cardFiles = readdirSync(CARD_DIR).filter((f) => f.endsWith(".json"));

describe("published trust anchors", () => {
  it("did.json publishes the card-attestation key the cards are signed with", () => {
    expect(ANCHORS.map((a) => a.hex)).toContain(CARD_ATTESTATION_HEX);
    expect(ANCHORS.find((a) => a.hex === CARD_ATTESTATION_HEX)?.id).toBe(
      "did:web:csoai.org#card-attestation-1",
    );
  });
});

describe("gspc.measurement-card — the whole published corpus", () => {
  it("has cards to check", () => {
    expect(cardFiles.length).toBeGreaterThan(100);
  });

  it("reproduces every id and verifies every signature", async () => {
    const failures: { file: string; reasons: string[] }[] = [];
    let integralAccuracy = 0;
    for (const f of cardFiles) {
      const card = readJson(resolve(CARD_DIR, f));
      if (Number.isInteger(card.body?.accuracy)) integralAccuracy++;
      const v = await verifyCard(card, ANCHORS);
      if (!v.valid) failures.push({ file: f, reasons: v.reasons });
    }
    expect(failures).toEqual([]);
    // The bug the audit found bit exactly this subset; assert it is non-trivial so a
    // future regression cannot pass by accident on a corpus that happens to have none.
    expect(integralAccuracy).toBeGreaterThan(0);
  });

  it("filename equals the id it verifies under", () => {
    for (const f of cardFiles) {
      expect(readJson(resolve(CARD_DIR, f)).id).toBe(f.replace(/\.json$/, ""));
    }
  });

  it("renders an integral accuracy as CPython does (0.0, not 0)", () => {
    expect(pyCanonical({ accuracy: 0 }, GSPC_FLOAT_FIELDS)).toBe('{"accuracy":0.0}');
    expect(pyCanonical({ accuracy: 1 }, GSPC_FLOAT_FIELDS)).toBe('{"accuracy":1.0}');
    expect(pyCanonical({ accuracy: 0.0968 }, GSPC_FLOAT_FIELDS)).toBe('{"accuracy":0.0968}');
    // A field that is NOT a declared float still renders as an integer.
    expect(pyCanonical({ n: 30 }, GSPC_FLOAT_FIELDS)).toBe('{"n":30}');
  });

  it("escapes non-ASCII the way ensure_ascii=True does", () => {
    expect(pyCanonical({ note: "a — b" })).toBe('{"note":"a \\u2014 b"}');
  });
});

describe("failure modes stay distinct", () => {
  const sample = () => readJson(resolve(CARD_DIR, cardFiles[0]));

  it("a tampered body reports preimage_mismatch, NOT a trust-anchor problem", async () => {
    const card = sample();
    card.body.accuracy = 0.9999;
    const v = await verifyCard(card, ANCHORS);
    expect(v.valid).toBe(false);
    expect(v.reasons).toContain("preimage_mismatch");
    expect(v.reasons).not.toContain("untrusted_signer");
    // The trust-anchor line must still say the key IS published — it is.
    const anchor = v.checks.find((c) => c.label === "Trust anchor");
    expect(anchor?.ok).toBe(true);
  });

  it("a card re-signed with a stranger's key reports untrusted_signer", async () => {
    const card = sample();
    card.pubkey = "00".repeat(32);
    const v = await verifyCard(card, ANCHORS);
    expect(v.valid).toBe(false);
    expect(v.reasons).toContain("untrusted_signer");
    // and the id still reproduces, so no preimage failure is invented
    expect(v.reasons).not.toContain("preimage_mismatch");
  });

  it("a mangled signature reports signature_invalid, not a missing key", async () => {
    const card = sample();
    const s: string = card.signature;
    card.signature = (s[0] === "0" ? "f" : "0") + s.slice(1);
    const v = await verifyCard(card, ANCHORS);
    expect(v.valid).toBe(false);
    expect(v.reasons).toEqual(["signature_invalid"]);
  });

  it("an unrecognised shape says so, and says what it expected", async () => {
    const v = await verifyCard({ hello: "world" }, ANCHORS);
    expect(v.family).toBe("unknown");
    expect(v.reasons).toEqual(["unrecognised_family"]);
    expect(v.checks[0].detail).toMatch(/gspc\.measurement-card/);
  });
});

describe("the trust anchor is pinned — no key resolution at check time", () => {
  const sample = () => readJson(resolve(CARD_DIR, cardFiles[0]));

  it("a genuine card verifies with NO live anchors at all (network-free verdict)", async () => {
    const v = await verifyCard(sample(), []);
    expect(v.valid).toBe(true);
    const anchor = v.checks.find((c) => c.label === "Trust anchor");
    expect(anchor?.ok).toBe(true);
    expect(anchor?.detail).toMatch(/pinned/);
    // and the cross-check row says it could not run, without deciding anything
    const xc = v.checks.find((c) => c.label === "Live anchor cross-check");
    expect(xc?.ok).toBeNull();
    expect(xc?.code).toBe("live_anchor_unavailable");
  });

  it("a card re-signed with a stranger's key FAILS even when did.json is unreachable", async () => {
    // The hole this closes: before 2026-08-27, anchors=[] made the anchor check
    // ok:null without failing the verdict, so an attacker-keyed card verified
    // whenever did.json could not be fetched. Fail-open is not a trust anchor.
    const card = sample();
    card.pubkey = "00".repeat(32);
    const v = await verifyCard(card, []);
    expect(v.valid).toBe(false);
    expect(v.reasons).toContain("untrusted_signer");
  });
});

describe("the chain manifest is card-shaped and signed", () => {
  const chainDoc = readJson(resolve(ROOT, "public/signed/chain.json"));

  it("is a gspc.measurement-card-shaped envelope over the manifest body", () => {
    expect(detectFamily(chainDoc)).toBe("gspc.measurement-card");
    expect(Array.isArray(chainDoc.body.links)).toBe(true);
    expect(chainDoc.body.length).toBe(chainDoc.body.links.length);
  });

  it("verifies under the pinned card-attestation key with no live anchors", async () => {
    const v = await verifyCard(chainDoc, []);
    expect(v.valid).toBe(true);
    expect(chainDoc.pubkey).toBe(CARD_ATTESTATION_HEX);
  });

  it("its body states what the signature does NOT prove — non-repudiable is not unchosen", () => {
    expect(chainDoc.body.what_this_does_not_prove).toMatch(/did not\s+choose/);
  });
});

describe("content_id card families are recognised, not rejected", () => {
  const signalFiles = readdirSync(SIGNAL_DIR).filter((f) => f.endsWith(".signed.json"));

  it("classifies every published signal as a content_id card", () => {
    expect(signalFiles.length).toBeGreaterThan(0);
    for (const f of signalFiles) {
      expect(detectFamily(readJson(resolve(SIGNAL_DIR, f)))).toBe("csoai.content-id-card");
    }
  });

  it("the cross-border card's content_id derives and its signature verifies", async () => {
    const card = readJson(resolve(SIGNAL_DIR, "cross-border-card.signed.json"));
    const v = await verifyCard(card, ANCHORS);
    expect(v.checks.find((c) => c.label === "content_id")?.ok).toBe(true);
    expect(v.checks.find((c) => c.label === "Signature")?.ok).toBe(true);
    // Its signer is NOT in did.json — the audit's A5. We report that honestly
    // rather than either hiding it or calling the whole card a forgery.
    expect(v.reasons).toEqual(["untrusted_signer"]);
  });
});
