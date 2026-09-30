/**
 * verify.merge-intents.test.ts — staging/integration-20260926.
 *
 * Two lanes rewrote the same branch of POST /api/verify:
 *   - publication-bus (522a1dc7c..04aa0061d) routes csoai.signed-run/0.1 records to signedRunVerify;
 *   - x402-ras-doors (64e556117) routes card-v0 records to verifyCardV0 via verdictFor().
 * The merge keeps both. This file pins that neither intent swallowed the other.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { onRequestPost, isCardV0 } from "./verify";
import { isSignedRun } from "../_lib/signedRunVerify";

const post = async (body: unknown) =>
  (await (onRequestPost as any)({
    request: new Request("https://councilof.ai/api/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
  })).json();

describe("POST /api/verify keeps both merged families", () => {
  it("a signed-run record still reaches the signed-run verifier", async () => {
    const doc = JSON.parse(readFileSync(new URL("../../public/claims/claimreg-ondo-chainlink-2026-09-22-rev2.signed.json", import.meta.url), "utf8"));
    expect(isSignedRun(doc)).toBe(true);
    expect(isCardV0(doc)).toBe(false);
    const b = await post(doc);
    expect(b.family).toBe("csoai.signed-run");
    expect(b.state).toBe("VALID");
  });

  it("a card-v0 record reaches the card-v0 rule, not the signed-run branch", async () => {
    const rec = { payload: { kind: "fixture", n: 1 }, sha256: "0".repeat(64), sig_ed25519: null };
    expect(isCardV0(rec)).toBe(true);
    expect(isSignedRun(rec)).toBe(false);
    const b = await post(rec);
    expect(b.family).not.toBe("csoai.signed-run");
    expect(["VALID", "INVALID", "UNCHECKABLE"]).toContain(b.state);
    expect(b.state).not.toBe("VALID");
  });
});
