import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(resolve(__dirname, "XrplAttest.tsx"), "utf8");

describe("XRPL public-root catalogue — unsigned, /api/xrpl is 404", () => {
  it("points at /root.json and refuses a live /api/xrpl feed", () => {
    expect(page).toContain("/root.json");
    expect(page).toContain("/api/xrpl");
    expect(page).toMatch(/not live/i);
    expect(page).toContain("NO_LAPTOP_SIGN");
    expect(page).toMatch(/unsigned/i);
    expect(page).toContain("did:web:csoai.org#board-attestation-1");
    expect(page).not.toMatch(/XRPL DEVNET pointer/);
  });

  it("does not treat historical DEVNET hashes as the living feed", () => {
    expect(page).not.toContain("BC767FEF6497832908B2D208101E361C58A6C0B617C5D94419F9274826A77464");
    expect(page).not.toContain("958BA25801A068AEA1507FC1649A862C33D59A1D715924794D98D2C66254DC4B");
    expect(page).toMatch(/Historical XRPL DEVNET/);
  });
});
