import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { verifyArenaEloSignature } from "./arenaAttestation";

const fixture = JSON.parse(readFileSync(resolve(process.cwd(), "public/arena/elo_reference.json"), "utf8"));
const did = JSON.parse(readFileSync(resolve(process.cwd(), "public/.well-known/did.json"), "utf8"));

describe("published arena envelope", () => {
  it("verifies the real signed arena snapshot under the board DID key", async () => {
    const verdict = await verifyArenaEloSignature(fixture, did);
    expect(verdict).toMatchObject({ state: "VALID" });
  });

  it("rejects changes to the displayed scores before checking the signature", async () => {
    const altered = structuredClone(fixture);
    altered.leaderboard[0].elo += 1;
    expect((await verifyArenaEloSignature(altered, did)).state).toBe("INVALID");
  });

  it("rejects a substituted signature or DID key", async () => {
    const altered = structuredClone(fixture);
    altered.signature.sig_ed25519 = "00".repeat(64);
    expect((await verifyArenaEloSignature(altered, did)).state).toBe("INVALID");

    const differentDid = structuredClone(did);
    differentDid.verificationMethod.find((method: { id: string }) => method.id === fixture.signature.did).publicKeyJwk.x =
      "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    expect((await verifyArenaEloSignature(fixture, differentDid)).state).toBe("INVALID");
  });

  it("verifies offline under the pinned key and marks an absent signature uncheckable", async () => {
    expect((await verifyArenaEloSignature(fixture, null)).state).toBe("VALID");
    const unsigned = structuredClone(fixture);
    delete unsigned.signature;
    expect((await verifyArenaEloSignature(unsigned, did)).state).toBe("UNCHECKABLE");
  });
});
