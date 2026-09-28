/**
 * #card-attestation-2 (added on rotation, 27 Sep 2026) is a pinned card key (2026-09-28).
 *
 * The verify_card tool description named only #card-attestation-1 and the pin set held only that
 * card key, so a measurement card signed under the rotated key came back UNCHECKABLE
 * (key_not_pinned) — description and behaviour agreed with each other and disagreed with did.json.
 * These cases pin the key to the published DID document, prove a card naming it is CHECKED (not
 * turned away), and prove the legacy inline-key rule still admits only #card-attestation-1.
 */
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CARD_ATTESTATION_2_HEX, CARD_ATTESTATION_2_KID, PINNED_ANCHORS, verifyCard } from "./cardVerify";
import { verifyToolResult } from "../mcp/_handlers";
import TOOLS from "../mcp/gspc-tools.json";

const ROOT = resolve(__dirname, "../..");
const did = JSON.parse(readFileSync(resolve(ROOT, "public/.well-known/did.json"), "utf8"));
const jwkHex = (id: string) => {
  const vm = did.verificationMethod.find((m: { id: string }) => m.id === id);
  return Buffer.from(vm.publicKeyJwk.x, "base64url").toString("hex");
};
const cardsDir = resolve(ROOT, "public/signed/cards");
const legacy = JSON.parse(readFileSync(resolve(cardsDir, readdirSync(cardsDir).filter((f) => f.endsWith(".json")).sort()[0]), "utf8"));

beforeEach(() => vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("Network is mocked"); })));
afterEach(() => vi.unstubAllGlobals());

describe("#card-attestation-2 is pinned, and pinned to the published key", () => {
  it("the pinned hex is the did.json verificationMethod's key, and it is an assertion method", () => {
    expect(PINNED_ANCHORS.find((a) => a.id === CARD_ATTESTATION_2_KID)?.hex).toBe(CARD_ATTESTATION_2_HEX);
    expect(jwkHex(CARD_ATTESTATION_2_KID)).toBe(CARD_ATTESTATION_2_HEX);
    expect(did.assertionMethod).toContain(CARD_ATTESTATION_2_KID);
    // #card-attestation-1 stays pinned: the signed card index verifies under it
    expect(PINNED_ANCHORS.map((a) => a.id)).toContain("did:web:csoai.org#card-attestation-1");
  });

  it("a legacy inline-key card still verifies VALID under #card-attestation-1", async () => {
    const v = await verifyCard(legacy, []);
    expect(v.valid, v.reasons.join(",")).toBe(true);
  });

  it("a card naming #card-attestation-2 is checked against that key, not turned away as unpinned", async () => {
    const { pubkey: _drop, ...rest } = legacy;
    const named = { ...rest, did: CARD_ATTESTATION_2_KID }; // signed by #1, so the signature must fail under #2
    const v = await verifyCard(named, []);
    expect(v.reasons).not.toContain("key_not_pinned");
    expect(v.reasons).toContain("signature_invalid");
    expect(v.valid).toBe(false);
  });

  it("the legacy inline-key rule still admits only #card-attestation-1", async () => {
    const v = await verifyCard({ ...legacy, pubkey: CARD_ATTESTATION_2_HEX }, []);
    expect(v.valid).toBe(false);
    expect(v.reasons).toContain("wrong_anchor_for_family");
  });

  it("the verify_card tool reports the rotated-key card INVALID (checked), and its description names both card keys", async () => {
    const { pubkey: _drop, ...rest } = legacy;
    const out = (await verifyToolResult({ card: { ...rest, did: CARD_ATTESTATION_2_KID } }, "https://councilof.ai")) as {
      structuredContent?: Record<string, unknown>;
      content: { text: string }[];
    };
    const r = (out.structuredContent ?? JSON.parse(out.content[0].text)) as { state: string; reasons: string[] };
    expect(r.state).toBe("INVALID");
    expect(r.reasons).not.toContain("key_not_pinned");
    const desc = (TOOLS.tools.find((t) => t.name === "verify_card") as { description: string }).description;
    expect(desc).toContain("#card-attestation-1");
    expect(desc).toContain("#card-attestation-2");
  });
});
