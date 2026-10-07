/**
 * The shared card-v0/v1 verdict (functions/_lib/cardV0Verify.ts) on REAL estate-signed leaves.
 *
 * Every other test of this module signs with a throwaway key. These three leaves are copied from
 * committed public bytes (fixtures/card-leaves/archive-2026-09.json names each source line) and
 * are judged under the PINNED did:web:csoai.org#board-attestation-1 key, which is what a buyer's
 * check at /gspc-verify or POST /api/verify does.
 *
 * Paid-route lane, 7 Oct 2026: a card-v1 whole-card leaf (digest_covers
 * "whole-card-except-sha256-and-sig_ed25519") was judged by the payload-only rule and read
 * INVALID/sha256_mismatch on live POST /api/verify, a false failure on a genuine card.
 */
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isCardV0, verifyCardV0, WHOLE_CARD_COVERS } from "./cardV0Verify";
import { verifyRecord } from "../../client/src/lib/recordVerify";
import { onRequestPost } from "../api/verify";

const FIX = JSON.parse(readFileSync(resolve(__dirname, "../../fixtures/card-leaves/archive-2026-09.json"), "utf8"));
const judge = (c: any) => verifyCardV0(c, JSON.stringify(c));

describe("card verdict on real estate-signed leaves (pinned key)", () => {
  it("the fixtures are what they say: one card-v0, one signed and one unsigned whole-card card-v1", () => {
    expect(FIX.card_v0_signed.digest_covers).toBeUndefined();
    expect(FIX.card_v1_signed.digest_covers).toBe(WHOLE_CARD_COVERS);
    expect(FIX.card_v1_unsigned.sig_ed25519).toBeNull();
    for (const k of ["card_v0_signed", "card_v1_signed", "card_v1_unsigned"]) expect(isCardV0(FIX[k]), k).toBe(true);
  });

  it("a card-v0 leaf is VALID under the pinned board key", async () => {
    expect(await judge(FIX.card_v0_signed)).toMatchObject({ state: "VALID", family: "csoai.card-v0", reasons: [] });
  });

  it("a whole-card card-v1 leaf is VALID by the rule it declares (it read INVALID/sha256_mismatch)", async () => {
    const v = await judge(FIX.card_v1_signed);
    expect(v).toMatchObject({ state: "VALID", family: "csoai.card-v1", reasons: [] });
    expect(v.checks.find((c) => c.code === "signature_ok")?.detail).toMatch(/envelope \{did, schema, surface, as_of, sha256\}/);
  });

  it("an unsigned whole-card leaf is UNCHECKABLE/unsigned, not INVALID", async () => {
    expect(await judge(FIX.card_v1_unsigned)).toMatchObject({ state: "UNCHECKABLE", reasons: ["unsigned"] });
  });

  it("whole-card binds the fields outside the payload: a rewritten subject is INVALID", async () => {
    expect(await judge({ ...FIX.card_v1_signed, subject: "TAMPERED" })).toMatchObject({ state: "INVALID", reasons: ["sha256_mismatch"] });
    expect(await judge({ ...FIX.card_v0_signed, payload: { ...FIX.card_v0_signed.payload, holders: 1 } })).toMatchObject({ state: "INVALID", reasons: ["sha256_mismatch"] });
  });

  it("an unknown digest domain cannot steer tamper evidence away: under a pinned key it is judged by the payload rule", async () => {
    // the checker's case (7 Oct): a TAMPERED leaf plus any unknown digest_covers used to read UNCHECKABLE
    const tampered = { ...FIX.card_v0_signed, payload: { ...FIX.card_v0_signed.payload, holders: 1 }, digest_covers: "something-else" };
    expect(await judge(tampered)).toMatchObject({ state: "INVALID", reasons: ["sha256_mismatch"] });
    // a whole-card leaf whose declared domain is rewritten is tampered too
    expect(await judge({ ...FIX.card_v1_signed, digest_covers: "something-else" })).toMatchObject({ state: "INVALID", reasons: ["sha256_mismatch"] });
    // the untampered payload still verifies, and the odd declaration is recorded beside the verdict
    const v = await judge({ ...FIX.card_v0_signed, digest_covers: "something-else" });
    expect(v.state).toBe("VALID");
    expect(v.checks.map((c) => c.code)).toContain("digest_domain_not_issued");
  });

  it("under a key this verifier does not pin, an unknown digest domain stays UNCHECKABLE", async () => {
    const other = { ...FIX.card_v0_signed, did: "did:web:example.org#k1", digest_covers: "something-else" };
    expect(await judge(other)).toMatchObject({ state: "UNCHECKABLE", reasons: ["digest_domain_unknown"] });
  });

  it("POST /api/verify and the /gspc-verify page give the same verdict on the whole-card leaf", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 404 })));
    const r = await (onRequestPost as any)({
      request: new Request("https://councilof.ai/api/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(FIX.card_v1_signed) }),
    });
    const api = await r.json();
    expect(api.state).toBe("VALID");
    expect(api.family).toBe("csoai.card-v1");
    const page = await verifyRecord(JSON.stringify(FIX.card_v1_signed));
    expect(page.state).toBe("VALID");
    expect(page.family).toBe("csoai.card-v1");
    vi.unstubAllGlobals();
  });
});
