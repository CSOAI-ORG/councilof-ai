import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(resolve(__dirname, "GSPCVerify.tsx"), "utf8");
const catalogue = readFileSync(
  resolve(__dirname, "../components/gspc/PublicRootCatalogue.tsx"),
  "utf8",
);

describe("/gspc-verify two modes — estate card + signed public root", () => {
  it("keeps estate card verify and adds public-root inclusion", () => {
    expect(page).toContain('useState<"estate" | "public-root">');
    expect(page).toContain("PublicRootCatalogue");
    expect(page).toContain("Estate card");
    expect(page).toContain("Public-root catalogue");
    expect(page).toContain("RecordVerifyForm");
  });

  it("verifies the signed public-root envelope and keeps leaf signatures separate", () => {
    expect(catalogue).toContain("/root.json");
    expect(catalogue).toContain("NO_LAPTOP_SIGN");
    expect(catalogue).toContain("card_sha256");
    expect(catalogue).toContain("did:web:csoai.org#board-attestation-1");
    expect(catalogue).toContain("verifyRootSignature");
    expect(catalogue).toContain("verifyPublishedInclusion");
    expect(catalogue).toContain("does not individually sign the leaf");
  });

  it("paste-hash hits live /api/proof and binds the proof to the signed root", () => {
    expect(catalogue).toContain("/api/proof?sha=");
    expect(catalogue).toContain("verifyPublishedInclusion");
    expect(catalogue).toContain("UNCHECKABLE");
    expect(catalogue).toContain("Not a second scoreboard");
  });

  it("does not claim PQC-signed cards; current size, cap and ML-DSA-65 stay distinct", () => {
    expect(page).toContain("under 1KB");
    expect(page).toContain("3KB envelope ceiling is binding");
    expect(page).toContain("~3.3KB");
    expect(page).toContain("#board-pqc-1");
    expect(page).toContain("ABSENT");
    expect(page).toContain("UNCHECKABLE");
    expect(page).toContain("csoai/gspc-asi");
    expect(page).toContain("never a PQC-signed card");
  });

  it("does not expose the self-generated replay hash as chain verification", () => {
    expect(page).not.toContain("VerifyButton");
    expect(page).not.toContain("CHAIN_STATUS");
    expect(page).toContain("Chain replay is not claimed");
    expect(page).toContain("trusted reference hashes");
  });
});
