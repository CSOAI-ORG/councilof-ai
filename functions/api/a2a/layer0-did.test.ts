// The kid on every /api/a2a/route envelope must resolve in the DID document (2026-11-16). Until this
// date it named did:web:csoai.org#layer0-attestation-1, which public/.well-known/did.json did not list,
// so a verifier following the kid found nothing. The live key itself is checked after deploy by
// comparing this entry with GET /api/a2a/key; a unit test cannot read the Pages secret.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { L0_KID_DEFAULT, kid } from "../../_lib/layer0";

const here = dirname(fileURLToPath(import.meta.url));
const did = JSON.parse(readFileSync(resolve(here, "../../../public/.well-known/did.json"), "utf8")) as {
  id: string;
  verificationMethod: Array<{ id: string; type: string; controller: string; publicKeyJwk?: Record<string, string> }>;
  assertionMethod: string[];
};

describe("the Layer 0 signing key is published where the kid points", () => {
  it("the default kid is a verification method of did:web:csoai.org, as an Ed25519 JWK", () => {
    expect(kid({})).toBe(L0_KID_DEFAULT);
    expect(L0_KID_DEFAULT.startsWith(`${did.id}#`)).toBe(true);
    const method = did.verificationMethod.find((m) => m.id === L0_KID_DEFAULT);
    expect(method, `${L0_KID_DEFAULT} is not in verificationMethod`).toBeTruthy();
    expect(method!.type).toBe("JsonWebKey2020");
    expect(method!.controller).toBe(did.id);
    expect(method!.publicKeyJwk).toMatchObject({ kty: "OKP", crv: "Ed25519", use: "sig" });
    expect(method!.publicKeyJwk!.x).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("the key may sign assertions, and no other method shares its id", () => {
    expect(did.assertionMethod).toContain(L0_KID_DEFAULT);
    expect(did.verificationMethod.filter((m) => m.id === L0_KID_DEFAULT)).toHaveLength(1);
  });
});
