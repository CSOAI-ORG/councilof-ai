import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { artifactCitation, cffBasics } from "./artifactCite";

const cff = readFileSync(resolve(__dirname, "../../../CITATION.cff"), "utf8");

describe("artifact citation from CITATION.cff", () => {
  it("reads title, author and url from CITATION.cff itself", () => {
    expect(cffBasics(cff)).toEqual({ title: "Council of AI", author: "CSOAI Ltd", url: "https://councilof.ai" });
    expect(cffBasics()).toEqual(cffBasics(cff));
  });
  it("cites the exact record bytes and the access date", () => {
    const t = artifactCitation({ href: "https://councilof.ai/x.json", sha256: "ab".repeat(32), bytes: 10 }, new Date("2026-10-14T12:00:00Z"), cff);
    expect(t).toBe(`CSOAI Ltd. Council of AI: signed record. https://councilof.ai/x.json (sha256 ${"ab".repeat(32)}, 10 bytes). https://councilof.ai. Accessed 2026-10-14. Measurement, not certification.`);
  });
  it("states a missing hash instead of inventing one", () => {
    expect(artifactCitation({ href: "https://councilof.ai/x.json" }, new Date("2026-10-14T00:00:00Z"), cff)).toContain("sha256 not computed");
  });
});
