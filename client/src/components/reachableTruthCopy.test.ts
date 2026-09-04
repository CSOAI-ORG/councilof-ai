import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const component = (name: string) => readFileSync(resolve(__dirname, name), "utf8");
const page = (name: string) => readFileSync(resolve(__dirname, "../pages", name), "utf8");

describe("reachable measurement copy keeps evidence boundaries explicit", () => {
  it("documents the actual axes array and optional separation evidence", () => {
    const api = page("ApiDocs.tsx");
    expect(api).toContain('"axes": [');
    expect(api).not.toContain('"axis": [');
    expect(api).toContain('a.get("separation")');
    expect(api).toContain('a.get("separation_p")');
    expect(api).toContain('a.get("separation_basis")');
    expect(api).toContain("firstAxis?.separation_basis");
    expect(api).toMatch(/uncarded fleet aggregates/i);
    expect(api).toMatch(/snapshot integrity/i);
  });

  it("limits recomputation copy to published carded records", () => {
    const hero = component("HeroSlides.tsx");
    const board = component("board/LiveLeaderboard.tsx");
    expect(hero).toMatch(/Published carded predicates can be re-checked/);
    expect(hero).not.toMatch(/Every verdict is a predicate an auditor can recompute/);
    expect(board).toMatch(/Carded records\s+carry a published verification path/);
    expect(board).not.toMatch(/recompute anything|recomputable signed records/i);
  });

  it("does not claim append-only storage for the corrections record", () => {
    const rail = component("lobby/LobbyReports.tsx");
    const attestations = component("DashboardAttestationsPane.tsx");
    expect(rail).toMatch(/source-maintained and version-controlled corrections/);
    expect(attestations).toMatch(/source-maintained and version-controlled corrections record/);
    expect(`${rail}\n${attestations}`).toMatch(/No append-only storage proof/);
    expect(`${rail}\n${attestations}`).not.toMatch(/Appended, never edited|Appended, never edited or deleted/);
  });

  it("keeps assistant, verifier, and claims-register labels within their evidence", () => {
    const council = page("CouncilSpace.tsx");
    expect(council).toMatch(/Grounded assistant response/);
    expect(council).toMatch(/No quorum, consensus, measurement, signature/);
    expect(council).toMatch(/No framework requirement is marked satisfied/);
    expect(council).not.toMatch(/Quorum forming|Consensus reached|LIVE - Council gateway|satisfied from one evidence set/);

    const verifierLinks = `${component("board/BoardAttestation.tsx")}\n${page("Methodology.tsx")}`;
    expect(verifierLinks.match(/Verify a signed card or root membership/g)).toHaveLength(2);
    expect(verifierLinks).not.toMatch(/Verify the chain/);

    const register = JSON.parse(readFileSync(resolve(__dirname, "../../../public/claims-register.json"), "utf8"));
    const boardClaim = register.claims.find((claim: { id: string }) => claim.id === "CR-010");
    const statusClaim = register.claims.find((claim: { id: string }) => claim.id === "CR-011");
    expect(boardClaim.notes).toMatch(/Model-comparison point estimates.*usable n>=30/);
    expect(boardClaim.notes).toMatch(/Deterministic fact rows.*denominator and unit/);
    expect(statusClaim.status).toBe("retired");
    expect(statusClaim.notes).toMatch(/quarantined for content review/);
  });
});
