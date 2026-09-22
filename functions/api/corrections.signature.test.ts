/**
 * The corrections ledger's signature state must be EARNED on every request.
 *
 * For a month /api/corrections served `signature_state: STALE` — correctly, because 46 entries
 * had been appended since the 2026-08-22 signature and nothing had re-issued it. But the check
 * behind that flag was a string comparison between a recomputed digest and a digest typed beside
 * the signature. Its own note warned what that allows: "Updating id alone would make this field
 * read VALID while the Ed25519 bytes still cover the older content." Nothing in the code stopped
 * it.
 *
 * These tests fix the meaning of each state against the real published signature. They use no
 * fixture and no stub key: the signature under test is the one being served, verified against the
 * public key pinned in the handler. If someone re-signs the ledger, these keep passing. If someone
 * edits an entry and does not, the first one fails — which is the point.
 */
import { describe, expect, it } from "vitest";
import { LEDGER, checkSignature } from "./corrections";

const clone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T;
const ledger = () => clone(LEDGER) as unknown as Record<string, unknown>;

describe("corrections signature, checked at request time", () => {
  it("VALID only after an Ed25519 verification that actually ran", async () => {
    const c = await checkSignature(ledger());
    expect(c.ed25519_verified).toBe(true); // not null, not skipped
    expect(c.content_id_matches).toBe(true);
    expect(c.state).toBe("VALID");
    expect(c.recomputed_content_id).toBe(c.attested_content_id);
  });

  it("an append without a re-issue is STALE, and says the signature itself is sound", async () => {
    const l = ledger();
    (l.corrections as unknown[]).unshift({ id: "C-TEST", date: "2026-09-23", what_was_wrong: "x" });
    const c = await checkSignature(l);
    expect(c.state).toBe("STALE");
    expect(c.ed25519_verified).toBe(true);
    expect(c.content_id_matches).toBe(false);
  });

  it("bumping signature.id alone cannot buy VALID — the id is inside the signed object", async () => {
    const l = ledger();
    (l.corrections as unknown[]).unshift({ id: "C-TEST", date: "2026-09-23", what_was_wrong: "x" });
    const moved = await checkSignature(l);
    (l.signature as { id: string }).id = moved.recomputed_content_id;
    expect((await checkSignature(l)).state).toBe("STALE");
  });

  it("bumping the attestation's content_id too breaks the signature — INVALID, never VALID", async () => {
    const l = ledger();
    (l.corrections as unknown[]).unshift({ id: "C-TEST", date: "2026-09-23", what_was_wrong: "x" });
    const moved = await checkSignature(l);
    const sig = l.signature as { id: string; attestation: { content_id: string } };
    sig.id = moved.recomputed_content_id;
    sig.attestation.content_id = moved.recomputed_content_id;
    const c = await checkSignature(l);
    expect(c.ed25519_verified).toBe(false);
    expect(c.state).toBe("INVALID_SIGNATURE");
  });

  it("corrupt signature bytes are INVALID_SIGNATURE, which is louder than STALE", async () => {
    const l = ledger();
    const sig = l.signature as { signature: string };
    sig.signature = sig.signature.slice(0, -2) + (sig.signature.endsWith("00") ? "11" : "00");
    expect((await checkSignature(l)).state).toBe("INVALID_SIGNATURE");
  });

  it("no signature is UNSIGNED — honest, and not confused with unverifiable", async () => {
    const l = ledger();
    delete l.signature;
    const c = await checkSignature(l);
    expect(c.state).toBe("UNSIGNED");
    expect(c.ed25519_verified).toBe(null);
  });

  it("publishes everything a third party needs to redo the check from the served bytes", async () => {
    const c = await checkSignature(ledger());
    expect(c.unsigned_wrapper_fields).toContain("signature");
    expect(c.unsigned_wrapper_fields).toContain("signature_check");
    expect(c.unsigned_wrapper_fields).toContain("correction_latency");
    expect(c.key).toBe("did:web:csoai.org#board-attestation-1");
    expect(c.key_ed25519_hex).toMatch(/^[0-9a-f]{64}$/);
    expect(c.how).toContain("ensure_ascii=True");
  });

  it("the signed attestation is ASCII-only, so one canonical rule covers it", () => {
    const att = (LEDGER.signature as { attestation: unknown }).attestation;
    // eslint-disable-next-line no-control-regex
    expect(/[-￿]/.test(JSON.stringify(att))).toBe(false);
  });
});
