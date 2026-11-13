import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyRecord } from "./recordVerify";
import { verifySignedRunDoc } from "../../../functions/_lib/signedRunVerify";
import { jsCanonical, sha256hex } from "../../../functions/_lib/cardVerify";

const real = () => JSON.parse(readFileSync(new URL(
  "../../../public/claims/claimreg-ai-assurance-and-settlement-2026-09-23-rev2.signed.json",
  import.meta.url,
), "utf8"));
afterEach(() => vi.unstubAllGlobals());

describe("browser signed-run dispatch", () => {
  it("verifies the actual Watchdog sidecar offline with the API's shared verifier", async () => {
    const fetch = vi.fn(() => { throw new Error("No network permitted"); });
    vi.stubGlobal("fetch", fetch);
    const doc = real();
    const expected = await verifySignedRunDoc(doc);
    const actual = await verifyRecord(JSON.stringify(doc));
    expect(actual.state).toBe("VALID");
    expect(actual.state).toBe(expected.state);
    expect(actual.family).toBe(expected.family);
    expect(actual.reasons).toEqual(expected.reasons);
    expect(actual.lines.find((c) => c.code === "record_not_posted")?.ok).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("rejects an edited payload rather than reporting an unsupported family", async () => {
    const doc = real();
    doc.payload.artifact.sha256 = "00".repeat(32);
    expect(await verifyRecord(JSON.stringify(doc))).toMatchObject({ state: "INVALID", reasons: ["payload_digest_mismatch"] });
  });
  it("still rejects a tampered payload after its digest is recomputed", async () => {
    const doc = real();
    doc.payload.registry_id += "-changed";
    doc.signature.payload_sha256 = await sha256hex(new TextEncoder().encode(jsCanonical(doc.payload)));
    expect(await verifyRecord(JSON.stringify(doc))).toMatchObject({ state: "INVALID", reasons: ["signature_invalid"] });
  });
  it("keeps an unknown signing authority uncheckable", async () => {
    const doc = real();
    doc.signature.did = "did:web:example.invalid#key";
    expect(await verifyRecord(JSON.stringify(doc))).toMatchObject({ state: "UNCHECKABLE", reasons: ["key_not_pinned"] });
  });
  it("rejects malformed signature bytes", async () => {
    const doc = real();
    doc.signature.sig_ed25519 = "not-a-signature";
    expect(await verifyRecord(JSON.stringify(doc))).toMatchObject({ state: "INVALID", reasons: ["signature_malformed"] });
  });
});
