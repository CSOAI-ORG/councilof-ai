import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { verifyCard } from "../lib/cardVerify.mjs";
import { verifyOffline } from "../lib/gspcVerify.mjs";

const published = JSON.parse(readFileSync(fileURLToPath(new URL(
  "../../../packages/gspc-card-verifier/test/fixtures/01-genuine.json", import.meta.url,
)), "utf8"));
const body = { schema: "synthetic.signature-required/0.1", value: "release-1" };
const unsigned = [
  ["measurement", { ...published, signature: "" }],
  ["content-id", { ...body,
    content_id: createHash("sha256").update(JSON.stringify(body)).digest("hex"),
    signature: { did: "did:web:csoai.org#board-attestation-1", sig_ed25519: "" },
  }],
];

describe("generated extension verifier requires a verified signature", () => {
  it.each(unsigned)("%s: matching bytes and a pinned key cannot make unsigned bytes VALID", async (_family, card) => {
    const result = await verifyCard(card, []);
    expect(result.checks.find(c => c.code === "id_match")?.ok).toBe(true);
    expect(result.anchor_id).toBeTruthy();
    expect(result.valid).toBe(false);
    expect(result.state).toBe("UNCHECKABLE");
    expect(result.reasons).toContain("unsigned");
  });

  it.each(unsigned)("%s: the popup wrapper also keeps the result UNCHECKABLE", async (_family, card) => {
    // The wrapper already rejected unsigned cards before the generated module repair.
    expect((await verifyOffline(card)).state).toBe("UNCHECKABLE");
  });

  it("retains a real signed positive control in the generated module and popup wrapper", async () => {
    const result = await verifyCard(published, []);
    expect(result.valid).toBe(true);
    expect(result.state).toBe("VALID");
    expect(result.checks.find(c => c.code === "signature_valid")?.ok).toBe(true);
    expect((await verifyOffline(published)).state).toBe("VALID");
  });

  it("does not erase a positive preimage failure when the signature is absent", async () => {
    const result = await verifyCard({ ...published, signature: "", body: { changed: true } }, []);
    expect(result.valid).toBe(false);
    expect(result.state).toBe("INVALID");
    expect(result.reasons).toContain("preimage_mismatch");
    expect(result.reasons).toContain("unsigned");
  });
});
