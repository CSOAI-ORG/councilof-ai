import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestPost } from "../../../functions/api/sign";
import { sealArtifact } from "./sovTools";

// The browser's fetch("/api/sign") is routed to the real door handler, so these tests see the
// bytes the deployed door returns (a 503 SIGNER_UNAVAILABLE body when its key is not
// provisioned, a sealed envelope when it is), not a shape written for the test.
const ORIGIN = "https://councilof.ai";

async function testKeyPkcs8B64(): Promise<string> {
  const kp = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const der = new Uint8Array(await crypto.subtle.exportKey("pkcs8", kp.privateKey));
  return btoa(String.fromCharCode(...der));
}

function door(env: Record<string, string>) {
  const network = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(new URL(String(input), ORIGIN), init);
    return onRequestPost({ request, env } as never);
  });
  vi.stubGlobal("fetch", network);
  return network;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("sealArtifact", () => {
  it("says not sealed when the door's key is not provisioned, and puts no local hash in the seal's place", async () => {
    const network = door({});
    const result = await sealArtifact("answers");
    expect(network).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(false);
    expect(result.text).toBe(
      "Not sealed: the signing door is not running (/api/sign answered 503 SIGNER_UNAVAILABLE). Nothing was claimed in its place.",
    );
    expect(result.text).not.toMatch(/sha256|content hash/i);
  });

  it("returns the door's Ed25519 seal when the key is provisioned", async () => {
    door({ ARTIFACT_SIGN_KEY_PKCS8_B64: await testKeyPkcs8B64() });
    const result = await sealArtifact("answers");
    expect(result.ok).toBe(true);
    expect(result.text).toMatch(/^COAI:SOV:[0-9a-f]{16}\nsig [0-9a-f]{56} · Ed25519 · Layer 0$/);
    expect(result.raw).toMatchObject({ sealed: true, alg: "ed25519" });
  });

  it("says not sealed when the door cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    const result = await sealArtifact("answers");
    expect(result).toMatchObject({ ok: false, state: "unreachable" });
    expect(result.text).toBe("Not sealed: the signing door (/api/sign) could not be reached. Nothing was claimed in its place.");
  });

  it("an answer with no signature is not a seal, whatever its status", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ fingerprint: "SOV:0000000000000000" }), { status: 200, headers: { "content-type": "application/json" } })));
    const result = await sealArtifact("answers");
    expect(result.ok).toBe(false);
    expect(result.text).toBe("Not sealed: /api/sign answered 200 without a signature and public key. Nothing was claimed in its place.");
  });
});
