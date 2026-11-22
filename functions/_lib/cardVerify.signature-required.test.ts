import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CARD_ATTESTATION_HEX, verifyCard } from "./cardVerify";
import { onRequestPost } from "../api/verify";
import { verifyToolResult } from "../mcp/_handlers";

const published = JSON.parse(readFileSync(resolve(__dirname,
  "../../public/signed/cards/82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a09a1c.json"), "utf8"));
const did = JSON.parse(readFileSync(resolve(__dirname, "../../public/.well-known/did.json"), "utf8"));
const body = { schema: "synthetic.signature-required/0.1", value: "release-1" };
const content_id = createHash("sha256").update(JSON.stringify(body)).digest("hex");
const unsignedContent = { ...body, content_id,
  signature: { did: "did:web:csoai.org#board-attestation-1", sig_ed25519: "" } };
const unsignedMeasurement = { ...published, signature: "" };

beforeEach(() => vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  return url.endsWith("/.well-known/did.json")
    ? new Response(JSON.stringify(did), { status: 200 })
    : new Response("", { status: 200 });
})));
afterEach(() => vi.unstubAllGlobals());

describe("a cryptographic VALID result requires a verified signature", () => {
  it.each([
    ["measurement", unsignedMeasurement],
    ["content-id", unsignedContent],
  ])("%s: a matching hash and pinned key do not authenticate unsigned bytes", async (_family, card) => {
    const result = await verifyCard(card, []);
    expect(result.checks.find(c => c.code === "id_match")?.ok).toBe(true);
    expect(result.anchor_id).toBeTruthy();
    expect(result.valid).toBe(false);
    expect(result.state).toBe("UNCHECKABLE");
    expect(result.reasons).toContain("unsigned");
  });

  it("an arbitrary new body with a correctly recomputed id is still unauthenticated", async () => {
    const forged = { schema: body.schema, value: "unapproved-release-2" };
    const card = { ...forged, content_id: createHash("sha256").update(JSON.stringify(forged)).digest("hex"),
      signature: unsignedContent.signature };
    const result = await verifyCard(card, []);
    expect(result.valid).toBe(false);
    expect(result.state).toBe("UNCHECKABLE");
    expect(result.reasons).toContain("unsigned");
  });

  it("a positive preimage failure remains INVALID even when the signature is missing", async () => {
    const result = await verifyCard({ ...unsignedMeasurement, body: { changed: true } }, []);
    expect(result.valid).toBe(false);
    expect(result.state).toBe("INVALID");
    expect(result.reasons).toContain("preimage_mismatch");
    expect(result.reasons).toContain("unsigned");
  });

  it.each([" ", "not-a-signature", "00".repeat(64)])("malformed or incorrect signature %s cannot pass", async signature => {
    const result = await verifyCard({ ...published, signature }, []);
    expect(result.valid).toBe(false);
    expect(result.state).toBe("INVALID");
  });

  it("a real published signature still verifies without a live anchor cross-check", async () => {
    const result = await verifyCard(published, []);
    expect(result.valid).toBe(true);
    expect(result.state).toBe("VALID");
    expect(result.checks.find(c => c.code === "signature_valid")?.ok).toBe(true);
    expect(result.checks.find(c => c.code === "live_anchor_unavailable")?.ok).toBeNull();
  });

  it("the HTTP handler does not promote an unsigned card to cryptographic VALID", async () => {
    const response = await (onRequestPost as any)({ request: new Request("https://councilof.ai/api/verify", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(unsignedContent),
    }) });
    const result = await response.json();
    expect(result.state).toBe("UNCHECKABLE");
    expect(result.cryptographic_state).toBe("UNCHECKABLE");
    expect(result.reasons).toContain("unsigned");
  });

  it("the MCP handler carries the same refusal", async () => {
    const response = await verifyToolResult({ card: unsignedContent }, "https://councilof.ai");
    const result = (response.structuredContent ?? JSON.parse(response.content[0].text)) as any;
    expect(result.state).toBe("UNCHECKABLE");
    expect(result.reasons).toContain("unsigned");
  });

  it("a claimed live anchor cannot authenticate an empty measurement signature", async () => {
    const result = await verifyCard(unsignedMeasurement, [{
      id: "did:web:csoai.org#card-attestation-1", hex: CARD_ATTESTATION_HEX,
    }]);
    expect(result.valid).toBe(false);
    expect(result.state).toBe("UNCHECKABLE");
  });
});
