import { describe, it, expect } from "vitest";
import { verifyMoatSurfaces, HIM_REQUIRED_LINKS } from "../verify-moat-surfaces.mjs";

describe("verify-moat-surfaces", () => {
  it("verifies all 5 CSOAI moat surface contracts and doctrine invariants", () => {
    const res = verifyMoatSurfaces();
    expect(res.ok).toBe(true);
    expect(res.checks).toHaveLength(5);
    expect(HIM_REQUIRED_LINKS).toHaveLength(4);
    for (const c of res.checks) {
      expect(c.status).toBe("PASS");
    }
  });
});
