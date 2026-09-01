import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(resolve(__dirname, "GSPCVerify.tsx"), "utf8");
const catalogue = readFileSync(
  resolve(__dirname, "../components/gspc/PublicRootCatalogue.tsx"),
  "utf8",
);

describe("/gspc-verify two modes — estate + unsigned public-root", () => {
  it("keeps estate card verify and adds public-root inclusion", () => {
    expect(page).toContain('useState<"estate" | "public-root">');
    expect(page).toContain("PublicRootCatalogue");
    expect(page).toContain("Estate card");
    expect(page).toContain("Public-root catalogue");
    expect(page).toContain("RecordVerifyForm");
  });

  it("public-root UI is unsigned / NO_LAPTOP_SIGN and loads /root.json", () => {
    expect(catalogue).toContain("/root.json");
    expect(catalogue).toContain("NO_LAPTOP_SIGN");
    expect(catalogue).toContain("card_sha256");
    expect(catalogue).toContain("did:web:csoai.org#board-attestation-1");
    expect(catalogue).toMatch(/unsigned/i);
    expect(catalogue).toContain("Do not fake Ed25519");
  });

  it("paste-hash hits live /api/proof inclusion; unsigned leaves stay UNCHECKABLE", () => {
    expect(catalogue).toContain("/api/proof?sha=");
    expect(catalogue).toContain("kind=inclusion");
    expect(catalogue).toContain("UNCHECKABLE");
    expect(catalogue).toContain("Not a second scoreboard");
  });

  it("does not claim PQC-signed cards; 3KB atom vs ML-DSA-65 size", () => {
    expect(page).toContain("3KB atom is binding");
    expect(page).toContain("~3.3KB");
    expect(page).toContain("#board-pqc-1");
    expect(page).toContain("ABSENT");
    expect(page).toContain("UNCHECKABLE");
    expect(page).toContain("csoai/gspc-asi");
    expect(page).toContain("never a PQC-signed card");
  });
});
