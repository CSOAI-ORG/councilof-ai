/**
 * /gspc-verify reads card-v0 leaves (paid-route lane, 7 Oct 2026).
 *
 * A paid art50 pack says "verify: /gspc-verify", and the pane labels its card "verify at
 * /gspc-verify". The page's single-record check went to cardVerify, which does not know the card-v0
 * shape, so the record a buyer had just paid for came back UNCHECKABLE / unrecognised_family. It now
 * goes through the same verdict as POST /api/verify (functions/_lib/cardV0Verify.ts).
 */
import { describe, expect, it } from "vitest";
import { verifyRecord } from "./recordVerify";
import { signPayload, cardV0 } from "../../../functions/_lib/cardSign";

async function throwawayLeaf() {
  const kp = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", kp.privateKey));
  const payload = { kind: "csoai.art50.marking-evidence/0.1", checked: [{ method: "c2pa.manifest-store", result: "NOT_DETECTED" }] };
  const leaf = await signPayload(payload, btoa(String.fromCharCode(...pkcs8)));
  return cardV0({ surface: "art50.marking-evidence", subject: "sha256:00", as_of: "2026-10-07T00:00:00Z", source_urls: [], payload, leaf });
}

describe("verify page — card-v0 leaves", () => {
  it("judges a card-v0 leaf as csoai.card-v0, never unrecognised_family", async () => {
    const card = await throwawayLeaf();
    const v = await verifyRecord(JSON.stringify(card));
    expect(v.family).toBe("csoai.card-v0");
    expect(v.reasons).not.toContain("unrecognised_family");
    expect(v.lines.find((l) => l.code === "sha256_ok")?.ok).toBe(true);
    // signed by a throwaway key under the pinned board DID: a positive INVALID, stated as such
    expect(v.state).toBe("INVALID");
    expect(v.reasons).toEqual(["signature_invalid"]);
  });

  it("accepts the whole delivered pack and checks its `card`", async () => {
    const card = await throwawayLeaf();
    const v = await verifyRecord(JSON.stringify({ schema: "csoai.art50.marking-evidence/0.1", scope: {}, card, law: {} }));
    expect(v.family).toBe("csoai.card-v0");
    expect(v.lines[0].detail).toMatch(/its `card` is the signed record/);
  });

  it("a tampered payload is INVALID by digest, before any key is consulted", async () => {
    const card = (await throwawayLeaf()) as { payload: Record<string, unknown> };
    card.payload.checked = [{ method: "c2pa.manifest-store", result: "DETECTED" }];
    const v = await verifyRecord(JSON.stringify(card));
    expect(v.state).toBe("INVALID");
    expect(v.reasons).toEqual(["sha256_mismatch"]);
  });

  it("an unsigned leaf is UNCHECKABLE, not INVALID", async () => {
    const payload = { kind: "x" };
    const leaf = await signPayload(payload, undefined);
    const v = await verifyRecord(JSON.stringify(cardV0({ surface: "s", subject: "s", as_of: "t", source_urls: [], payload, leaf })));
    expect(v.state).toBe("UNCHECKABLE");
    expect(v.reasons).toEqual(["unsigned"]);
  });
});
