import { describe, expect, it } from "vitest";
import { JOINED_SPECS, JOINED_SPECS_LOCK } from "./joinedSpecs";
import { cardSnippet } from "@/lib/embedSnippet";

describe("joined specs — pin list, not a monorepo", () => {
  it("is twelve rows pointing upstream, lockfile named not vendored", () => {
    expect(JOINED_SPECS).toHaveLength(12);
    expect(JOINED_SPECS_LOCK).toBe("council-os/registry/bindings.json");
    expect(JOINED_SPECS.every((s) => s.uri.startsWith("https://"))).toBe(true);
  });

  it("does not swallow Emilia / C2PA / SCITT trees into this repo", () => {
    for (const s of JOINED_SPECS) {
      expect(s.uri).not.toMatch(/CSOAI-ORG\/(emilia-protocol|c2pa-rs|scitt-ccf-ledger)/);
    }
    expect(JOINED_SPECS.find((s) => s.kind === "emilia")?.pin).toBe("e507acdf");
    expect(JOINED_SPECS.find((s) => s.kind === "ots")?.status).toBe("err");
    expect(JOINED_SPECS.find((s) => s.kind === "c2pa-manifest")?.uri).toContain("contentauth/c2pa-python");
  });

  it("glass snippet stays card-v1 — no Emilia Gate inside the paste", () => {
    const paste = cardSnippet("/signals/cross-border-card.signed.json");
    expect(paste).toContain("/embed/verify");
    expect(paste).not.toMatch(/emilia|c2pa-python|scitt|opentimestamps|xrpl/i);
  });
});
