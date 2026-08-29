import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(resolve(__dirname, "XrplAttest.tsx"), "utf8");
const run = JSON.parse(
  readFileSync(resolve(__dirname, "../../../public/interop/xrpl-attest-run.json"), "utf8"),
);

describe("XRPL hashes — labelled, devnet, not a grade", () => {
  it("records two txs on XRPL DEVNET: memo vs CredentialCreate", () => {
    expect(run.network).toBe("XRPL DEVNET");
    expect(run.memo_attach_tx).toBe("BC767FEF6497832908B2D208101E361C58A6C0B617C5D94419F9274826A77464");
    expect(run.credential_attach_tx).toBe("958BA25801A068AEA1507FC1649A862C33D59A1D715924794D98D2C66254DC4B");
    expect(run.explorer[0]).toContain("devnet.xrpl.org");
    expect(run.explorer[1]).toContain("devnet.xrpl.org");
  });

  it("the page names kind + network and refuses a mainnet mint", () => {
    expect(page).toContain("Payment memo");
    expect(page).toContain("XLS-70 CredentialCreate");
    expect(page).toContain("{rec.network}");
    expect(page).toContain("did:web:csoai.org");
    expect(page).toContain("not did:xrpl");
    expect(page).toContain("DepositPreauth is not a product");
    expect(page).toContain("No mainnet mint");
    expect(page).not.toMatch(/mainnet is planned/i);
  });
});
