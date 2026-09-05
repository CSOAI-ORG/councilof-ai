/**
 * twin.test.mjs — lib/cardVerify.mjs is a GENERATED copy of functions/_lib/cardVerify.ts.
 * Rebuild it into a temp dir and compare bytes: a drifted copy is a second verifier,
 * and the estate has exactly one. Bytes adjudicate, not the commit message.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildVerifier, EXT_ROOT } from "../scripts/build.mjs";

describe("generated verifier twin", () => {
  it("committed lib/cardVerify.mjs is byte-identical to a fresh build of functions/_lib/cardVerify.ts", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "gspc-ext-twin-"));
    try {
      const fresh = await buildVerifier(dir);
      const a = readFileSync(fresh, "utf8");
      const b = readFileSync(path.join(EXT_ROOT, "lib/cardVerify.mjs"), "utf8");
      expect(b).toBe(a);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("the generated module carries the pinned card-attestation key and the three families", async () => {
    const m = await import("../lib/cardVerify.mjs");
    expect(m.CARD_ATTESTATION_HEX).toBe("d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38");
    expect(m.PINNED_ANCHORS.map((a) => a.id)).toContain("did:web:csoai.org#board-attestation-1");
    expect(m.detectFamily({ id: "x", signature: "y", pubkey: "z", body: {} })).toBe("gspc.measurement-card");
  });
});
