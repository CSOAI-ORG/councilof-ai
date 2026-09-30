import { afterEach, describe, expect, it, vi } from "vitest";

import { CARD_ATTESTATION_HEX } from "../_lib/cardVerify";
import { onRequestGet } from "./cards";

// 8f9a00a2… is the living-board signer: it signs the cross-border card and is NOT a
// verificationMethod of did:web:csoai.org. Base64 of those 32 bytes, as the card carries it.
const UNPUBLISHED_B64 = "j5oAooz8duNgKf6AXz5CGVj019QsTxFIZZGKEAExORI=";
const hexToB64 = (h: string) => btoa(String.fromCharCode(...h.match(/../g)!.map((x) => parseInt(x, 16))));

afterEach(() => {
  vi.unstubAllGlobals();
});

async function cardsWith(crossBorderPubkeyB64: string) {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/signed/board_living.json")) return Response.json({ signed: true, axes: {} });
    if (url.endsWith("/signed/card_index.json"))
      return Response.json({
        cards: [
          { card: "a", axis: "gov", signed: true, kid: "card-attestation-1", pubkey: CARD_ATTESTATION_HEX },
          { card: "b", axis: "gov", signed: true, kid: "card-attestation-1", pubkey: "00".repeat(32) },
        ],
      });
    if (url.endsWith("/signals/cross-border-card.signed.json"))
      return Response.json({ content_id: "c", signature: { sig: "AA==", pubkey: crossBorderPubkeyB64 } });
    return Response.json({}, { status: 404 });
  }));
  const res = await onRequestGet({ request: new Request("https://councilof.ai/api/cards") } as Parameters<typeof onRequestGet>[0]);
  return (await res.json()) as {
    cross_border: { signer_in_did: boolean; anchoring: string; signer_pubkey_hex: string; signer_kid: string | null };
    cards: { signed: number; signed_under_did_key: number };
  };
}

describe("GET /api/cards signer anchoring", () => {
  it("does not count a signature under an unpublished key as signed under the DID", async () => {
    const b = await cardsWith(UNPUBLISHED_B64);
    expect(b.cross_border.signer_pubkey_hex).toBe("8f9a00a28cfc76e36029fe805f3e421958f4d7d42c4f114865918a1001313912");
    expect(b.cross_border.signer_in_did).toBe(false);
    expect(b.cross_border.anchoring).toBe("UNANCHORED");
    expect(b.cards.signed).toBe(3); // every entry carries a signature
    expect(b.cards.signed_under_did_key).toBe(1); // only the card whose key the DID publishes
  });

  it("control: the same card under a published key counts as anchored", async () => {
    const b = await cardsWith(hexToB64(CARD_ATTESTATION_HEX));
    expect(b.cross_border.signer_in_did).toBe(true);
    expect(b.cross_border.signer_kid).toBe("did:web:csoai.org#card-attestation-1");
    expect(b.cards.signed_under_did_key).toBe(2);
  });
});
