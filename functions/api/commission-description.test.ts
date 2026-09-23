import { describe, expect, it } from "vitest";
import { onRequestGet as manifest } from "../.well-known/x402.json";
import { onRequestGet as commission, signerState } from "./request-attestation";
import { REQUEST_ATTESTATION_DESCRIPTION } from "./_x402_descriptions";

type Challenge = {
  resource: { description: string };
  csoai: {
    signer: { did: string; key_present: boolean; receipt_will_be: string; unsigned_reason: string | null };
  };
};

const context = (path: string, env: Record<string, string> = {}) => ({ request: new Request(`https://councilof.ai${path}`), env });

/** A throwaway Ed25519 key in the exact shape the Pages secret takes. Never a real key. */
async function pkcs8b64(): Promise<string> {
  const kp = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const der = new Uint8Array(await crypto.subtle.exportKey("pkcs8", kp.privateKey));
  return btoa(String.fromCharCode(...der));
}

describe("commission discovery contract", () => {
  it("advertises the same deliverable as the unpaid endpoint challenge", async () => {
    const catalogueResponse = await manifest(context("/.well-known/x402.json") as Parameters<typeof manifest>[0]);
    const catalogue = await catalogueResponse.json() as { resources: { url: string; description: string; accepts: { description: string }[] }[] };
    const door = catalogue.resources.find((row) => new URL(row.url).pathname === "/api/request-attestation");
    expect(door).toBeDefined();
    expect(door!.description).toBe(REQUEST_ATTESTATION_DESCRIPTION);
    expect(door!.accepts[0].description).toBe(REQUEST_ATTESTATION_DESCRIPTION);
    // No subject means no reserve fetch, and no payment header means no facilitator call.
    const response = await commission(context("/api/request-attestation") as Parameters<typeof commission>[0]);
    expect(response.status).toBe(402);
    const challenge = await response.json() as Challenge;
    expect(challenge.resource.description).toBe(door!.description);
    expect(door!.description).toContain("commission receipt");
    expect(door!.description).toContain("up to 24");
    expect(door!.description).toContain("reserve_count reports the full match count");
    expect(door!.description).toContain("Payment never mints a MEASURED cell");
    expect(door!.description).not.toContain("rooted and witnessed");
    expect(door!.description).not.toMatch(/\bevery\b/i);
  });

  it("names what the buyer gets today, not an undated promise (row 3, 2026-09-22)", () => {
    const d = REQUEST_ATTESTATION_DESCRIPTION;
    // The copy that oversold: a conditional nobody could check, with no date.
    expect(d).not.toContain("signed when the Pages signing key is available");
    expect(d).not.toMatch(/\b(soon|shortly|will be signed later)\b/i);
    // What is actually delivered, and by which key.
    expect(d).toContain("content-addressed");
    expect(d).toContain("did:web:csoai.org#board-attestation-1");
    expect(d).toContain("sig_ed25519 null");
    expect(d).toContain("unsigned_reason");
    // Where the buyer checks the claim before paying.
    expect(d).toContain("csoai.signer");
    expect(d).toContain('extensions["offer-receipt"]');
    // No money in copy — verification is free, a grade is never sold, prices live only in accepts[].
    expect(d).not.toMatch(/\$|usd|usdc|\d+\s*cents?/i);
    // buildPaymentRequiredV2 clips resource.description at 500 chars; a longer canonical text would
    // ship a 402 whose deliverable ends mid-sentence (caught on the pod, 2026-09-22).
    expect(d.length).toBeLessThanOrEqual(500);
  });

  it("csoai.signer is derived from the env the paid path signs with", async () => {
    // Absent key: UNSIGNED, and says why — the same reason signPayload() will put in the receipt.
    const bare = await commission(context("/api/request-attestation") as Parameters<typeof commission>[0]);
    const bareBody = await bare.json() as Challenge;
    expect(bareBody.csoai.signer).toMatchObject({
      did: "did:web:csoai.org#board-attestation-1",
      key_present: false,
      receipt_will_be: "UNSIGNED",
      unsigned_reason: "BOARD_SIGN_KEY_PKCS8_B64 absent in Pages env",
    });
    // Present key: SIGNED, no reason — the challenge cannot say SIGNED while the env says otherwise.
    const keyed = await commission(
      context("/api/request-attestation", { BOARD_SIGN_KEY_PKCS8_B64: await pkcs8b64() }) as Parameters<typeof commission>[0],
    );
    expect(keyed.status).toBe(402);
    const keyedBody = await keyed.json() as Challenge;
    expect(keyedBody.csoai.signer).toMatchObject({ key_present: true, receipt_will_be: "SIGNED", unsigned_reason: null });
    // Whitespace-only is absent: the same trim() signPayload applies.
    expect(signerState({ BOARD_SIGN_KEY_PKCS8_B64: "   " }).receipt_will_be).toBe("UNSIGNED");
  });
});
